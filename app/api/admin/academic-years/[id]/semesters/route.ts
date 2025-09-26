import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSemesterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

// GET /api/admin/academic-years/[id]/semesters - Get semesters for academic year
export async function GET(
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
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId }
    });

    if (!academicYear) {
      return NextResponse.json({ error: "Academic year not found" }, { status: 404 });
    }

    // Get current active semester
    const settings = await prisma.setting.findUnique({
      where: { id: "singleton" }
    });

    const semesters = await prisma.semester.findMany({
      where: { academicYearId: academicYearId },
      include: {
        _count: {
          select: {
            schedules: true,
            enrollments: true,
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const formattedSemesters = semesters.map(semester => ({
      id: semester.id,
      name: semester.name,
      startDate: semester.startDate ? semester.startDate.toISOString().split('T')[0] : null,
      endDate: semester.endDate ? semester.endDate.toISOString().split('T')[0] : null,
      academicYearId: semester.academicYearId,
      isActive: settings?.activeSemesterId === semester.id,
      scheduleCount: semester._count.schedules,
      enrollmentCount: semester._count.enrollments,
      createdAt: semester.createdAt.toISOString().split('T')[0],
    }));

    return NextResponse.json({ semesters: formattedSemesters });
  } catch (error) {
    console.error("Error fetching semesters:", error);
    return NextResponse.json({ error: "Failed to fetch semesters" }, { status: 500 });
  }
}

// POST /api/admin/academic-years/[id]/semesters - Create semester for academic year
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSemesterSchema.parse(body);
    const { id: academicYearId } = await params;

    // Check if academic year exists
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId }
    });

    if (!academicYear) {
      return NextResponse.json({ error: "Academic year not found" }, { status: 404 });
    }

    // Validate dates
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (startDate >= endDate) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }

    // Check if dates are within academic year range
    if (startDate < academicYear.startDate || endDate > academicYear.endDate) {
      return NextResponse.json({ 
        error: "Semester dates must be within the academic year range" 
      }, { status: 400 });
    }

    // Check for overlapping semesters
    const overlappingSemester = await prisma.semester.findFirst({
      where: {
        academicYearId: academicYearId,
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

    const semester = await prisma.semester.create({
      data: {
        name: validatedData.name,
        startDate: startDate,
        endDate: endDate,
        academicYearId: academicYearId,
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

    return NextResponse.json({ semester: formattedSemester }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error creating semester:", error);
    return NextResponse.json({ error: "Failed to create semester" }, { status: 500 });
  }
}








