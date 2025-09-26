import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSemesterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

// PUT /api/admin/semesters/[id] - Update semester
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
    const validatedData = updateSemesterSchema.parse(body);
    const { id: semesterId } = await params;

    // Check if semester exists
    const existingSemester = await prisma.semester.findUnique({
      where: { id: semesterId },
      include: {
        academicYear: true
      }
    });

    if (!existingSemester) {
      return NextResponse.json({ error: "Semester not found" }, { status: 404 });
    }

    // Validate dates
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (startDate >= endDate) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }

    // Check if dates are within academic year range
    if (startDate < existingSemester.academicYear.startDate || endDate > existingSemester.academicYear.endDate) {
      return NextResponse.json({ 
        error: "Semester dates must be within the academic year range" 
      }, { status: 400 });
    }

    // Check for overlapping semesters (excluding current semester)
    const overlappingSemester = await prisma.semester.findFirst({
      where: {
        id: { not: semesterId },
        academicYearId: existingSemester.academicYearId,
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gt: startDate } }
            ]
          },
          {
            AND: [
              { startDate: { lt: endDate } },
              { endDate: { gte: endDate } }
            ]
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } }
            ]
          }
        ]
      }
    });

    if (overlappingSemester) {
      return NextResponse.json({ 
        error: "Semester dates overlap with existing semester" 
      }, { status: 400 });
    }

    const semester = await prisma.semester.update({
      where: { id: semesterId },
      data: {
        name: validatedData.name,
        startDate: startDate,
        endDate: endDate,
      },
      include: {
        _count: {
          select: {
            schedules: true,
            enrollments: true,
          }
        }
      }
    });

    // Get current active semester
    const settings = await prisma.setting.findUnique({
      where: { id: "singleton" }
    });

    const formattedSemester = {
      id: semester.id,
      name: semester.name,
      startDate: semester.startDate ? semester.startDate.toISOString().split('T')[0] : null,
      endDate: semester.endDate ? semester.endDate.toISOString().split('T')[0] : null,
      academicYearId: semester.academicYearId,
      isActive: settings?.activeSemesterId === semester.id,
      scheduleCount: semester._count.schedules,
      enrollmentCount: semester._count.enrollments,
      createdAt: semester.createdAt.toISOString().split('T')[0],
    };

    return NextResponse.json({ semester: formattedSemester });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error updating semester:", error);
    return NextResponse.json({ error: "Failed to update semester" }, { status: 500 });
  }
}

// DELETE /api/admin/semesters/[id] - Delete semester
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: semesterId } = await params;

    // Check if semester exists
    const existingSemester = await prisma.semester.findUnique({
      where: { id: semesterId },
      include: {
        _count: {
          select: {
            schedules: true,
            enrollments: true,
          }
        }
      }
    });

    if (!existingSemester) {
      return NextResponse.json({ error: "Semester not found" }, { status: 404 });
    }

    // Check if this is the active semester
    const settings = await prisma.setting.findUnique({
      where: { id: "singleton" }
    });

    if (settings?.activeSemesterId === semesterId) {
      return NextResponse.json({ 
        error: "Cannot delete active semester. Please activate another semester first." 
      }, { status: 400 });
    }

    // Check if semester has active data
    if (existingSemester._count.schedules > 0) {
      return NextResponse.json({ 
        error: "Cannot delete semester with existing schedules." 
      }, { status: 400 });
    }

    if (existingSemester._count.enrollments > 0) {
      return NextResponse.json({ 
        error: "Cannot delete semester with existing enrollments." 
      }, { status: 400 });
    }

    await prisma.semester.delete({
      where: { id: semesterId }
    });

    return NextResponse.json({ message: "Semester deleted successfully" });
  } catch (error) {
    console.error("Error deleting semester:", error);
    return NextResponse.json({ error: "Failed to delete semester" }, { status: 500 });
  }
}








