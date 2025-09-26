import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Helper function to convert year level formats
function convertYearLevel(yearLevel: string): string {
  // Convert "1st Year" to "1", "2nd Year" to "2", etc.
  if (yearLevel.includes("st Year")) {
    return yearLevel.replace("st Year", "");
  }
  if (yearLevel.includes("nd Year")) {
    return yearLevel.replace("nd Year", "");
  }
  if (yearLevel.includes("rd Year")) {
    return yearLevel.replace("rd Year", "");
  }
  if (yearLevel.includes("th Year")) {
    return yearLevel.replace("th Year", "");
  }
  // Already in numeric format
  return yearLevel;
}

const createEnrollmentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  subjectId: z.string().min(1, "Subject is required"),
});

// GET /api/teacher/enrollments - Get all enrollments for teacher's subjects
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Get active academic year and semester from settings
    const settings = await prisma.setting.findUnique({
      where: { id: "singleton" }
    });

    if (!settings?.activeAcademicYearId || !settings?.activeSemesterId) {
      return NextResponse.json({ error: 'No active academic year or semester found' }, { status: 400 });
    }

    // Get enrollments for teacher's subjects filtered by active academic year and semester
    const enrollments = await prisma.enrollment.findMany({
      where: {
        subject: {
          teacherId: teacher.id
        },
        academicYearId: settings.activeAcademicYearId,
        semesterId: settings.activeSemesterId
      },
      include: {
        student: {
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
        },
        subject: {
          select: {
            name: true,
            code: true,
          }
        },
        academicYear: {
          select: {
            name: true,
          }
        },
        semester: {
          select: {
            name: true,
          }
        },
        _count: {
          select: {
            attendance: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedEnrollments = enrollments.map(enrollment => ({
      id: enrollment.id,
      studentId: enrollment.studentId,
      studentName: enrollment.student.user.name,
      studentEmail: enrollment.student.user.email,
      studentIdNumber: enrollment.student.studentId,
      department: enrollment.student.department.name,
      section: enrollment.student.section?.name || null,
      sectionId: enrollment.student.sectionId,
      yearLevel: enrollment.student.yearLevel,
      subjectId: enrollment.subjectId,
      subjectName: enrollment.subject.name,
      subjectCode: enrollment.subject.code,
      academicYearId: enrollment.academicYearId,
      academicYearName: enrollment.academicYear.name,
      semesterId: enrollment.semesterId,
      semesterName: enrollment.semester.name,
      attendanceCount: enrollment._count.attendance,
      createdAt: enrollment.createdAt.toISOString().split('T')[0],
    }));

    return NextResponse.json({ enrollments: formattedEnrollments });
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 });
  }
}

// POST /api/teacher/enrollments - Enroll student in subject
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log("POST /api/teacher/enrollments - Session:", session);
    
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("POST /api/teacher/enrollments - Request body:", body);
    
    const validatedData = createEnrollmentSchema.parse(body);
    console.log("POST /api/teacher/enrollments - Validated data:", validatedData);

    // Find the teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Get the active academic year and semester from settings
    const settings = await prisma.setting.findUnique({
      where: { id: "singleton" }
    });

    console.log("POST /api/teacher/enrollments - Settings:", settings);

    if (!settings?.activeAcademicYearId || !settings?.activeSemesterId) {
      console.log("POST /api/teacher/enrollments - No active academic year/semester in settings");
      return NextResponse.json({ error: "No active academic year or semester found. Please contact admin to activate current term." }, { status: 400 });
    }

    const activeAcademicYear = await prisma.academicYear.findUnique({
      where: { id: settings.activeAcademicYearId }
    });

    const activeSemester = await prisma.semester.findUnique({
      where: { id: settings.activeSemesterId }
    });

    if (!activeAcademicYear || !activeSemester) {
      return NextResponse.json({ error: "Active academic year or semester not found in database. Please contact admin." }, { status: 400 });
    }

    // Verify the subject belongs to this teacher
    const subject = await prisma.subject.findFirst({
      where: {
        id: validatedData.subjectId,
        teacherId: teacher.id
      }
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found or not assigned to you" }, { status: 404 });
    }

    // Check if student exists and get department info
    const student = await prisma.student.findUnique({
      where: { id: validatedData.studentId },
      include: {
        department: true,
        section: {
          select: {
            name: true,
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check if enrollment already exists
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: validatedData.studentId,
        subjectId: validatedData.subjectId,
        academicYearId: activeAcademicYear.id,
        semesterId: activeSemester.id,
      }
    });

    if (existingEnrollment) {
      return NextResponse.json({ error: "Student is already enrolled in this subject" }, { status: 400 });
    }

    // Check if student's department, year, and section match any existing schedules
    const convertedYearLevel = convertYearLevel(student.yearLevel || "");
    
    // First, check if there are any schedules for this subject in the current academic period
    const subjectSchedules = await prisma.schedule.findMany({
      where: {
        subjectId: validatedData.subjectId,
        academicYearId: activeAcademicYear.id,
        semesterId: activeSemester.id,
      }
    });

    if (subjectSchedules.length === 0) {
      return NextResponse.json({ 
        error: `No schedules found for subject "${subject.name}" in the current academic period (${activeAcademicYear.name} - ${activeSemester.name}). Please create schedules first.` 
      }, { status: 400 });
    }

    // Try to find a matching schedule with flexible matching
    let matchingSchedule = await prisma.schedule.findFirst({
      where: {
        subjectId: validatedData.subjectId,
        academicYearId: activeAcademicYear.id,
        semesterId: activeSemester.id,
        OR: [
          // Exact match with department, year, and section
          {
            AND: [
              { department: student.department.name },
              { year: convertedYearLevel },
              { sectionId: student.sectionId }
            ]
          },
          // Match with department and year, but any section
          {
            AND: [
              { department: student.department.name },
              { year: convertedYearLevel },
              { sectionId: null }
            ]
          },
          // Match with department only
          {
            AND: [
              { department: student.department.name },
              { year: null },
              { sectionId: null }
            ]
          },
          // General schedules (no specific department/year/section)
          {
            AND: [
              { department: null },
              { year: null },
              { sectionId: null }
            ]
          }
        ]
      }
    });

    // If no flexible match found, use the first available schedule for this subject
    if (!matchingSchedule) {
      matchingSchedule = subjectSchedules[0];
    }

    if (!matchingSchedule) {
      return NextResponse.json({ 
        error: `Cannot enroll student. No suitable schedule found for subject "${subject.name}". Please ensure schedules are created for this subject.` 
      }, { status: 400 });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: validatedData.studentId,
        subjectId: validatedData.subjectId,
        academicYearId: activeAcademicYear.id,
        semesterId: activeSemester.id,
      },
      include: {
        student: {
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
        },
        subject: {
          select: {
            name: true,
            code: true,
          }
        },
        academicYear: {
          select: {
            name: true,
          }
        },
        semester: {
          select: {
            name: true,
          }
        },
        _count: {
          select: {
            attendance: true,
          }
        }
      }
    });

    const formattedEnrollment = {
      id: enrollment.id,
      studentId: enrollment.studentId,
      studentName: enrollment.student.user.name,
      studentEmail: enrollment.student.user.email,
      studentIdNumber: enrollment.student.studentId,
      department: enrollment.student.department.name,
      section: enrollment.student.section?.name || null,
      sectionId: enrollment.student.sectionId,
      yearLevel: enrollment.student.yearLevel,
      subjectId: enrollment.subjectId,
      subjectName: enrollment.subject.name,
      subjectCode: enrollment.subject.code,
      academicYearId: enrollment.academicYearId,
      academicYearName: enrollment.academicYear.name,
      semesterId: enrollment.semesterId,
      semesterName: enrollment.semester.name,
      attendanceCount: enrollment._count.attendance,
      createdAt: enrollment.createdAt.toISOString().split('T')[0],
    };

    return NextResponse.json({ enrollment: formattedEnrollment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error creating enrollment:", error);
    return NextResponse.json({ error: "Failed to create enrollment" }, { status: 500 });
  }
}











