import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateCourseSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  code: z.string().min(1, "Course code is required"),
  description: z.string().optional(),
  yearLevel: z.string().min(1, "Year level is required"),
  departmentId: z.string().min(1, "Department is required"),
});

// GET /api/admin/courses/[id] - Get specific course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        subjects: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

// PUT /api/admin/courses/[id] - Update course
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateCourseSchema.parse(body);

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id }
    });

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if course code already exists (excluding current course)
    const duplicateCourse = await prisma.course.findFirst({
      where: { 
        code: validatedData.code,
        id: { not: id }
      }
    });

    if (duplicateCourse) {
      return NextResponse.json({ 
        error: "Course code already exists" 
      }, { status: 400 });
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        name: validatedData.name,
        code: validatedData.code,
        description: validatedData.description,
        yearLevel: validatedData.yearLevel,
        departmentId: validatedData.departmentId,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        _count: {
          select: {
            subjects: true,
          }
        }
      }
    });

    return NextResponse.json({ course });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error updating course:", error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

// DELETE /api/admin/courses/[id] - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subjects: true,
          }
        }
      }
    });

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if course has subjects
    if (existingCourse._count.subjects > 0) {
      return NextResponse.json({ 
        error: "Cannot delete course with existing subjects. Please remove all subjects first." 
      }, { status: 400 });
    }

    await prisma.course.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}







