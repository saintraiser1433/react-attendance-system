import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/teacher/enrollment-students - Get all students for enrollment (not just enrolled ones)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active academic year and semester from settings
    const settings = await prisma.setting.findUnique({
      where: { id: "singleton" }
    });

    if (!settings?.activeAcademicYearId || !settings?.activeSemesterId) {
      return NextResponse.json({ error: 'No active academic year or semester found' }, { status: 400 });
    }

    // Get all students created for the active academic year and semester
    const students = await prisma.student.findMany({
      where: {
        // Filter by active academic year and semester
        AND: [
          { academicYearId: settings.activeAcademicYearId },
          { semesterId: settings.activeSemesterId }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
        }
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    });

    const formattedStudents = students.map(student => ({
      id: student.id,
      userId: student.user.id,
      name: student.user.name,
      email: student.user.email,
      studentId: student.studentId,
      department: student.department.name,
      departmentId: student.department.id,
      section: student.section?.name || null,
      sectionId: student.sectionId,
      yearLevel: student.yearLevel,
      createdAt: student.createdAt.toISOString().split('T')[0],
    }));

    return NextResponse.json({ students: formattedStudents });
  } catch (error) {
    console.error("Error fetching students for enrollment:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}
