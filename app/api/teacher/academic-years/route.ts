import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/teacher/academic-years - Get all academic years
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session as any).user?.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all academic years
    const academicYears = await prisma.academicYear.findMany({
      orderBy: {
        startDate: 'desc'
      },
      include: {
        _count: {
          select: {
            semesters: true
          }
        }
      }
    });

    // Get current active academic year
    const settings = await prisma.setting.findFirst();
    const activeAcademicYearId = settings?.activeAcademicYearId;

    return NextResponse.json({ 
      academicYears: academicYears.map(year => ({
        id: year.id,
        name: year.name,
        startDate: year.startDate.toISOString().split('T')[0],
        endDate: year.endDate.toISOString().split('T')[0],
        isActive: year.id === activeAcademicYearId,
        semesterCount: year._count.semesters
      }))
    });

  } catch (error) {
    console.error("Error fetching academic years:", error);
    return NextResponse.json({ error: "Failed to fetch academic years" }, { status: 500 });
  }
}

