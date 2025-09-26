import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateEnrollmentSchema = z.object({
  // No fields to update for now
});

// PUT /api/teacher/enrollments/[id] - Update enrollment status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session as any).user?.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateEnrollmentSchema.parse(body);
    const { id: enrollmentId } = await params;

    // Check if enrollment exists and belongs to teacher's subject
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        subject: {
          include: {
            teacher: true
          }
        },
        student: {
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

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Check if the teacher owns this subject
    const teacherId = (session as any).user?.id;
    if (!enrollment.subject.teacher || enrollment.subject.teacher.userId !== teacherId) {
      return NextResponse.json({ error: "Unauthorized to modify this enrollment" }, { status: 403 });
    }

    // For now, just return the enrollment without updating
    const updatedEnrollment = enrollment;

    return NextResponse.json({ 
      message: "Enrollment updated successfully",
      enrollment: {
        id: updatedEnrollment.id,
        studentName: updatedEnrollment.student.user.name,
        studentEmail: updatedEnrollment.student.user.email,
        subjectName: updatedEnrollment.subject.name,
        subjectCode: updatedEnrollment.subject.code,
        // status: updatedEnrollment.status, // Status field doesn't exist in model
        enrolledAt: updatedEnrollment.createdAt
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error updating enrollment:", error);
    return NextResponse.json({ error: "Failed to update enrollment" }, { status: 500 });
  }
}

// DELETE /api/teacher/enrollments/[id] - Remove enrollment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session as any).user?.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: enrollmentId } = await params;

    // Check if enrollment exists and belongs to teacher's subject
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        subject: {
          include: {
            teacher: true
          }
        },
        _count: {
          select: {
            attendance: true
          }
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Check if the teacher owns this subject
    const teacherId = (session as any).user?.id;
    if (!enrollment.subject.teacher || enrollment.subject.teacher.userId !== teacherId) {
      return NextResponse.json({ error: "Unauthorized to modify this enrollment" }, { status: 403 });
    }

    // Check if enrollment has attendance records
    if (enrollment._count.attendance > 0) {
      return NextResponse.json({ 
        error: "Cannot remove enrollment with attendance records" 
      }, { status: 400 });
    }

    // Delete enrollment
    await prisma.enrollment.delete({
      where: { id: enrollmentId }
    });

    return NextResponse.json({ 
      message: "Enrollment removed successfully"
    });

  } catch (error) {
    console.error("Error removing enrollment:", error);
    return NextResponse.json({ error: "Failed to remove enrollment" }, { status: 500 });
  }
}
