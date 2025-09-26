import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/teacher/academic-years/[id]/semesters - Get semesters for academic year
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session as any).user?.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: academicYearId } = await params;

    // Get semesters for the academic year
    const semesters = await prisma.semester.findMany({
      where: {
        academicYearId: academicYearId
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ 
      semesters: semesters.map(semester => ({
        id: semester.id,
        name: semester.name,
        startDate: semester.startDate ? semester.startDate.toISOString().split('T')[0] : null,
        endDate: semester.endDate ? semester.endDate.toISOString().split('T')[0] : null,
        academicYearId: semester.academicYearId
      }))
    });

  } catch (error) {
    console.error("Error fetching semesters:", error);
    return NextResponse.json({ error: "Failed to fetch semesters" }, { status: 500 });
  }
}

