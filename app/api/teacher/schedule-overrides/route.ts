import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createOverrideSchema = z.object({
  scheduleId: z.string().min(1, "Schedule ID is required"),
  date: z.string().min(1, "Date is required"),
  reason: z.string().min(1, "Reason is required"),
  overrideType: z.enum(["time-change", "cancel"]),
  newStartTime: z.string().optional(),
  newEndTime: z.string().optional(),
});

// GET /api/teacher/schedule-overrides - Get teacher's schedule overrides
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Get overrides for teacher's schedules
    const overrides = await prisma.scheduleOverride.findMany({
      where: {
        schedule: {
          teacherId: teacher.id
        }
      },
      include: {
        schedule: {
          include: {
            subject: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    const formattedOverrides = overrides.map(override => ({
      id: override.id,
      scheduleId: override.scheduleId,
      subjectName: override.schedule.subject.name,
      subjectCode: override.schedule.subject.code,
      date: override.date.toISOString().split('T')[0],
      reason: override.reason,
      overrideType: override.overrideType,
      newStartTime: override.newStartTime ? override.newStartTime.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
      newEndTime: override.newEndTime ? override.newEndTime.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
      status: override.status,
      adminNotes: override.adminNotes,
      createdAt: override.createdAt.toISOString().split('T')[0],
    }));

    return NextResponse.json({ overrides: formattedOverrides });
  } catch (error) {
    console.error("Error fetching schedule overrides:", error);
    return NextResponse.json({ error: "Failed to fetch schedule overrides" }, { status: 500 });
  }
}

// POST /api/teacher/schedule-overrides - Create new schedule override request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = createOverrideSchema.parse(body);

    // Verify the schedule belongs to this teacher
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: validatedData.scheduleId,
        teacherId: teacher.id
      }
    });

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found or not assigned to you" }, { status: 404 });
    }

    // Check if there's already an override for this schedule on this date
    const existingOverride = await prisma.scheduleOverride.findFirst({
      where: {
        scheduleId: validatedData.scheduleId,
        date: new Date(validatedData.date)
      }
    });

    if (existingOverride) {
      return NextResponse.json({ 
        error: "An override request already exists for this schedule on this date" 
      }, { status: 400 });
    }

    // Create the override request
    const override = await prisma.scheduleOverride.create({
      data: {
        scheduleId: validatedData.scheduleId,
        date: new Date(validatedData.date),
        reason: validatedData.reason,
        overrideType: validatedData.overrideType,
        newStartTime: validatedData.newStartTime ? new Date(`1970-01-01T${validatedData.newStartTime}:00`) : null,
        newEndTime: validatedData.newEndTime ? new Date(`1970-01-01T${validatedData.newEndTime}:00`) : null,
        status: "PENDING"
      },
      include: {
        schedule: {
          include: {
            subject: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      }
    });

    const formattedOverride = {
      id: override.id,
      scheduleId: override.scheduleId,
      subjectName: override.schedule.subject.name,
      subjectCode: override.schedule.subject.code,
      date: override.date.toISOString().split('T')[0],
      reason: override.reason,
      overrideType: override.overrideType,
      newStartTime: override.newStartTime ? override.newStartTime.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
      newEndTime: override.newEndTime ? override.newEndTime.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
      status: override.status,
      adminNotes: override.adminNotes,
      createdAt: override.createdAt.toISOString().split('T')[0],
    };

    return NextResponse.json({ override: formattedOverride }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error creating schedule override:", error);
    return NextResponse.json({ error: "Failed to create schedule override" }, { status: 500 });
  }
}







