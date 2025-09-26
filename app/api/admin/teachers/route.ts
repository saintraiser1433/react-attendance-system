import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createTeacherSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  employeeId: z.string().min(1, "Employee ID is required"),
  departmentId: z.string().min(1, "Department is required"),
  image: z.string().optional(),
});

const updateTeacherSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  employeeId: z.string().min(1, "Employee ID is required"),
  departmentId: z.string().min(1, "Department is required"),
});

// GET /api/admin/teachers - Get all teachers
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        subjects: {
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
        createdAt: 'desc'
      }
    });

    const formattedTeachers = teachers.map(teacher => ({
      id: teacher.id,
      userId: teacher.user.id,
      name: teacher.user.name,
      email: teacher.user.email,
      employeeId: teacher.employeeId,
      department: teacher.department.name,
      departmentId: teacher.department.id,
      subjects: teacher._count.subjects,
      createdAt: teacher.createdAt.toISOString().split('T')[0],
      image: teacher.image,
    }));

    return NextResponse.json({ teachers: formattedTeachers });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
  }
}

// POST /api/admin/teachers - Create new teacher
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTeacherSchema.parse(body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    // Check if employee ID already exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { employeeId: validatedData.employeeId }
    });

    if (existingTeacher) {
      return NextResponse.json({ error: "Employee ID already exists" }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // Create user and teacher in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          passwordHash,
          role: "teacher",
        }
      });

      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          employeeId: validatedData.employeeId,
          departmentId: validatedData.departmentId,
          image: validatedData.image || null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            }
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            }
          }
        }
      });

      return teacher;
    });

    const formattedTeacher = {
      id: result.id,
      userId: result.user.id,
      name: result.user.name,
      email: result.user.email,
      employeeId: result.employeeId,
      department: result.department.name,
      departmentId: result.department.id,
      subjects: 0,
      createdAt: result.createdAt.toISOString().split('T')[0],
      image: result.image,
    };

    return NextResponse.json({ teacher: formattedTeacher }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error creating teacher:", error);
    return NextResponse.json({ error: "Failed to create teacher" }, { status: 500 });
  }
}
