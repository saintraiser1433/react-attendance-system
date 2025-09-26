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
    const scheduleId = searchParams.get('scheduleId');
    const todayOnly = searchParams.get('todayOnly') === 'true';

    if (!scheduleId) {
      return NextResponse.json({ error: "Schedule ID is required" }, { status: 400 });
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

    // Verify that the schedule belongs to this teacher
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        teacherId: teacherId
      },
      include: {
        subject: {
          select: {
            code: true,
            name: true
          }
        }
      }
    });

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found or unauthorized" }, { status: 404 });
    }

    // Get attendance history for this schedule
    const whereClause: any = {
      enrollment: {
        subjectId: schedule.subjectId
      }
    };

    // Add today filter if requested
    if (todayOnly) {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      whereClause.date = {
        gte: startOfDay,
        lt: endOfDay
      };
    }

    const attendanceHistory = await prisma.attendance.findMany({
      where: whereClause,
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
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the history data
    const formattedHistory = attendanceHistory.map(attendance => {
      const timeIn = attendance.timeIn ? formatDateToManilaTime12Hour(attendance.timeIn) : '';
      const timeOut = attendance.timeOut ? formatDateToManilaTime12Hour(attendance.timeOut) : null;
      
      // Calculate if student was late
      const scheduleStartTime = schedule.startTime.toTimeString().slice(0, 5);
      const [hours, minutes] = scheduleStartTime.split(':');
      const scheduleTime = new Date();
      scheduleTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const attendanceTime = attendance.timeIn || attendance.scannedAt || attendance.date;
      const isLate = attendanceTime > scheduleTime;
      const lateMinutes = isLate ? Math.floor((attendanceTime.getTime() - scheduleTime.getTime()) / (1000 * 60)) : 0;

      return {
        id: attendance.id,
        studentId: attendance.enrollment.student.studentId,
        studentName: attendance.enrollment.student.user.name,
        subjectCode: attendance.enrollment.subject.code,
        subjectName: attendance.enrollment.subject.name,
        date: attendance.date.toISOString().split('T')[0],
        timeIn: timeIn,
        timeOut: timeOut,
        isLate: isLate,
        lateMinutes: lateMinutes,
        status: attendance.status === 'LATE' ? 'late' : 'present',
        room: schedule.room || 'N/A',
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][schedule.dayOfWeek]
      };
    });

    return NextResponse.json({ 
      history: formattedHistory,
      schedule: {
        subjectCode: schedule.subject.code,
        subjectName: schedule.subject.name,
        room: schedule.room,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][schedule.dayOfWeek]
      }
    });

  } catch (error) {
    console.error("Error fetching attendance history:", error);
    return NextResponse.json({ error: "Failed to fetch attendance history" }, { status: 500 });
  }
}








