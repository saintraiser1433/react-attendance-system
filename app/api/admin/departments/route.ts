import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createDepartmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
});

// GET /api/admin/departments - Get all departments
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            teachers: true,
            students: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedDepartments = departments.map(department => ({
      id: department.id,
      name: department.name,
      code: department.code,
      teacherCount: department._count.teachers,
      studentCount: department._count.students,
      createdAt: department.createdAt.toISOString().split('T')[0],
    }));

    return NextResponse.json({ departments: formattedDepartments });
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}

// POST /api/admin/departments - Create new department
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createDepartmentSchema.parse(body);

    // Check if department name already exists
    const existingName = await prisma.department.findFirst({
      where: { name: validatedData.name }
    });

    if (existingName) {
      return NextResponse.json({ error: "Department name already exists" }, { status: 400 });
    }

    // Check if department code already exists
    const existingCode = await prisma.department.findFirst({
      where: { code: validatedData.code }
    });

    if (existingCode) {
      return NextResponse.json({ error: "Department code already exists" }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: {
        name: validatedData.name,
        code: validatedData.code,
      }
    });

    const formattedDepartment = {
      id: department.id,
      name: department.name,
      code: department.code,
      teacherCount: 0,
      studentCount: 0,
      createdAt: department.createdAt.toISOString().split('T')[0],
    };

    return NextResponse.json({ department: formattedDepartment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error creating department:", error);
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}
