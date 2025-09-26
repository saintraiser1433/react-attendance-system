import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().min(1, "Subject code is required"),
  description: z.string().optional(),
  credits: z.number().min(1).max(10),
});

// PUT /api/teacher/subjects/[id] - Update subject
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSubjectSchema.parse(body);
    const { id: subjectId } = await params;

    // Find the teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Check if subject exists and belongs to this teacher
    const existingSubject = await prisma.subject.findFirst({
      where: { 
        id: subjectId,
        teacherId: teacher.id 
      }
    });

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Check if subject code is taken by another subject (if changed)
    if (validatedData.code !== existingSubject.code) {
      const codeExists = await prisma.subject.findFirst({
        where: { 
          code: validatedData.code,
          teacherId: teacher.id,
          id: { not: subjectId }
        }
      });

      if (codeExists) {
        return NextResponse.json({ error: "Subject code already exists" }, { status: 400 });
      }
    }

    const subject = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        name: validatedData.name,
        code: validatedData.code,
        description: validatedData.description || "",
        credits: validatedData.credits,
      },
      include: {
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
      enrollmentCount: subject._count.enrollments,
      scheduleCount: subject._count.schedules,
      createdAt: subject.createdAt.toISOString().split('T')[0],
    };

    return NextResponse.json({ subject: formattedSubject });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error updating subject:", error);
    return NextResponse.json({ error: "Failed to update subject" }, { status: 500 });
  }
}

// DELETE /api/teacher/subjects/[id] - Delete subject
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: subjectId } = await params;

    // Find the teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Check if subject exists and belongs to this teacher
    const existingSubject = await prisma.subject.findFirst({
      where: { 
        id: subjectId,
        teacherId: teacher.id 
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            schedules: true,
            modules: true,
          }
        }
      }
    });

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Check if subject has active data
    if (existingSubject._count.enrollments > 0) {
      return NextResponse.json({ 
        error: "Cannot delete subject with existing enrollments" 
      }, { status: 400 });
    }

    if (existingSubject._count.schedules > 0) {
      return NextResponse.json({ 
        error: "Cannot delete subject with existing schedules" 
      }, { status: 400 });
    }

    if (existingSubject._count.modules > 0) {
      return NextResponse.json({ 
        error: "Cannot delete subject with existing modules" 
      }, { status: 400 });
    }

    await prisma.subject.delete({
      where: { id: subjectId }
    });

    return NextResponse.json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error("Error deleting subject:", error);
    return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 });
  }
}








