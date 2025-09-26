import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/teacher/settings - Get teacher's settings and active academic period
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Get current active academic year and semester
    const settings = await prisma.setting.findUnique({
      where: { id: "singleton" }
    });

    if (!settings || !settings.activeAcademicYearId || !settings.activeSemesterId) {
      return NextResponse.json({ 
        error: "No active academic period found. Please contact admin to activate current term." 
      }, { status: 404 });
    }

    // Get the active academic year and semester separately
    const [activeAcademicYear, activeSemester] = await Promise.all([
      prisma.academicYear.findUnique({
        where: { id: settings.activeAcademicYearId },
        include: {
          semesters: {
            where: { isActive: true },
            take: 1
          }
        }
      }),
      prisma.semester.findUnique({
        where: { id: settings.activeSemesterId }
      })
    ]);

    if (!activeAcademicYear || !activeSemester) {
      return NextResponse.json({ 
        error: "Active academic period data not found." 
      }, { status: 404 });
    }

    return NextResponse.json({
      activeAcademicYear: {
        id: activeAcademicYear.id,
        name: activeAcademicYear.name,
        startDate: activeAcademicYear.startDate.toISOString(),
        endDate: activeAcademicYear.endDate.toISOString(),
        isActive: activeAcademicYear.isActive
      },
      activeSemester: {
        id: activeSemester.id,
        name: activeSemester.name,
        startDate: activeSemester.startDate ? activeSemester.startDate.toISOString() : null,
        endDate: activeSemester.endDate ? activeSemester.endDate.toISOString() : null,
        isActive: activeSemester.isActive
      },
      teacher: {
        id: teacher.id,
        employeeId: teacher.employeeId,
        departmentId: teacher.departmentId
      }
    });

  } catch (error) {
    console.error("Error fetching teacher settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
