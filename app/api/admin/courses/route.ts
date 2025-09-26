import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCourseSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  code: z.string().min(1, "Course code is required"),
  description: z.string().optional(),
  yearLevel: z.string().min(1, "Year level is required"),
  departmentId: z.string().min(1, "Department is required"),
});

// GET /api/admin/courses - Get all courses
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courses = await prisma.course.findMany({
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        _count: {
          select: {
            subjects: true,
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

// POST /api/admin/courses - Create new course
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createCourseSchema.parse(body);

    // Check if course code already exists
    const existingCourse = await prisma.course.findUnique({
      where: { code: validatedData.code }
    });

    if (existingCourse) {
      return NextResponse.json({ 
        error: "Course code already exists" 
      }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        name: validatedData.name,
        code: validatedData.code,
        description: validatedData.description,
        yearLevel: validatedData.yearLevel,
        departmentId: validatedData.departmentId,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        _count: {
          select: {
            subjects: true,
          }
        }
      }
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error creating course:", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}








