import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const assignSubjectSchema = z.object({
  teacherId: z.string().min(1, "Teacher is required"),
});

// POST /api/admin/subjects/[id]/assign - Assign subject to teacher
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session as any).user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = assignSubjectSchema.parse(body);
    const { id: subjectId } = await params;

    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: validatedData.teacherId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Update subject with new teacher
    const updatedSubject = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        teacherId: validatedData.teacherId
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        course: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });

    return NextResponse.json({ 
      subject: {
        id: updatedSubject.id,
        name: updatedSubject.name,
        code: updatedSubject.code,
        description: updatedSubject.description,
        teacher: updatedSubject.teacher?.user.name || "Unassigned",
        teacherEmail: updatedSubject.teacher?.user.email || "",
        course: updatedSubject.course.name,
        courseCode: updatedSubject.course.code,
        createdAt: updatedSubject.createdAt
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error assigning subject:", error);
    return NextResponse.json({ error: "Failed to assign subject" }, { status: 500 });
  }
}
