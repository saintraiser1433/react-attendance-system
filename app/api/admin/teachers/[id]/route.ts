import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTeacherSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  employeeId: z.string().min(1, "Employee ID is required"),
  departmentId: z.string().min(1, "Department is required"),
  image: z.string().optional(),
});

// PUT /api/admin/teachers/[id] - Update teacher
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateTeacherSchema.parse(body);
    const { id: teacherId } = await params;

    // Check if teacher exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true }
    });

    if (!existingTeacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Check if email is taken by another user
    if (validatedData.email !== existingTeacher.user.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (emailExists && emailExists.id !== existingTeacher.userId) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 });
      }
    }

    // Check if employee ID is taken by another teacher
    if (validatedData.employeeId !== existingTeacher.employeeId) {
      const employeeIdExists = await prisma.teacher.findUnique({
        where: { employeeId: validatedData.employeeId }
      });

      if (employeeIdExists && employeeIdExists.id !== teacherId) {
        return NextResponse.json({ error: "Employee ID already exists" }, { status: 400 });
      }
    }

    // Update user and teacher in a transaction
    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingTeacher.userId },
        data: {
          name: validatedData.name,
          email: validatedData.email,
        }
      });

      const teacher = await tx.teacher.update({
        where: { id: teacherId },
        data: {
          employeeId: validatedData.employeeId,
          departmentId: validatedData.departmentId,
          image: validatedData.image || null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            }
          },
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

      return teacher;
    });

    const formattedTeacher = {
      id: result.id,
      userId: result.user.id,
      name: result.user.name,
      email: result.user.email,
      employeeId: result.employeeId,
      department: result.department.name,
      departmentId: result.department.id,
      subjects: result._count.subjects,
      createdAt: result.createdAt.toISOString().split('T')[0],
      image: result.image,
    };

    return NextResponse.json({ teacher: formattedTeacher });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error updating teacher:", error);
    return NextResponse.json({ error: "Failed to update teacher" }, { status: 500 });
  }
}

// DELETE /api/admin/teachers/[id] - Delete teacher
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: teacherId } = await params;

    // Check if teacher exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        subjects: true,
        schedules: true,
      }
    });

    if (!existingTeacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Check if teacher has active subjects or schedules
    if (existingTeacher.subjects.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete teacher with assigned subjects. Please reassign subjects first." 
      }, { status: 400 });
    }

    if (existingTeacher.schedules.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete teacher with active schedules. Please remove schedules first." 
      }, { status: 400 });
    }

    // Delete teacher and user in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.teacher.delete({
        where: { id: teacherId }
      });

      await tx.user.delete({
        where: { id: existingTeacher.userId }
      });
    });

    return NextResponse.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return NextResponse.json({ error: "Failed to delete teacher" }, { status: 500 });
  }
}
