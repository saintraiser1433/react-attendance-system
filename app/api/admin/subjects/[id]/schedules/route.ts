import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// Helper function to convert 24-hour time to 12-hour format
function formatTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${minutes} ${ampm}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session as any).user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get schedules for this subject (all schedules, not just active ones)
    const schedules = await prisma.schedule.findMany({
      where: {
        subjectId: id
      },
      include: {
        section: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Format schedules for frontend
    const formattedSchedules = schedules.map(schedule => ({
      id: schedule.id,
      dayOfWeek: schedule.dayOfWeek,
      startTime: formatTo12Hour(schedule.startTime.toTimeString().slice(0, 5)),
      endTime: formatTo12Hour(schedule.endTime.toTimeString().slice(0, 5)),
      room: schedule.room || "",
      department: schedule.department || "",
      year: schedule.year || "",
      section: schedule.section?.name || null,
      sectionId: schedule.sectionId
    }));

    return NextResponse.json({ schedules: formattedSchedules });

  } catch (error) {
    console.error("Get subject schedules error:", error);
    return NextResponse.json(
      { error: "Failed to get subject schedules" },
      { status: 500 }
    );
  }
}








