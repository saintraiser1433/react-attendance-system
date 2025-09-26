import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createModuleSchema = z.object({
  code: z.string().min(1, "Module code is required"),
  name: z.string().min(1, "Module name is required"),
  description: z.string().optional(),
  subjectId: z.string().min(1, "Subject is required"),
});

// GET /api/teacher/modules - Get all modules for the teacher
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

    const modules = await prisma.module.findMany({
      where: { teacherId: teacher.id },
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedModules = modules.map(module => ({
      id: module.id,
      code: module.code,
      name: module.name,
      description: module.description || "",
      subject: module.subject.name,
      subjectId: module.subject.id,
      topicCount: module._count.topics,
      createdAt: module.createdAt.toISOString().split('T')[0],
    }));

    return NextResponse.json({ modules: formattedModules });
  } catch (error) {
    console.error("Error fetching modules:", error);
    return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 });
  }
}

// POST /api/teacher/modules - Create new module
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createModuleSchema.parse(body);

    // Find the teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Check if module code already exists for this teacher
    const existingModule = await prisma.module.findFirst({
      where: { 
        code: validatedData.code,
        teacherId: teacher.id 
      }
    });

    if (existingModule) {
      return NextResponse.json({ error: "Module code already exists" }, { status: 400 });
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

    const module = await prisma.module.create({
      data: {
        code: validatedData.code,
        name: validatedData.name,
        description: validatedData.description || "",
        subjectId: validatedData.subjectId,
        teacherId: teacher.id,
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

    return NextResponse.json({ module: formattedModule }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error creating module:", error);
    return NextResponse.json({ error: "Failed to create module" }, { status: 500 });
  }
}








