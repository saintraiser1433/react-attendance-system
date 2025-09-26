import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateScheduleSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  dayOfWeek: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    if (isNaN(num) || num < 0 || num > 6) {
      throw new Error("Day of week must be between 0-6");
    }
    return num;
  }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  room: z.string().optional(),
  department: z.string().optional(),
  year: z.string().min(1, "Year level is required"),
  sectionId: z.string().min(1, "Section is required"),
  academicYearId: z.string().optional(),
  semesterId: z.string().min(1, "Semester is required"),
});

// PUT /api/admin/schedules/[id] - Update schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session as any).user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Schedule update request body:", JSON.stringify(body, null, 2));
    
    let validatedData;
    try {
      validatedData = updateScheduleSchema.parse(body);
      console.log("Validated data:", JSON.stringify(validatedData, null, 2));
    } catch (error) {
      console.log("Validation error:", error);
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    
    const { id: scheduleId } = await params;

    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: scheduleId }
    });

    if (!existingSchedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // If academicYearId is not provided, use the existing schedule's academicYearId
    if (!validatedData.academicYearId) {
      validatedData.academicYearId = existingSchedule.academicYearId;
      console.log("Using existing academicYearId:", validatedData.academicYearId);
    }

    // Validate time format and logic
    const parseTime = (timeStr: string) => {
      // Handle 12-hour format (e.g., "8:00 AM", "5:00 PM")
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':');
        let hour24 = parseInt(hours, 10);
        
        if (period === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (period === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        
        return new Date(`1970-01-01T${hour24.toString().padStart(2, '0')}:${minutes}:00`);
      }
      
      // Handle 24-hour format (e.g., "08:00", "17:00")
      return new Date(`1970-01-01T${timeStr}:00`);
    };
    
    const startTime = parseTime(validatedData.startTime);
    const endTime = parseTime(validatedData.endTime);
    
    console.log("Parsed times:", {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      startTimeStr: validatedData.startTime,
      endTimeStr: validatedData.endTime
    });

    if (startTime >= endTime) {
      console.log("Time validation failed: startTime >= endTime");
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    // Update schedule
    const schedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        subjectId: validatedData.subjectId,
        teacherId: validatedData.teacherId,
        dayOfWeek: validatedData.dayOfWeek,
        startTime: startTime,
        endTime: endTime,
        room: validatedData.room,
        department: validatedData.department,
        year: validatedData.year,
        sectionId: validatedData.sectionId,
        academicYearId: validatedData.academicYearId,
        semesterId: validatedData.semesterId,
      },
      include: {
        subject: {
          select: {
            name: true,
            code: true
          }
        },
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            },
            department: {
              select: {
                name: true
              }
            }
          }
        },
        section: {
          select: {
            name: true,
            code: true
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
    });

    return NextResponse.json({ 
      schedule: {
        id: schedule.id,
        teacherId: schedule.teacherId,
        teacherName: schedule.teacher.user.name,
        subjectId: schedule.subjectId,
        subjectName: schedule.subject.name,
        subjectCode: schedule.subject.code,
        semesterId: schedule.semesterId,
        semesterName: schedule.semester.name,
        dayOfWeek: schedule.dayOfWeek,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][schedule.dayOfWeek],
        startTime: schedule.startTime.toTimeString().slice(0, 5),
        endTime: schedule.endTime.toTimeString().slice(0, 5),
        room: schedule.room,
        department: schedule.department || schedule.teacher.department?.name || 'N/A',
        year: schedule.year,
        section: schedule.section?.name || 'N/A',
        sectionId: schedule.sectionId,
        isActive: true,
        createdAt: schedule.createdAt.toISOString()
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error updating schedule:", error);
    return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
  }
}

// DELETE /api/admin/schedules/[id] - Delete schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session as any).user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: scheduleId } = await params;

    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        _count: {
          select: {
            attendance: true
          }
        }
      }
    });

    if (!existingSchedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // Check if schedule has active attendance
    if (existingSchedule._count.attendance > 0) {
      return NextResponse.json({ 
        error: "Cannot delete schedule with attendance records" 
      }, { status: 400 });
    }

    await prisma.schedule.delete({
      where: { id: scheduleId }
    });

    return NextResponse.json({ message: "Schedule deleted successfully" });

  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 });
  }
}
