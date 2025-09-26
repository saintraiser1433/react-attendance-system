import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createStudentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  studentId: z.string().min(1, "Student ID is required"),
  departmentId: z.string().min(1, "Department is required"),
  sectionId: z.string().optional(),
  yearLevel: z.string().min(1),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session || (session as any).user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get active academic year and semester from settings
    const settings = await prisma.setting.findUnique({
      where: { id: "singleton" }
    });

    if (!settings?.activeAcademicYearId || !settings?.activeSemesterId) {
      return NextResponse.json({ error: 'No active academic year or semester found' }, { status: 400 });
    }

    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        department: {
          select: {
            name: true,
          }
        },
        section: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        enrollments: {
          where: {
            academicYearId: settings.activeAcademicYearId,
            semesterId: settings.activeSemesterId
          },
          select: {
            id: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedStudents = students.map(student => ({
      id: student.id,
      name: student.user.name,
      studentId: student.studentId,
      email: student.user.email,
      department: student.department.name,
      departmentId: student.departmentId,
      section: student.section?.name || null,
      sectionId: student.sectionId,
      yearLevel: student.yearLevel,
      enrolledSubjects: student.enrollments.length,
      attendanceRate: 0, // Calculate attendance rate separately if needed
      createdAt: student.createdAt.toISOString(),
      image: null, // Add image support later if needed
    }));

    return NextResponse.json({ students: formattedStudents });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session || (session as any).user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = createStudentSchema.parse(body);

    // Get active academic year and semester
    const settings = await prisma.setting.findFirst();
    const activeAcademicYearId = settings?.activeAcademicYearId;
    const activeSemesterId = settings?.activeSemesterId;

    // Validate that there's an active academic period
    if (!activeAcademicYearId || !activeSemesterId) {
      return NextResponse.json({ 
        error: "No active academic year or semester set. Please activate current term before adding students." 
      }, { status: 400 });
    }

    // Check if student ID already exists
    const existingStudent = await prisma.student.findUnique({
      where: { studentId: validatedData.studentId }
    });

    if (existingStudent) {
      return NextResponse.json({ error: "Student ID already exists" }, { status: 400 });
    }

    // Create student with user account
    const result = await prisma.$transaction(async (tx) => {
      // Create user first
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: null, // No email for students
          passwordHash: null, // No password for students
          role: "student" as const,
        }
      });

      // Create student with active academic year and semester
      const student = await tx.student.create({
        data: {
          userId: user.id,
          studentId: validatedData.studentId,
          departmentId: validatedData.departmentId,
          sectionId: validatedData.sectionId,
          yearLevel: validatedData.yearLevel,
          academicYearId: activeAcademicYearId,
          semesterId: activeSemesterId,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          },
          department: {
            select: {
              name: true,
            }
          },
          section: {
            select: {
              id: true,
              name: true,
              code: true,
            }
          }
        }
      });

      return student;
    });

    const formattedStudent = {
      id: result.id,
      name: result.user.name,
      studentId: result.studentId,
      email: result.user.email,
      department: result.department.name,
      departmentId: result.departmentId,
      section: result.section?.name || null,
      sectionId: result.sectionId,
      yearLevel: result.yearLevel,
      enrolledSubjects: 0,
      attendanceRate: 0,
      createdAt: result.createdAt.toISOString(),
      image: null,
    };

    return NextResponse.json({ student: formattedStudent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Error creating student:', error);
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}











