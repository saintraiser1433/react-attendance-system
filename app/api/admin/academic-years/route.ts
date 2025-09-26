import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAcademicYearSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

// GET /api/admin/academic-years - Get all academic years
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current active academic year
    const settings = await prisma.setting.findUnique({
      where: { id: "singleton" }
    });

    const academicYears = await prisma.academicYear.findMany({
      include: {
        _count: {
          select: {
            semesters: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedAcademicYears = academicYears.map(year => ({
      id: year.id,
      name: year.name,
      startDate: year.startDate.toISOString().split('T')[0],
      endDate: year.endDate.toISOString().split('T')[0],
      isActive: settings?.activeAcademicYearId === year.id,
      semesterCount: year._count.semesters,
    }));

    return NextResponse.json({ academicYears: formattedAcademicYears });
  } catch (error) {
    console.error("Error fetching academic years:", error);
    return NextResponse.json({ error: "Failed to fetch academic years" }, { status: 500 });
  }
}

// POST /api/admin/academic-years - Create new academic year
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createAcademicYearSchema.parse(body);

    // Check if academic year name already exists
    const existingYear = await prisma.academicYear.findFirst({
      where: { name: validatedData.name }
    });

    if (existingYear) {
      return NextResponse.json({ error: "Academic year name already exists" }, { status: 400 });
    }

    // Validate dates
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (startDate >= endDate) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        name: validatedData.name,
        startDate: startDate,
        endDate: endDate,
      }
    });

    const formattedAcademicYear = {
      id: academicYear.id,
      name: academicYear.name,
      startDate: academicYear.startDate.toISOString().split('T')[0],
      endDate: academicYear.endDate.toISOString().split('T')[0],
      isActive: false,
      semesterCount: 0,
    };

    return NextResponse.json({ academicYear: formattedAcademicYear }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error creating academic year:", error);
    return NextResponse.json({ error: "Failed to create academic year" }, { status: 500 });
  }
}
