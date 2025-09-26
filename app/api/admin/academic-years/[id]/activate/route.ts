import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

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

    // Update academic year isActive status
    await prisma.$transaction(async (tx) => {
      // Set all academic years to inactive first
      await tx.academicYear.updateMany({
        data: { isActive: false }
      });
      
      // Set the selected academic year to active
      await tx.academicYear.update({
        where: { id: academicYearId },
        data: { isActive: true }
      });
    });

    return NextResponse.json({ message: "Academic year activated successfully" });
  } catch (error) {
    console.error("Error activating academic year:", error);
    return NextResponse.json({ error: "Failed to activate academic year" }, { status: 500 });
  }
}










