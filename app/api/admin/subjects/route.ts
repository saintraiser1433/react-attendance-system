import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().min(1, "Subject code is required"),
  description: z.string().optional(),
  credits: z.number().min(1).max(10).optional(),
  teacherId: z.string().optional(),
  courseId: z.string().min(1, "Course is required"),
});

// GET /api/admin/subjects - Get all subjects
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subjects = await prisma.subject.findMany({
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
        course: {
          select: {
            name: true,
            code: true,
          }
        },
        _count: {
          select: {
            enrollments: true,
            schedules: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedSubjects = subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      description: subject.description || "",
      credits: subject.credits,
      teacherId: subject.teacherId,
      teacherName: subject.teacher?.user?.name || "Unassigned",
      courseId: subject.courseId,
      courseName: subject.course.name,
      enrollmentCount: subject._count.enrollments,
      scheduleCount: subject._count.schedules,
      createdAt: subject.createdAt.toISOString().split('T')[0],
    }));

    return NextResponse.json({ subjects: formattedSubjects });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}

// POST /api/admin/subjects - Create new subject
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSubjectSchema.parse(body);

    // Check if subject code already exists
    const existingSubject = await prisma.subject.findFirst({
      where: { 
        code: validatedData.code,
      }
    });

    if (existingSubject) {
      return NextResponse.json({ error: "Subject code already exists" }, { status: 400 });
    }

    // Verify teacher exists (only if teacherId is provided)
    if (validatedData.teacherId) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: validatedData.teacherId }
      });

      if (!teacher) {
        return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
      }
    }

    const course = await prisma.course.findUnique({
      where: { id: validatedData.courseId }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const subject = await prisma.subject.create({
      data: {
        name: validatedData.name,
        code: validatedData.code,
        description: validatedData.description || "",
        credits: validatedData.credits || 3,
        teacherId: validatedData.teacherId || null,
        courseId: validatedData.courseId,
      },
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
        course: {
          select: {
            name: true,
            code: true,
          }
        },
        _count: {
          select: {
            enrollments: true,
            schedules: true,
          }
        }
      }
    });

    const formattedSubject = {
      id: subject.id,
      name: subject.name,
      code: subject.code,
      description: subject.description || "",
      credits: subject.credits,
      teacherId: subject.teacherId,
      teacherName: subject.teacher?.user?.name || "Unassigned",
      courseId: subject.courseId,
      courseName: subject.course.name,
      enrollmentCount: subject._count.enrollments,
      scheduleCount: subject._count.schedules,
      createdAt: subject.createdAt.toISOString().split('T')[0],
    };

    return NextResponse.json({ subject: formattedSubject }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error creating subject:", error);
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 });
  }
}







