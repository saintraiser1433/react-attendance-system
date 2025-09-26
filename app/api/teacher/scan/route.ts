import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { verifyQR, QRPayload } from "@/lib/qr";

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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session || (session as any).user?.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const teacherUserId = (session as any).user?.id as string | undefined;
  const body = (await req.json()) as QRPayload & { scheduleId?: string; note?: string; timeIn?: string };
  if (!body?.student_id || !body?.uuid || !body?.academic_year_id || !body?.semester_id || !body?.issued_at || !body?.sig) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (!verifyQR(body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const setting = await prisma.setting.findUnique({ where: { id: "singleton" } });
  if (!setting || setting.activeAcademicYearId !== body.academic_year_id || setting.activeSemesterId !== body.semester_id) {
    return NextResponse.json({ error: "Inactive term" }, { status: 400 });
  }

  const qr = await prisma.qRLog.findFirst({ where: { uuid: body.uuid, studentId: body.student_id, academicYearId: body.academic_year_id, semesterId: body.semester_id, isRevoked: false } });
  if (!qr) return NextResponse.json({ error: "QR not found" }, { status: 400 });

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: body.student_id, academicYearId: body.academic_year_id, semesterId: body.semester_id },
    include: {
      student: {
        include: {
          department: true,
          section: {
            select: {
              name: true,
            }
          },
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      },
      subject: {
        include: {
          schedules: {
            where: {
              academicYearId: body.academic_year_id,
              semesterId: body.semester_id,
            }
          }
        }
      }
    }
  });
  if (!enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 400 });

  // Get the specific schedule being used for attendance
  const schedule = await prisma.schedule.findUnique({
    where: { id: body.scheduleId || "" }
  });

  // Validate student criteria against schedule criteria
  if (schedule) {
    const student = enrollment.student;
    const studentDepartment = student.department?.name;
    const studentYear = student.yearLevel?.toString();
    const studentSection = student.section?.name;

    // Check department match
    if (schedule.department && studentDepartment !== schedule.department) {
      return NextResponse.json({ 
        error: `Student department (${studentDepartment}) does not match schedule department (${schedule.department})` 
      }, { status: 400 });
    }

    // Check year level match
    if (schedule.year && studentYear) {
      const convertedStudentYear = convertYearLevel(studentYear);
      if (convertedStudentYear !== schedule.year) {
        return NextResponse.json({ 
          error: `Student year level (${studentYear}) does not match schedule year level (${schedule.year})` 
        }, { status: 400 });
      }
    }

    // Check section match
    if (schedule.sectionId && student.sectionId !== schedule.sectionId) {
      return NextResponse.json({ 
        error: `Student section (${studentSection}) does not match schedule section` 
      }, { status: 400 });
    }
  }

  // Check if there's an active schedule for this subject
  if (!enrollment.subject.schedules || enrollment.subject.schedules.length === 0) {
    return NextResponse.json({ error: "No active schedule found for this subject. Please contact admin to set up schedules." }, { status: 400 });
  }

  // Check if there's a schedule for today
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const hasScheduleToday = enrollment.subject.schedules.some(schedule => schedule.dayOfWeek === dayOfWeek);
  
  if (!hasScheduleToday) {
    return NextResponse.json({ error: "No schedule for this subject today. Check the subject schedule." }, { status: 400 });
  }

  const now = new Date();
  const timeInDate = body.timeIn ? new Date(`1970-01-01T${body.timeIn}Z`) : now;
  
  const attendance = await prisma.attendance.upsert({
    where: { enrollmentId_date: { enrollmentId: enrollment.id, date: new Date(now.toDateString()) } },
    update: { 
      status: "PRESENT", 
      scannedAt: now, 
      timeIn: timeInDate,
      scannerUserId: teacherUserId, 
      scheduleId: body.scheduleId ?? undefined, 
      note: body.note ?? undefined 
    },
    create: { 
      enrollmentId: enrollment.id, 
      date: new Date(now.toDateString()), 
      status: "PRESENT", 
      scannedAt: now, 
      timeIn: timeInDate,
      scannerUserId: teacherUserId, 
      scheduleId: body.scheduleId ?? undefined, 
      note: body.note ?? undefined 
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: teacherUserId ?? "",
      actorRole: "teacher",
      action: "attendance.scan",
      entity: "Attendance",
      entityId: attendance.id,
      metadata: { scheduleId: body.scheduleId, enrollmentId: enrollment.id },
    },
  });

  return NextResponse.json({ 
    ok: true, 
    attendanceId: attendance.id,
    studentName: enrollment.student.user?.name || "Unknown Student",
    studentDepartment: enrollment.student.department?.name || "Unknown Department",
    studentYear: enrollment.student.yearLevel || "Unknown Year",
    studentSection: enrollment.student.section || "Unknown Section"
  });
}


