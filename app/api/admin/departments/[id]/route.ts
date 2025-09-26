import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateDepartmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
});

// PUT /api/admin/departments/[id] - Update department
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
    const validatedData = updateDepartmentSchema.parse(body);
    const { id: departmentId } = await params;

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id: departmentId }
    });

    if (!existingDepartment) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    // Check if name is taken by another department
    if (validatedData.name !== existingDepartment.name) {
      const nameExists = await prisma.department.findFirst({
        where: { 
          name: validatedData.name,
          id: { not: departmentId }
        }
      });

      if (nameExists) {
        return NextResponse.json({ error: "Department name already exists" }, { status: 400 });
      }
    }

    // Check if code is taken by another department
    if (validatedData.code !== existingDepartment.code) {
      const codeExists = await prisma.department.findFirst({
        where: { 
          code: validatedData.code,
          id: { not: departmentId }
        }
      });

      if (codeExists) {
        return NextResponse.json({ error: "Department code already exists" }, { status: 400 });
      }
    }

    const department = await prisma.department.update({
      where: { id: departmentId },
      data: {
        name: validatedData.name,
        code: validatedData.code,
      },
      include: {
        _count: {
          select: {
            teachers: true,
            students: true,
          }
        }
      }
    });

    const formattedDepartment = {
      id: department.id,
      name: department.name,
      code: department.code,
      teacherCount: department._count.teachers,
      studentCount: department._count.students,
      createdAt: department.createdAt.toISOString().split('T')[0],
    };

    return NextResponse.json({ department: formattedDepartment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error updating department:", error);
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}

// DELETE /api/admin/departments/[id] - Delete department
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: departmentId } = await params;

    // Check if department exists and get counts
    const existingDepartment = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        _count: {
          select: {
            teachers: true,
            students: true,
            courses: true,
          }
        }
      }
    });

    if (!existingDepartment) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    // Check if department has active teachers, students, or courses
    if (existingDepartment._count.teachers > 0) {
      return NextResponse.json({ 
        error: "Cannot delete department with active teachers. Please reassign teachers first." 
      }, { status: 400 });
    }

    if (existingDepartment._count.students > 0) {
      return NextResponse.json({ 
        error: "Cannot delete department with active students. Please reassign students first." 
      }, { status: 400 });
    }

    if (existingDepartment._count.courses > 0) {
      return NextResponse.json({ 
        error: "Cannot delete department with active courses. Please reassign courses first." 
      }, { status: 400 });
    }

    await prisma.department.delete({
      where: { id: departmentId }
    });

    return NextResponse.json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
  }
}

// GET /api/admin/departments/[id] - Get single department with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: departmentId } = await params;

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        teachers: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        },
        students: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        },
        _count: {
          select: {
            teachers: true,
            students: true,
            courses: true,
          }
        }
      }
    });

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    const formattedDepartment = {
      id: department.id,
      name: department.name,
      code: department.code,
      teacherCount: department._count.teachers,
      studentCount: department._count.students,
      courseCount: department._count.courses,
      createdAt: department.createdAt.toISOString().split('T')[0],
      teachers: department.teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.user.name,
        email: teacher.user.email,
        employeeId: teacher.employeeId,
      })),
      students: department.students.map(student => ({
        id: student.id,
        name: student.user.name,
        email: student.user.email,
        studentId: student.studentId,
      })),
    };

    return NextResponse.json({ department: formattedDepartment });
  } catch (error) {
    console.error("Error fetching department:", error);
    return NextResponse.json({ error: "Failed to fetch department" }, { status: 500 });
  }
}
