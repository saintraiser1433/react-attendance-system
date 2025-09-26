import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/student/attendance - Get student's attendance records
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the student record for the logged-in user
    const student = await prisma.student.findUnique({
      where: {
        userId: (session.user as any).id
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        department: {
          select: {
            name: true
          }
        },
        section: {
          select: {
            name: true
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 });
    }

    // Get active academic year and semester from settings
    const settings = await prisma.setting.findUnique({
      where: { id: "singleton" }
    });

    if (!settings?.activeAcademicYearId || !settings?.activeSemesterId) {
      return NextResponse.json({ error: 'No active academic year or semester found' }, { status: 400 });
    }

    // Get attendance records for this student filtered by active academic year and semester
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        enrollment: {
          studentId: student.id,
          academicYearId: settings.activeAcademicYearId,
          semesterId: settings.activeSemesterId
        }
      },
      include: {
        enrollment: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                teacher: {
                  include: {
                    user: {
                      select: {
                        name: true
                      }
                    }
                  }
                },
                schedules: {
                  select: {
                    dayOfWeek: true,
                    startTime: true
                  }
                }
              }
            },
            academicYear: {
              select: {
                name: true
              }
            },
            semester: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Group attendance by subject
    const subjectGroups: Record<string, any> = {};
    
    attendanceRecords.forEach(record => {
      const subjectKey = record.enrollment.subject.id;
      const subjectInfo = {
        id: record.enrollment.subject.id,
        code: record.enrollment.subject.code,
        name: record.enrollment.subject.name,
        teacher: record.enrollment.subject.teacher?.user.name || 'N/A',
        academicYear: record.enrollment.academicYear.name,
        semester: record.enrollment.semester.name
      };

      if (!subjectGroups[subjectKey]) {
        subjectGroups[subjectKey] = {
          subject: subjectInfo,
          records: [],
          stats: {
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            attendanceRate: 0
          }
        };
      }

      // Calculate late minutes for this record
      let lateMinutes = 0;
      if (record.timeIn && (record.status === 'PRESENT' || record.status === 'LATE')) {
        // Get the schedule for the same day of week as the attendance date
        const attendanceDate = new Date(record.date);
        const dayOfWeek = attendanceDate.getDay();
        
        const matchingSchedule = record.enrollment.subject.schedules.find(
          schedule => schedule.dayOfWeek === dayOfWeek
        );
        
        if (matchingSchedule && record.timeIn) {
          const scheduleStartTime = new Date(matchingSchedule.startTime);
          const attendanceTime = new Date(record.timeIn);
          
          // Compare only the time portion (ignore date)
          const scheduleTimeOnly = new Date();
          scheduleTimeOnly.setHours(scheduleStartTime.getHours(), scheduleStartTime.getMinutes(), 0, 0);
          
          const attendanceTimeOnly = new Date();
          attendanceTimeOnly.setHours(attendanceTime.getHours(), attendanceTime.getMinutes(), 0, 0);
          
          if (attendanceTimeOnly > scheduleTimeOnly) {
            lateMinutes = Math.floor((attendanceTimeOnly.getTime() - scheduleTimeOnly.getTime()) / (1000 * 60));
          }
        }
      }

      const attendanceRecord = {
        id: record.id,
        date: record.date.toISOString().split('T')[0],
        status: record.status,
        timeIn: record.timeIn ? record.timeIn.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }) : null,
        timeOut: record.timeOut ? record.timeOut.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }) : null,
        lateMinutes: lateMinutes,
        note: record.note,
        createdAt: record.createdAt.toISOString().split('T')[0]
      };

      subjectGroups[subjectKey].records.push(attendanceRecord);
      
      // Update stats
      subjectGroups[subjectKey].stats.total++;
      if (record.status === 'PRESENT') {
        subjectGroups[subjectKey].stats.present++;
      } else if (record.status === 'ABSENT') {
        subjectGroups[subjectKey].stats.absent++;
      } else if (record.status === 'LATE') {
        subjectGroups[subjectKey].stats.late++;
      }
    });

    // Calculate attendance rates (PRESENT + LATE = attended)
    Object.values(subjectGroups).forEach((group: any) => {
      const attended = group.stats.present + group.stats.late;
      group.stats.attendanceRate = group.stats.total > 0 
        ? Math.round((attended / group.stats.total) * 100) 
        : 0;
    });

    // Convert to array and sort by subject code
    const categorizedAttendance = Object.values(subjectGroups).sort((a: any, b: any) => 
      a.subject.code.localeCompare(b.subject.code)
    );

    // Calculate overall stats
    const totalRecords = attendanceRecords.length;
    const totalPresent = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    const totalAbsent = attendanceRecords.filter(r => r.status === 'ABSENT').length;
    const totalLate = attendanceRecords.filter(r => r.status === 'LATE').length;
    const totalAttended = totalPresent + totalLate; // PRESENT + LATE = attended
    const overallAttendanceRate = totalRecords > 0 ? Math.round((totalAttended / totalRecords) * 100) : 0;

    return NextResponse.json({ 
      categorizedAttendance,
      overallStats: {
        totalRecords,
        totalPresent,
        totalAbsent,
        totalLate,
        overallAttendanceRate,
        totalSubjects: categorizedAttendance.length
      },
      studentInfo: {
        name: student.user.name,
        studentId: student.studentId,
        department: student.department.name,
        section: student.section?.name || 'N/A',
        yearLevel: student.yearLevel
      }
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ error: "Failed to fetch attendance records" }, { status: 500 });
  }
}
