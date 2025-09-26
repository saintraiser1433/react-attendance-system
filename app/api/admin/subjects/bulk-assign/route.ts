import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const bulkAssignSchema = z.object({
  subjectIds: z.array(z.string()).min(1, "At least one subject is required"),
  teacherId: z.string().min(1, "Teacher is required"),
});

// POST /api/admin/subjects/bulk-assign - Bulk assign subjects to teacher
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session as any).user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bulkAssignSchema.parse(body);

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

    // Check if all subjects exist
    const subjects = await prisma.subject.findMany({
      where: {
        id: {
          in: validatedData.subjectIds
        }
      }
    });

    if (subjects.length !== validatedData.subjectIds.length) {
      return NextResponse.json({ error: "One or more subjects not found" }, { status: 404 });
    }

    // Update all subjects with the new teacher
    const updatedSubjects = await prisma.subject.updateMany({
      where: {
        id: {
          in: validatedData.subjectIds
        }
      },
      data: {
        teacherId: validatedData.teacherId
      }
    });

    return NextResponse.json({ 
      message: `Successfully assigned ${updatedSubjects.count} subjects to ${teacher.user.name}`,
      assignedCount: updatedSubjects.count,
      teacher: {
        id: teacher.id,
        name: teacher.user.name,
        email: teacher.user.email
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error bulk assigning subjects:", error);
    return NextResponse.json({ error: "Failed to bulk assign subjects" }, { status: 500 });
  }
}

