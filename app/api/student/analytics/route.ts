import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session as any).user?.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session as any).user?.id;

    // Get student data
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        user: true,
        department: true,
        section: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        enrollments: {
          include: {
            subject: {
              include: {
                teacher: {
                  include: {
                    user: true
                  }
                }
              }
            },
            attendance: true,
            academicYear: true,
            semester: true
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get current academic year and semester
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
      include: {
        semesters: {
          where: { isActive: true }
        }
      }
    });

    // Calculate attendance stats
    const allAttendanceRecords = student.enrollments.flatMap(enrollment => enrollment.attendance);
    const presentRecords = allAttendanceRecords.filter(record => record.status === 'PRESENT');
    const absentRecords = allAttendanceRecords.filter(record => record.status === 'ABSENT');

    const attendanceRate = allAttendanceRecords.length > 0
      ? Math.round((presentRecords.length / allAttendanceRecords.length) * 100)
      : 0;

    // Get this month's attendance
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const monthlyAttendance = await prisma.attendance.count({
      where: {
        enrollment: {
          studentId: student.id
        },
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const monthlyPresent = await prisma.attendance.count({
      where: {
        enrollment: {
          studentId: student.id
        },
        status: 'PRESENT',
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    // Get enrolled subjects count
    const enrolledSubjects = student.enrollments.filter(enrollment => 
      enrollment.academicYearId === currentAcademicYear?.id &&
      enrollment.semesterId === currentAcademicYear?.semesters[0]?.id
    ).length;

    // Get subject-wise attendance
    const subjectAttendance = student.enrollments.map(enrollment => {
      const attendance = enrollment.attendance;
      const present = attendance.filter(att => att.status === 'PRESENT').length;
      const total = attendance.length;
      const rate = total > 0 ? (present / total) * 100 : 0;

      return {
        subject: enrollment.subject.name,
        teacher: enrollment.subject.teacher?.user?.name || "Unassigned",
        attendance: present,
        total: total,
        rate: Math.round(rate)
      };
    });

    return NextResponse.json({
      profile: {
        studentId: student.studentId,
        name: student.user.name,
        email: student.user.email,
        department: student.department.name,
        section: student.section?.name || "N/A",
        sectionId: student.sectionId,
        yearLevel: student.yearLevel || "N/A",
        academicYear: currentAcademicYear?.name || "N/A"
      },
      stats: {
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        classesAttended: `${monthlyPresent}/${monthlyAttendance}`,
        enrolledSubjects,
        totalAttendance: allAttendanceRecords.length,
        presentCount: presentRecords.length,
        absentCount: absentRecords.length
      },
      subjectAttendance
    });

  } catch (error) {
    console.error("Student analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch student analytics data" },
      { status: 500 }
    );
  }
}












