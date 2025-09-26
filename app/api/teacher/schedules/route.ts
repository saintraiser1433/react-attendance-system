import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true
      }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Get active academic year and semester from settings
    const settings = await prisma.setting.findUnique({
      where: { id: "singleton" }
    });

    if (!settings?.activeAcademicYearId || !settings?.activeSemesterId) {
      return NextResponse.json({ error: 'No active academic year or semester found' }, { status: 400 });
    }

    // Get schedules for teacher's subjects filtered by active academic year and semester
    const schedules = await prisma.schedule.findMany({
      where: {
        subject: {
          teacherId: teacher.id
        },
        academicYearId: settings.activeAcademicYearId,
        semesterId: settings.activeSemesterId
      },
      include: {
        subject: {
          include: {
            course: {
              include: {
                department: true
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
            id: true,
            name: true
          }
        },
        semester: {
          select: {
            id: true,
            name: true
          }
        },
        overrides: {
          where: {
            status: 'APPROVED'
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Format schedules with override information
    const formattedSchedules = schedules.map(schedule => {
      const today = new Date().toISOString().split('T')[0];
      const todayOverride = schedule.overrides.find(override => {
        const overrideDate = new Date(override.date).toISOString().split('T')[0];
        return overrideDate === today && override.status === 'APPROVED';
      });

      // Use override times if available, otherwise use original times
      const effectiveStartTime = todayOverride?.newStartTime || schedule.startTime;
      const effectiveEndTime = todayOverride?.newEndTime || schedule.endTime;

      // Format times to 12-hour format
      const formatTime = (dateTime: Date) => {
        return dateTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      };

      return {
        id: schedule.id,
        subject: schedule.subject.name,
        subjectCode: schedule.subject.code,
        subjectId: schedule.subject.id,
        dayOfWeek: schedule.dayOfWeek,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][schedule.dayOfWeek],
        startTime: formatTime(effectiveStartTime),
        endTime: formatTime(effectiveEndTime),
        room: schedule.room,
        department: schedule.subject.course.department.name,
        year: schedule.year,
        section: schedule.section?.name || 'N/A',
        semester: schedule.semester.name,
        semesterId: schedule.semester.id,
        academicYear: schedule.academicYear.name,
        academicYearId: schedule.academicYear.id,
        isActive: true, // All schedules are considered active in this system
        createdAt: schedule.createdAt.toISOString(),
        // Override information
        hasOverride: !!todayOverride,
        overrideType: todayOverride?.overrideType || null,
        overrideReason: todayOverride?.reason || null,
        overrideAdminNotes: todayOverride?.adminNotes || null,
        originalStartTime: formatTime(schedule.startTime),
        originalEndTime: formatTime(schedule.endTime)
      };
    });

    return NextResponse.json({
      schedules: formattedSchedules
    });

  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}
