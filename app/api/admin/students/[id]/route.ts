import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateStudentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  studentId: z.string().min(1, "Student ID is required"),
  email: z.string().email("Invalid email address"),
  departmentId: z.string().min(1, "Department is required"),
  sectionId: z.string().optional(),
  yearLevel: z.string().min(1),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session || (session as any).user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = updateStudentSchema.parse(body);

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check if student ID already exists (excluding current student)
    const duplicateStudent = await prisma.student.findFirst({
      where: { 
        studentId: validatedData.studentId,
        id: { not: id }
      }
    });

    if (duplicateStudent) {
      return NextResponse.json({ error: "Student ID already exists" }, { status: 400 });
    }

    // Check if email already exists (excluding current user)
    const duplicateUser = await prisma.user.findFirst({
      where: { 
        email: validatedData.email,
        id: { not: existingStudent.userId }
      }
    });

    if (duplicateUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    // Update student and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user
      await tx.user.update({
        where: { id: existingStudent.userId },
        data: {
          name: validatedData.name,
          email: validatedData.email,
        }
      });

      // Update student
      const student = await tx.student.update({
        where: { id },
        data: {
          studentId: validatedData.studentId,
          departmentId: validatedData.departmentId,
          sectionId: validatedData.sectionId,
          yearLevel: validatedData.yearLevel,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          },
          department: {
            select: {
              name: true,
            }
          },
          section: {
            select: {
              id: true,
              name: true,
              code: true,
            }
          },
          enrollments: {
            select: {
              id: true,
            }
          }
        }
      });

      return student;
    });

    const formattedStudent = {
      id: result.id,
      name: result.user.name,
      studentId: result.studentId,
      email: result.user.email,
      department: result.department.name,
      departmentId: result.departmentId,
      section: result.section?.name || null,
      sectionId: result.sectionId,
      yearLevel: result.yearLevel,
      enrolledSubjects: result.enrollments.length,
      attendanceRate: 0, // Calculate attendance rate separately if needed
      createdAt: result.createdAt.toISOString(),
      image: null,
    };

    return NextResponse.json({ student: formattedStudent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Error updating student:', error);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session || (session as any).user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    
    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Delete student and user in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete student (this will cascade delete enrollments and attendances)
      await tx.student.delete({
        where: { id }
      });

      // Delete user
      await tx.user.delete({
        where: { id: existingStudent.userId }
      });
    });

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}












