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

    // Get current active academic year and semester from settings
    const settings = await prisma.setting.findUnique({
      where: { id: "singleton" }
    });

    if (!settings?.activeAcademicYearId || !settings?.activeSemesterId) {
      return NextResponse.json({ 
        schedules: [],
        message: "No active academic year or semester found"
      });
    }

    const activeAcademicYear = await prisma.academicYear.findUnique({
      where: { id: settings.activeAcademicYearId }
    });

    const activeSemester = await prisma.semester.findUnique({
      where: { id: settings.activeSemesterId }
    });

    if (!activeAcademicYear || !activeSemester) {
      return NextResponse.json({ 
        schedules: [],
        message: "Active academic year or semester not found"
      });
    }

    // Get teacher's schedules for current semester
    const schedules = await prisma.schedule.findMany({
      where: {
        teacherId: id,
        academicYearId: activeAcademicYear.id,
        semesterId: activeSemester.id
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true
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
      subject: {
        id: schedule.subject.id,
        name: schedule.subject.name,
        code: schedule.subject.code
      }
    }));

    // Get teacher info
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      schedules: formattedSchedules,
      teacher: teacher ? {
        id: teacher.id,
        name: teacher.user?.name || 'Unknown',
        email: teacher.user?.email || '',
        employeeId: teacher.employeeId
      } : null,
      academicYear: {
        id: activeAcademicYear.id,
        name: activeAcademicYear.name
      },
      semester: {
        id: activeSemester.id,
        name: activeSemester.name
      }
    });

  } catch (error) {
    console.error("Get teacher schedule error:", error);
    return NextResponse.json(
      { error: "Failed to get teacher schedule" },
      { status: 500 }
    );
  }
}








