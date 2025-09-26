import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().min(1, "Subject code is required"),
  description: z.string().optional(),
  credits: z.number().min(1).max(10),
});

// GET /api/teacher/subjects - Get all subjects for the teacher
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Get active academic year and semester
    const settings = await prisma.setting.findUnique({
      where: { id: "singleton" }
    });

    if (!settings?.activeAcademicYearId || !settings?.activeSemesterId) {
      return NextResponse.json({ error: "No active academic period set" }, { status: 400 });
    }

    const subjects = await prisma.subject.findMany({
      where: { 
        teacherId: teacher.id,
        // Only show subjects that have schedules or enrollments in the active academic year/semester
        OR: [
          {
            schedules: {
              some: {
                academicYearId: settings.activeAcademicYearId,
                semesterId: settings.activeSemesterId
              }
            }
          },
          {
            enrollments: {
              some: {
                academicYearId: settings.activeAcademicYearId,
                semesterId: settings.activeSemesterId
              }
            }
          }
        ]
      },
      include: {
        course: {
          include: {
            department: true
          }
        },
        schedules: {
          where: {
            academicYearId: settings.activeAcademicYearId,
            semesterId: settings.activeSemesterId
          },
          include: {
            academicYear: true,
            semester: true,
            section: {
              select: {
                name: true,
              }
            }
          }
        },
        enrollments: {
          where: {
            academicYearId: settings.activeAcademicYearId,
            semesterId: settings.activeSemesterId
          },
          include: {
            student: {
              include: {
                user: true,
                section: {
                  select: {
                    name: true,
                  }
                }
              }
            },
            academicYear: true,
            semester: true
          }
        },
        _count: {
          select: {
            enrollments: {
              where: {
                academicYearId: settings.activeAcademicYearId,
                semesterId: settings.activeSemesterId
              }
            },
            schedules: {
              where: {
                academicYearId: settings.activeAcademicYearId,
                semesterId: settings.activeSemesterId
              }
            },
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const formattedSubjects = subjects.map(subject => {
      // Get unique years, courses, and sections from schedules and enrollments
      const scheduleYears = [...new Set(subject.schedules.map(s => s.academicYear.name))];
      const scheduleSections = [...new Set(subject.schedules.map(s => s.section?.name).filter(Boolean))];
      const enrollmentYears = [...new Set(subject.enrollments.map(e => e.academicYear.name))];
      const enrollmentSections = [...new Set(subject.enrollments.map(e => e.student.section?.name).filter(Boolean))];
      
      const allYears = [...new Set([...scheduleYears, ...enrollmentYears])];
      const allSections = [...new Set([...scheduleSections, ...enrollmentSections])];

      return {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        description: subject.description || "",
        credits: subject.credits,
        course: {
          id: subject.course.id,
          name: subject.course.name,
          code: subject.course.code,
          department: subject.course.department.name
        },
        enrollmentCount: subject._count.enrollments,
        scheduleCount: subject._count.schedules,
        years: allYears,
        sections: allSections,
        schedules: subject.schedules.map(schedule => ({
          id: schedule.id,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime.toISOString(),
          endTime: schedule.endTime.toISOString(),
          room: schedule.room,
          department: schedule.department,
          year: schedule.year,
          section: schedule.section,
          academicYear: schedule.academicYear.name,
          semester: schedule.semester.name
        })),
        enrollments: subject.enrollments.map(enrollment => ({
          id: enrollment.id,
          studentId: enrollment.student.studentId,
          studentName: enrollment.student.user?.name || 'Unknown',
          studentEmail: enrollment.student.user?.email || '',
          section: enrollment.student.section,
          yearLevel: enrollment.student.yearLevel,
          academicYear: enrollment.academicYear.name,
          semester: enrollment.semester.name,
          createdAt: enrollment.createdAt.toISOString().split('T')[0]
        })),
        createdAt: subject.createdAt.toISOString().split('T')[0],
      };
    });

    return NextResponse.json({ subjects: formattedSubjects });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}

// Teachers can only view subjects, not create them
// Subject creation is handled by admin in /api/admin/subjects












