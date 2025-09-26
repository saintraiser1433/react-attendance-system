import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSemesterSchema = z.object({
  name: z.string().min(1, "Semester name is required"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  academicYearId: z.string().min(1, "Academic year is required"),
});

const updateSemesterSchema = z.object({
  name: z.string().min(1, "Semester name is required").optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/semesters - Get all semesters or semesters for a specific academic year
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');

    const whereClause = academicYearId ? { academicYearId } : {};

    const semesters = await prisma.semester.findMany({
      where: whereClause,
      include: {
        academicYear: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        },
        _count: {
          select: {
            schedules: true
          }
        }
      },
      orderBy: [
        { academicYear: { startDate: 'desc' } },
        { createdAt: 'desc' }
      ]
    });

    const formattedSemesters = semesters.map(semester => ({
      id: semester.id,
      name: semester.name,
      startDate: semester.startDate ? semester.startDate.toISOString().split('T')[0] : null,
      endDate: semester.endDate ? semester.endDate.toISOString().split('T')[0] : null,
      isActive: semester.isActive,
      academicYear: {
        id: semester.academicYear.id,
        name: semester.academicYear.name,
        isActive: semester.academicYear.isActive
      },
      scheduleCount: semester._count.schedules,
      createdAt: semester.createdAt.toISOString().split('T')[0]
    }));

    return NextResponse.json({ semesters: formattedSemesters });
  } catch (error) {
    console.error("Error fetching semesters:", error);
    return NextResponse.json({ error: "Failed to fetch semesters" }, { status: 500 });
  }
}

// POST /api/admin/semesters - Create new semester
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSemesterSchema.parse(body);

    // Verify academic year exists
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: validatedData.academicYearId }
    });

    if (!academicYear) {
      return NextResponse.json({ error: "Academic year not found" }, { status: 404 });
    }

    // Check for overlapping semesters in the same academic year (only if dates are provided)
    if (validatedData.startDate && validatedData.endDate) {
      const overlappingSemester = await prisma.semester.findFirst({
        where: {
          academicYearId: validatedData.academicYearId,
          startDate: { not: null },
          endDate: { not: null },
          OR: [
            {
              AND: [
                { startDate: { lte: new Date(validatedData.startDate) } },
                { endDate: { gte: new Date(validatedData.startDate) } }
              ]
            },
            {
              AND: [
                { startDate: { lte: new Date(validatedData.endDate) } },
                { endDate: { gte: new Date(validatedData.endDate) } }
              ]
            },
            {
              AND: [
                { startDate: { gte: new Date(validatedData.startDate) } },
                { endDate: { lte: new Date(validatedData.endDate) } }
              ]
            }
          ]
        }
      });

      if (overlappingSemester) {
        return NextResponse.json({ 
          error: `Semester dates overlap with existing semester "${overlappingSemester.name}"` 
        }, { status: 400 });
      }
    }

    const semester = await prisma.semester.create({
      data: {
        name: validatedData.name,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        academicYearId: validatedData.academicYearId,
        isActive: false // New semesters are inactive by default
      },
      include: {
        academicYear: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      }
    });

    const formattedSemester = {
      id: semester.id,
      name: semester.name,
      startDate: semester.startDate ? semester.startDate.toISOString().split('T')[0] : null,
      endDate: semester.endDate ? semester.endDate.toISOString().split('T')[0] : null,
      isActive: semester.isActive,
      academicYear: {
        id: semester.academicYear.id,
        name: semester.academicYear.name,
        isActive: semester.academicYear.isActive
      },
      createdAt: semester.createdAt.toISOString().split('T')[0]
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

