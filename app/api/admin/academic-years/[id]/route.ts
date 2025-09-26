import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateAcademicYearSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

// PUT /api/admin/academic-years/[id] - Update academic year
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
    const validatedData = updateAcademicYearSchema.parse(body);
    const { id: academicYearId } = await params;

    // Check if academic year exists
    const existingYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId }
    });

    if (!existingYear) {
      return NextResponse.json({ error: "Academic year not found" }, { status: 404 });
    }

    // Check if name is taken by another academic year
    if (validatedData.name !== existingYear.name) {
      const nameExists = await prisma.academicYear.findFirst({
        where: { 
          name: validatedData.name,
          id: { not: academicYearId }
        }
      });

      if (nameExists) {
        return NextResponse.json({ error: "Academic year name already exists" }, { status: 400 });
      }
    }

    // Validate dates
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (startDate >= endDate) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }

    const academicYear = await prisma.academicYear.update({
      where: { id: academicYearId },
      data: {
        name: validatedData.name,
        startDate: startDate,
        endDate: endDate,
      },
      include: {
        _count: {
          select: {
            semesters: true,
          }
        }
      }
    });

    // Check if this is the active academic year
    const settings = await prisma.setting.findUnique({
      where: { id: "singleton" }
    });

    const formattedAcademicYear = {
      id: academicYear.id,
      name: academicYear.name,
      startDate: academicYear.startDate.toISOString().split('T')[0],
      endDate: academicYear.endDate.toISOString().split('T')[0],
      isActive: settings?.activeAcademicYearId === academicYear.id,
      semesterCount: academicYear._count.semesters,
    };

    return NextResponse.json({ academicYear: formattedAcademicYear });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error updating academic year:", error);
    return NextResponse.json({ error: "Failed to update academic year" }, { status: 500 });
  }
}

// DELETE /api/admin/academic-years/[id] - Delete academic year
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: academicYearId } = await params;

    // Check if academic year exists
    const existingYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
      include: {
        _count: {
          select: {
            semesters: true,
            schedules: true,
            enrollments: true,
          }
        }
      }
    });

    if (!existingYear) {
      return NextResponse.json({ error: "Academic year not found" }, { status: 404 });
    }

    // Check if this is the active academic year
    const settings = await prisma.setting.findUnique({
      where: { id: "singleton" }
    });

    if (settings?.activeAcademicYearId === academicYearId) {
      return NextResponse.json({ 
        error: "Cannot delete active academic year. Please activate another year first." 
      }, { status: 400 });
    }

    // Check if academic year has active data
    if (existingYear._count.semesters > 0) {
      return NextResponse.json({ 
        error: "Cannot delete academic year with active semesters. Please delete semesters first." 
      }, { status: 400 });
    }

    if (existingYear._count.schedules > 0) {
      return NextResponse.json({ 
        error: "Cannot delete academic year with active schedules." 
      }, { status: 400 });
    }

    if (existingYear._count.enrollments > 0) {
      return NextResponse.json({ 
        error: "Cannot delete academic year with active enrollments." 
      }, { status: 400 });
    }

    await prisma.academicYear.delete({
      where: { id: academicYearId }
    });

    return NextResponse.json({ message: "Academic year deleted successfully" });
  } catch (error) {
    console.error("Error deleting academic year:", error);
    return NextResponse.json({ error: "Failed to delete academic year" }, { status: 500 });
  }
}

// POST /api/admin/academic-years/[id]/activate - Activate academic year
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: academicYearId } = await params;

    // Check if academic year exists
    const existingYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId }
    });

    if (!existingYear) {
      return NextResponse.json({ error: "Academic year not found" }, { status: 404 });
    }

    // Update settings to activate this academic year
    await prisma.setting.upsert({
      where: { id: "singleton" },
      update: { activeAcademicYearId: academicYearId },
      create: { 
        id: "singleton",
        activeAcademicYearId: academicYearId 
      }
    });

    return NextResponse.json({ message: "Academic year activated successfully" });
  } catch (error) {
    console.error("Error activating academic year:", error);
    return NextResponse.json({ error: "Failed to activate academic year" }, { status: 500 });
  }
}

