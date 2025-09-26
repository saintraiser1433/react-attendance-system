import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { formatDateToManilaTime12Hour } from "@/lib/timezone";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session as any).user?.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    // Get teacher ID from session
    const userId = (session as any).user?.id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    // Get teacher record to get teacherId
    const teacher = await prisma.teacher.findUnique({
      where: { userId: userId }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher record not found" }, { status: 400 });
    }

    const teacherId = teacher.id;

    // Get student's attendance records for this teacher's subjects
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        enrollment: {
          student: {
            studentId: studentId
          },
          subject: {
            teacherId: teacherId
          }
        }
      },
      include: {
        enrollment: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            },
            subject: {
              select: {
                code: true,
                name: true,
                schedules: {
                  select: {
                    startTime: true,
                    endTime: true,
                    dayOfWeek: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Increased limit to get more records
    });

    // Format the attendance data
    const formattedRecords = attendanceRecords.map(attendance => {
      const timeIn = attendance.timeIn ? formatDateToManilaTime12Hour(attendance.timeIn) : '';
      const timeOut = attendance.timeOut ? formatDateToManilaTime12Hour(attendance.timeOut) : null;
      
      // Calculate late minutes for this record
      let lateMinutes = 0;
      if (attendance.timeIn && attendance.status === 'PRESENT') {
        // Get the schedule for the same day of week as the attendance date
        const attendanceDate = new Date(attendance.date);
        const dayOfWeek = attendanceDate.getDay();
        
        const matchingSchedule = attendance.enrollment.subject.schedules.find(
          schedule => schedule.dayOfWeek === dayOfWeek
        );
        
        if (matchingSchedule && attendance.timeIn) {
          const scheduleStartTime = new Date(matchingSchedule.startTime);
          const attendanceTime = new Date(attendance.timeIn);
          
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
      
      return {
        id: attendance.id,
        studentName: attendance.enrollment.student.user.name,
        subjectCode: attendance.enrollment.subject.code,
        subjectName: attendance.enrollment.subject.name,
        date: attendance.date.toISOString().split('T')[0],
        timeIn: timeIn,
        timeOut: timeOut,
        status: attendance.status === 'LATE' ? 'late' : 'present',
        lateMinutes: lateMinutes,
        createdAt: attendance.createdAt.toISOString().split('T')[0]
      };
    });

    // Calculate analytics
    const totalRecords = formattedRecords.length;
    const presentRecords = formattedRecords.filter(r => r.status === 'present').length;
    const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
    
    // Group by subject and calculate late minutes
    const subjectGroups = formattedRecords.reduce((acc, record) => {
      const key = `${record.subjectCode} - ${record.subjectName}`;
      if (!acc[key]) {
        acc[key] = {
          subjectCode: record.subjectCode,
          subjectName: record.subjectName,
          records: [],
          totalRecords: 0,
          presentRecords: 0,
          lateRecords: 0,
          totalLateMinutes: 0,
          attendanceRate: 0,
          averageLateMinutes: 0
        };
      }
      
      // Calculate late minutes for this record
      let lateMinutes = 0;
      if (record.timeIn && record.status === 'present') {
        // Find the corresponding attendance record to get schedule info
        const attendanceRecord = attendanceRecords.find(a => a.id === record.id);
        if (attendanceRecord && attendanceRecord.enrollment.subject.schedules.length > 0) {
          // Get the schedule for the same day of week as the attendance date
          const attendanceDate = new Date(attendanceRecord.date);
          const dayOfWeek = attendanceDate.getDay();
          
          const matchingSchedule = attendanceRecord.enrollment.subject.schedules.find(
            schedule => schedule.dayOfWeek === dayOfWeek
          );
          
          if (matchingSchedule && attendanceRecord.timeIn) {
            const scheduleStartTime = new Date(matchingSchedule.startTime);
            const attendanceTime = new Date(attendanceRecord.timeIn);
            
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
      }
      
      const recordWithLateMinutes = {
        ...record,
        lateMinutes: lateMinutes
      };
      
      acc[key].records.push(recordWithLateMinutes);
      acc[key].totalRecords++;
      
      if (record.status === 'present') {
        acc[key].presentRecords++;
        if (lateMinutes > 0) {
          acc[key].lateRecords++;
          acc[key].totalLateMinutes += lateMinutes;
        }
      }
      
      acc[key].attendanceRate = Math.round((acc[key].presentRecords / acc[key].totalRecords) * 100);
      acc[key].averageLateMinutes = acc[key].lateRecords > 0 
        ? Math.round(acc[key].totalLateMinutes / acc[key].lateRecords) 
        : 0;
      
      return acc;
    }, {} as any);

    // Get unique subjects for filtering
    const uniqueSubjects = Object.keys(subjectGroups).map(key => ({
      code: subjectGroups[key].subjectCode,
      name: subjectGroups[key].subjectName,
      fullName: key
    }));

    return NextResponse.json({ 
      records: formattedRecords,
      studentName: formattedRecords[0]?.studentName || 'Unknown Student',
      analytics: {
        totalRecords,
        presentRecords,
        attendanceRate,
        subjectGroups: Object.values(subjectGroups),
        uniqueSubjects
      }
    });

  } catch (error) {
    console.error("Error fetching student attendance:", error);
    return NextResponse.json({ error: "Failed to fetch student attendance" }, { status: 500 });
  }
}








