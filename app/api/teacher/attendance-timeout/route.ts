import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const timeoutAttendanceSchema = z.object({
  attendanceId: z.string().min(1, "Attendance ID is required"),
});

// POST /api/teacher/attendance-timeout - Mark attendance as timed out
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session as any).user?.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = timeoutAttendanceSchema.parse(body);

    // Check if attendance exists and belongs to teacher's schedule
    const attendance = await prisma.attendance.findUnique({
      where: { id: validatedData.attendanceId },
      include: {
        enrollment: {
          include: {
            subject: {
              include: {
                teacher: true
              }
            }
          }
        }
      }
    });

    if (!attendance) {
      return NextResponse.json({ error: "Attendance not found" }, { status: 404 });
    }

    // Check if the teacher owns this schedule
    const teacherId = (session as any).user?.id;
    if (!attendance.enrollment.subject.teacher || attendance.enrollment.subject.teacher.userId !== teacherId) {
      return NextResponse.json({ error: "Unauthorized to modify this attendance" }, { status: 403 });
    }

    // Check if attendance is already completed
    if (attendance.timeOut) {
      return NextResponse.json({ error: "Attendance already completed" }, { status: 400 });
    }

    // Update attendance with timeout
    const updatedAttendance = await prisma.attendance.update({
      where: { id: validatedData.attendanceId },
      data: {
        timeOut: new Date(),
        status: 'ABSENT'
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
            }
          }
        }
      }
    });

    return NextResponse.json({ 
      message: "Attendance marked as timed out",
      attendance: {
        id: updatedAttendance.id,
        studentName: updatedAttendance.enrollment.student.user.name,
        timeIn: updatedAttendance.timeIn,
        timeOut: updatedAttendance.timeOut,
        status: updatedAttendance.status
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error timing out attendance:", error);
    return NextResponse.json({ error: "Failed to timeout attendance" }, { status: 500 });
  }
}
