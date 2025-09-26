import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateStudentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  studentId: z.string().min(1, "Student ID is required"),
  departmentId: z.string().min(1, "Department is required"),
  sectionId: z.string().optional(),
  yearLevel: z.string().min(1).optional(),
});

// PUT /api/teacher/students/[id] - Update student
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
    const validatedData = updateStudentSchema.parse(body);
    const { id: studentId } = await params;

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true }
    });

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check if student ID is taken by another student
    if (validatedData.studentId !== existingStudent.studentId) {
      const studentIdExists = await prisma.student.findUnique({
        where: { studentId: validatedData.studentId }
      });

      if (studentIdExists && studentIdExists.id !== studentId) {
        return NextResponse.json({ error: "Student ID already exists" }, { status: 400 });
      }
    }

    // Update user and student in a transaction
    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingStudent.userId },
        data: {
          name: validatedData.name,
        }
      });

      const student = await tx.student.update({
        where: { id: studentId },
        data: {
          studentId: validatedData.studentId,
          departmentId: validatedData.departmentId,
          sectionId: validatedData.sectionId,
          yearLevel: validatedData.yearLevel,
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
          section: {
            select: {
              id: true,
              name: true,
              code: true,
            }
          },
          _count: {
            select: {
              enrollments: true,
            }
          }
        }
      });

      return student;
    });

    // Calculate attendance rate
    const totalAttendance = await prisma.attendance.count({
      where: {
        enrollment: {
          studentId: result.id
        }
      }
    });

    const presentAttendance = await prisma.attendance.count({
      where: {
        enrollment: {
          studentId: result.id
        },
        status: "PRESENT"
      }
    });

    const attendanceRate = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0;

    const formattedStudent = {
      id: result.id,
      userId: result.user.id,
      name: result.user.name,
      studentId: result.studentId,
      department: result.department.name,
      departmentId: result.department.id,
      section: result.section?.name || null,
      sectionId: result.sectionId,
      yearLevel: result.yearLevel,
      enrolledSubjects: result._count.enrollments,
      attendanceRate,
      createdAt: result.createdAt.toISOString().split('T')[0],
      image: null,
    };

    return NextResponse.json({ student: formattedStudent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error updating student:", error);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

// DELETE /api/teacher/students/[id] - Delete student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: studentId } = await params;

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          include: {
            attendance: true
          }
        }
      }
    });

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check if student has attendance records
    const hasAttendance = existingStudent.enrollments.some(enrollment => 
      enrollment.attendance.length > 0
    );

    if (hasAttendance) {
      return NextResponse.json({ 
        error: "Cannot delete student with attendance records. Please archive instead." 
      }, { status: 400 });
    }

    // Delete student and user in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete enrollments first
      await tx.enrollment.deleteMany({
        where: { studentId: studentId }
      });

      // Delete student
      await tx.student.delete({
        where: { id: studentId }
      });

      // Delete user
      await tx.user.delete({
        where: { id: existingStudent.userId }
      });
    });

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
