import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateModuleSchema = z.object({
  code: z.string().min(1, "Module code is required"),
  name: z.string().min(1, "Module name is required"),
  description: z.string().optional(),
  subjectId: z.string().min(1, "Subject is required"),
});

// PUT /api/teacher/modules/[id] - Update module
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
    const validatedData = updateModuleSchema.parse(body);
    const { id: moduleId } = await params;

    // Find the teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Check if module exists and belongs to this teacher
    const existingModule = await prisma.module.findFirst({
      where: { 
        id: moduleId,
        teacherId: teacher.id 
      }
    });

    if (!existingModule) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Check if module code is taken by another module (if changed)
    if (validatedData.code !== existingModule.code) {
      const codeExists = await prisma.module.findFirst({
        where: { 
          code: validatedData.code,
          teacherId: teacher.id,
          id: { not: moduleId }
        }
      });

      if (codeExists) {
        return NextResponse.json({ error: "Module code already exists" }, { status: 400 });
      }
    }

    // Verify the subject belongs to this teacher
    const subject = await prisma.subject.findFirst({
      where: {
        id: validatedData.subjectId,
        teacherId: teacher.id
      }
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found or not assigned to you" }, { status: 404 });
    }

    const module = await prisma.module.update({
      where: { id: moduleId },
      data: {
        code: validatedData.code,
        name: validatedData.name,
        description: validatedData.description || "",
        subjectId: validatedData.subjectId,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        _count: {
          select: {
            topics: true,
          }
        }
      }
    });

    const formattedModule = {
      id: module.id,
      code: module.code,
      name: module.name,
      description: module.description || "",
      subject: module.subject.name,
      subjectId: module.subject.id,
      topicCount: module._count.topics,
      createdAt: module.createdAt.toISOString().split('T')[0],
    };

    return NextResponse.json({ module: formattedModule });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error updating module:", error);
    return NextResponse.json({ error: "Failed to update module" }, { status: 500 });
  }
}

// DELETE /api/teacher/modules/[id] - Delete module
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: moduleId } = await params;

    // Find the teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Check if module exists and belongs to this teacher
    const existingModule = await prisma.module.findFirst({
      where: { 
        id: moduleId,
        teacherId: teacher.id 
      },
      include: {
        _count: {
          select: {
            topics: true,
          }
        }
      }
    });

    if (!existingModule) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Check if module has topics
    if (existingModule._count.topics > 0) {
      return NextResponse.json({ 
        error: "Cannot delete module with existing topics. Please delete topics first." 
      }, { status: 400 });
    }

    await prisma.module.delete({
      where: { id: moduleId }
    });

    return NextResponse.json({ message: "Module deleted successfully" });
  } catch (error) {
    console.error("Error deleting module:", error);
    return NextResponse.json({ error: "Failed to delete module" }, { status: 500 });
  }
}








