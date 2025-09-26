import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createStudentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  studentId: z.string().min(1, "Student ID is required"),
  departmentId: z.string().min(1, "Department is required"),
  sectionId: z.string().optional(),
  yearLevel: z.string().min(1).optional(),
});

// GET /api/teacher/students - Get students enrolled in teacher's subjects
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher ID from user ID
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Get active academic year and semester (optional for student listing)
    const settings = await prisma.setting.findUnique({
      where: { id: "singleton" }
    });

    const activeAcademicYearId = settings?.activeAcademicYearId;
    const activeSemesterId = settings?.activeSemesterId;

    // Check if we should filter by active academic year/semester
    const url = new URL(request.url);
    const filterByActivePeriod = url.searchParams.get('filterByActivePeriod') === 'true';

    let students;
    
    if (filterByActivePeriod && activeAcademicYearId && activeSemesterId) {
      // Get students created for the active academic year and semester
      students = await prisma.student.findMany({
        where: {
          academicYearId: activeAcademicYearId,
          semesterId: activeSemesterId
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
    } else {
      // Get all students so teachers can see and enroll them
      students = await prisma.student.findMany({
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
    }

    // Process students and show enrollment data for active academic year/semester

    const formattedStudents = await Promise.all(
      students.map(async (student) => {
        // Get enrollments for this student in teacher's subjects (only if active period is set)
        const enrollments = activeAcademicYearId && activeSemesterId ? await prisma.enrollment.findMany({
          where: {
            studentId: student.id,
            academicYearId: activeAcademicYearId,
            semesterId: activeSemesterId,
            subject: {
              teacherId: teacher.id
            }
          },
          include: {
            subject: {
              select: {
                name: true,
                code: true,
              }
            }
          }
        }) : [];

        // Calculate attendance rate for this student across teacher's subjects (only if active period is set)
        const totalAttendance = activeAcademicYearId && activeSemesterId ? await prisma.attendance.count({
          where: {
            enrollment: {
              studentId: student.id,
              academicYearId: activeAcademicYearId,
              semesterId: activeSemesterId,
              subject: {
                teacherId: teacher.id
              }
            }
          }
        }) : 0;

        const presentAttendance = activeAcademicYearId && activeSemesterId ? await prisma.attendance.count({
          where: {
            enrollment: {
              studentId: student.id,
              academicYearId: activeAcademicYearId,
              semesterId: activeSemesterId,
              subject: {
                teacherId: teacher.id
              }
            },
            status: "PRESENT"
          }
        }) : 0;

        const attendanceRate = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0;

        return {
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
          enrolledSubjects: enrollments.length,
          attendanceRate,
          createdAt: student.createdAt.toISOString().split('T')[0],
          image: null, // TODO: Add image support later
        };
      })
    );

    return NextResponse.json({ 
      students: formattedStudents,
      warning: !activeAcademicYearId || !activeSemesterId ? "No active academic period set. Contact admin to activate current term." : null
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

// POST /api/teacher/students - Create new student (for teachers)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createStudentSchema.parse(body);

    // Get active academic year and semester
    const settings = await prisma.setting.findFirst();
    const activeAcademicYearId = settings?.activeAcademicYearId;
    const activeSemesterId = settings?.activeSemesterId;

    // Validate that there's an active academic period
    if (!activeAcademicYearId || !activeSemesterId) {
      return NextResponse.json({ 
        error: "No active academic year or semester set. Please contact admin to activate current term before adding students." 
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
      userId: result.user.id,
      name: result.user.name,
      email: result.user.email,
      studentId: result.studentId,
      department: result.department.name,
      departmentId: result.department.id,
      section: result.section?.name || null,
      sectionId: result.sectionId,
      yearLevel: result.yearLevel,
      enrolledSubjects: 0,
      attendanceRate: 0,
      createdAt: result.createdAt.toISOString().split('T')[0],
      image: null,
    };

    return NextResponse.json({ student: formattedStudent }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error creating student:", error);
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}

