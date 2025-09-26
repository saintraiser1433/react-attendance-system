import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createManilaTime, formatDateToManilaTime12Hour } from "@/lib/timezone";

// Helper function to convert 24-hour time to 12-hour format
function formatTo12Hour(time24: string): string {
  try {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  } catch (error) {
    console.error('Error formatting time:', time24, error);
    return time24; // Return original time if formatting fails
  }
}

const createScheduleSchema = z.object({
  teacherId: z.string().min(1, "Teacher is required"),
  subjectId: z.string().min(1, "Subject is required"),
  semesterId: z.string().min(1, "Semester is required"),
  dayOfWeek: z.string().min(1, "Day of week is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  room: z.string().optional(),
  department: z.string().optional(),
  year: z.string().optional(),
  sectionId: z.string().optional(),
});

// GET /api/admin/schedules - Get all schedules
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schedules = await prisma.schedule.findMany({
      include: {
        teacher: {
          include: {
            user: {
              select: {
                name: true,
              }
            }
          }
        },
        subject: {
          select: {
            name: true,
            code: true,
          }
        },
        semester: {
          select: {
            name: true,
          }
        },
        academicYear: {
          select: {
            name: true,
          }
        },
        section: {
          select: {
            name: true,
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    const formattedSchedules = schedules.map(schedule => {
      try {
        return {
          id: schedule.id,
          teacherId: schedule.teacherId,
          teacherName: schedule.teacher?.user?.name || 'Unknown Teacher',
          subjectId: schedule.subjectId,
          subjectName: schedule.subject?.name || 'Unknown Subject',
          subjectCode: schedule.subject?.code || 'N/A',
          academicYearId: schedule.academicYearId,
          semesterId: schedule.semesterId,
          semesterName: schedule.semester?.name || 'Unknown Semester',
          academicYearName: schedule.academicYear?.name || 'Unknown Academic Year',
          dayOfWeek: schedule.dayOfWeek,
          dayName: getDayName(schedule.dayOfWeek),
          startTime: formatDateToManilaTime12Hour(schedule.startTime),
          endTime: formatDateToManilaTime12Hour(schedule.endTime),
          room: schedule.room,
          department: (schedule as any).department,
          year: (schedule as any).year,
          section: schedule.section?.name || null,
          sectionId: schedule.sectionId || null,
          isActive: true, // Since we're showing all schedules, mark all as active
          createdAt: schedule.createdAt.toISOString().split('T')[0],
        };
      } catch (error) {
        console.error('Error formatting schedule:', schedule.id, error);
        return {
          id: schedule.id,
          teacherId: schedule.teacherId,
          teacherName: 'Error',
          subjectId: schedule.subjectId,
          subjectName: 'Error',
          subjectCode: 'Error',
          academicYearId: schedule.academicYearId,
          semesterId: schedule.semesterId,
          semesterName: 'Error',
          academicYearName: 'Error',
          dayOfWeek: schedule.dayOfWeek,
          dayName: 'Error',
          startTime: 'Error',
          endTime: 'Error',
          room: schedule.room,
          department: (schedule as any).department,
          year: (schedule as any).year,
          section: schedule.section?.name || null,
          sectionId: schedule.sectionId || null,
          isActive: false,
          createdAt: 'Error',
        };
      }
    });

    return NextResponse.json({ schedules: formattedSchedules });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
  }
}

// POST /api/admin/schedules - Create new schedule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createScheduleSchema.parse(body);

    // Validate time format and logic - create times in Manila timezone
    const startTime = createManilaTime(validatedData.startTime);
    const endTime = createManilaTime(validatedData.endTime);

    if (startTime >= endTime) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    // Check for conflicts with existing schedules
    const conflictingSchedule = await prisma.schedule.findFirst({
      where: {
        teacherId: validatedData.teacherId,
        semesterId: validatedData.semesterId,
        dayOfWeek: parseInt(validatedData.dayOfWeek),
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    });

    if (conflictingSchedule) {
      return NextResponse.json({ 
        error: "Schedule conflict: Teacher already has a class at this time" 
      }, { status: 400 });
    }

    // Verify teacher and subject relationship
    const subject = await prisma.subject.findFirst({
      where: {
        id: validatedData.subjectId,
        teacherId: validatedData.teacherId
      }
    });

    if (!subject) {
      return NextResponse.json({ 
        error: "Subject is not assigned to this teacher" 
      }, { status: 400 });
    }

    // Get semester info for academic year
    const semester = await prisma.semester.findUnique({
      where: { id: validatedData.semesterId }
    });

    if (!semester) {
      return NextResponse.json({ error: "Semester not found" }, { status: 404 });
    }

    const schedule = await prisma.schedule.create({
      data: {
        teacherId: validatedData.teacherId,
        subjectId: validatedData.subjectId,
        semesterId: validatedData.semesterId,
        academicYearId: semester.academicYearId,
        dayOfWeek: parseInt(validatedData.dayOfWeek),
        startTime: startTime,
        endTime: endTime,
        room: validatedData.room || null,
        department: validatedData.department || null,
        year: validatedData.year || null,
        sectionId: validatedData.sectionId && validatedData.sectionId.trim() !== "" ? validatedData.sectionId : null,
      } as any,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                name: true,
              }
            }
          }
        },
        subject: {
          select: {
            name: true,
            code: true,
          }
        },
        semester: {
          select: {
            name: true,
          }
        },
        academicYear: {
          select: {
            name: true,
          }
        },
        section: {
          select: {
            name: true,
          }
        }
      }
    });

    // Get current active semester
    const settings = await prisma.setting.findUnique({
      where: { id: "singleton" }
    });

    const formattedSchedule = {
      id: schedule.id,
      teacherId: schedule.teacherId,
      teacherName: (schedule as any).teacher?.user?.name || 'Unknown Teacher',
      subjectId: schedule.subjectId,
      subjectName: (schedule as any).subject?.name || 'Unknown Subject',
      subjectCode: (schedule as any).subject?.code || 'N/A',
      semesterId: schedule.semesterId,
      semesterName: (schedule as any).semester?.name || 'Unknown Semester',
      academicYearName: (schedule as any).academicYear?.name || 'Unknown Academic Year',
      dayOfWeek: schedule.dayOfWeek,
      dayName: getDayName(schedule.dayOfWeek),
      startTime: formatDateToManilaTime12Hour(schedule.startTime),
      endTime: formatDateToManilaTime12Hour(schedule.endTime),
      room: schedule.room,
      department: (schedule as any).department,
      year: (schedule as any).year,
      section: schedule.section?.name || null,
      sectionId: schedule.sectionId || null,
      isActive: settings?.activeSemesterId === schedule.semesterId,
      createdAt: schedule.createdAt.toISOString().split('T')[0],
    };

    return NextResponse.json({ schedule: formattedSchedule }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error creating schedule:", error);
    return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 });
  }
}

function getDayName(dayOfWeek: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayOfWeek] || "Unknown";
}
