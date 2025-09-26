import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// POST /api/admin/semesters/[id]/activate - Activate semester
export async function POST(
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
        academicYear: true
      }
    });

    if (!existingSemester) {
      return NextResponse.json({ error: "Semester not found" }, { status: 404 });
    }

    // Update settings to activate this semester and its academic year
    await prisma.setting.upsert({
      where: { id: "singleton" },
      update: { 
        activeSemesterId: semesterId,
        activeAcademicYearId: existingSemester.academicYearId
      },
      create: { 
        id: "singleton",
        activeSemesterId: semesterId,
        activeAcademicYearId: existingSemester.academicYearId
      }
    });

    // Update semester isActive status
    await prisma.$transaction(async (tx) => {
      // Set all semesters to inactive first
      await tx.semester.updateMany({
        data: { isActive: false }
      });
      
      // Set the selected semester to active
      await tx.semester.update({
        where: { id: semesterId },
        data: { isActive: true }
      });
    });

    return NextResponse.json({ message: "Semester activated successfully" });
  } catch (error) {
    console.error("Error activating semester:", error);
    return NextResponse.json({ error: "Failed to activate semester" }, { status: 500 });
  }
}










