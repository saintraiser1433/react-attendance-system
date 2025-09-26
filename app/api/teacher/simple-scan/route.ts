import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { formatDateToManilaTime12Hour } from "@/lib/timezone";

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
  let studentId: string | undefined;
  let scheduleId: string | undefined;
  
  try {
    const session = await getServerSession(authOptions as any);
    if (!session || (session as any).user?.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teacherUserId = (session as any).user?.id as string | undefined;
    const body = await req.json();
    
    // Simple QR format: { studentId, studentName, email, department, section, yearLevel, timestamp, generatedBy }
    const { note, timeIn, customDate } = body;
    ({ studentId, scheduleId } = body);

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    if (!scheduleId) {
      return NextResponse.json({ error: "Schedule ID is required" }, { status: 400 });
    }


    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { studentId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        department: {
          select: {
            name: true
          }
        },
        section: {
          select: {
            name: true
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get active academic year and semester from settings
    const settings = await prisma.setting.findUnique({
      where: { id: "singleton" }
    });

    if (!settings?.activeAcademicYearId || !settings?.activeSemesterId) {
      return NextResponse.json({ error: 'No active academic year or semester found' }, { status: 400 });
    }

    // Get the schedule filtered by active academic year and semester
    const schedule = await prisma.schedule.findFirst({
      where: { 
        id: scheduleId,
        academicYearId: settings.activeAcademicYearId,
        semesterId: settings.activeSemesterId
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        teacher: {
          select: {
            userId: true
          }
        },
        overrides: {
          where: {
            status: 'APPROVED'
          },
          select: {
            id: true,
            date: true,
            overrideType: true,
            newStartTime: true,
            newEndTime: true,
            reason: true
          }
        }
      }
    });

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // Verify the schedule belongs to the current teacher
    if (schedule.teacher.userId !== teacherUserId) {
      return NextResponse.json({ error: "Unauthorized: This schedule doesn't belong to you" }, { status: 403 });
    }

    // Check for today's specific date override
    // Use custom date if provided (for testing), otherwise use server date
    const currentDate = customDate ? new Date(customDate) : new Date();
    const todayString = currentDate.toISOString().split('T')[0];
    
    const todayOverride = schedule.overrides.find(override => 
      override.date.toISOString().split('T')[0] === todayString
    );

    // Check if this class is cancelled for today
    if (todayOverride && todayOverride.overrideType === 'cancel') {
      return NextResponse.json({ 
        error: `This class has been cancelled for today (${todayString}). Reason: ${todayOverride.reason}` 
      }, { status: 400 });
    }

    // Get effective start and end times (use today's override if available)
    const effectiveStartTime = todayOverride && todayOverride.overrideType === 'time-change' && todayOverride.newStartTime
      ? todayOverride.newStartTime
      : schedule.startTime;
    const effectiveEndTime = todayOverride && todayOverride.overrideType === 'time-change' && todayOverride.newEndTime
      ? todayOverride.newEndTime
      : schedule.endTime;

    // Validate student criteria against schedule criteria
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
      // Convert year levels to numeric format for comparison
      const convertYearLevel = (yearLevel: string): string => {
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
      };
      
      const normalizedStudentYear = convertYearLevel(studentYear);
      const normalizedScheduleYear = convertYearLevel(schedule.year);
      
      if (normalizedStudentYear !== normalizedScheduleYear) {
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

    // Check if today matches the schedule's day of week
    const now = customDate ? new Date(customDate) : new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    if (schedule.dayOfWeek !== currentDayOfWeek) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const scheduleDayName = dayNames[schedule.dayOfWeek];
      const todayDayName = dayNames[currentDayOfWeek];
      return NextResponse.json({ 
        error: `This schedule is for ${scheduleDayName}, but today is ${todayDayName}. Please scan during the correct day.` 
      }, { status: 400 });
    }

    // Check if student is enrolled in this subject for the current academic period
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: student.id, // Use student database ID, not studentId string
        subjectId: schedule.subjectId,
        academicYearId: schedule.academicYearId,
        semesterId: schedule.semesterId
      }
    });

    if (!enrollment) {
      return NextResponse.json({ 
        error: `Student is not enrolled in ${schedule.subject.code} for the current academic period` 
      }, { status: 400 });
    }

    // Check if there's already an attendance record for today
    const today = customDate ? new Date(customDate) : new Date();
    const todayDateString = today.toDateString(); // Get date string for comparison
    
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        enrollmentId: enrollment.id,
        date: {
          gte: new Date(todayDateString + ' 00:00:00'),
          lt: new Date(todayDateString + ' 23:59:59')
        }
      }
    });

    // Debug logging
    console.log("Scan attempt:", {
      studentId,
      scheduleId,
      enrollment: enrollment.id,
      existingAttendance: existingAttendance?.id,
      schedule: {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        dayOfWeek: schedule.dayOfWeek
      }
    });

    const scanTime = customDate ? new Date(customDate) : new Date();
    const timeInDate = scanTime; // Use custom date if provided, otherwise actual scan time

    let attendance;
    let action = '';

    if (existingAttendance) {
      // Student already has time in, this is time out
      if (existingAttendance.timeOut) {
        return NextResponse.json({ 
          error: "Student has already completed attendance for today (both time in and time out recorded)" 
        }, { status: 400 });
      }

      // Additional check: if student has time in but no time out, and we're trying to scan again
      // This prevents multiple time-in scans
      if (existingAttendance.timeIn && !existingAttendance.timeOut) {
        // This should be a time-out scan, continue with time-out logic below
        console.log("Processing time-out for existing attendance:", existingAttendance.id);
      }

      // Check if current time is close to or past the schedule's end time
      const now = customDate ? new Date(customDate) : new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes for easier comparison
      
      // Parse schedule end time (DateTime format) - use effective end time
      const scheduleEndTimeMinutes = effectiveEndTime.getHours() * 60 + effectiveEndTime.getMinutes();
      
      // Allow time out only when current time is at or after the schedule's end time
      const timeDifference = currentTime - scheduleEndTimeMinutes;
      if (timeDifference < 0) { // Current time is before end time
        const endTimeFormatted = effectiveEndTime.toTimeString().slice(0, 5);
        const currentTimeFormatted = now.toTimeString().slice(0, 5);
        return NextResponse.json({ 
          error: `Time out is only allowed at or after the class end time (${endTimeFormatted}). Current time is ${currentTimeFormatted}.` 
        }, { status: 400 });
      }

      // Record time out
      attendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          timeOut: timeInDate,
          status: "PRESENT"
        }
      });
      action = 'time_out';
    } else {
      // First scan - record time in
      // Double-check to prevent race conditions
      const doubleCheckAttendance = await prisma.attendance.findFirst({
        where: {
          enrollmentId: enrollment.id,
          date: {
            gte: new Date(todayDateString + ' 00:00:00'),
            lt: new Date(todayDateString + ' 23:59:59')
          }
        }
      });

      if (doubleCheckAttendance) {
        return NextResponse.json({ 
          error: "Attendance record already exists for this student today. Please scan again for time-out." 
        }, { status: 400 });
      }

      attendance = await prisma.attendance.create({
        data: {
          enrollmentId: enrollment.id,
          date: new Date(todayDateString),
          status: "PRESENT",
          scannedAt: scanTime,
          timeIn: timeInDate,
          scannerUserId: teacherUserId,
          scheduleId: scheduleId,
          note: note || null
        }
      });
      action = 'time_in';
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorUserId: teacherUserId ?? "",
        actorRole: "teacher",
        action: `attendance.${action}`,
        entity: "Attendance",
        entityId: attendance.id,
        metadata: { 
          scheduleId: scheduleId, 
          enrollmentId: enrollment.id,
          studentId: studentId,
          action: action
        },
      },
    });

    // Calculate if student was late (only for time in)
    let isLate = false;
    let lateMinutes = 0;
    
    if (action === 'time_in') {
      const scheduleStartTime = effectiveStartTime.toTimeString().slice(0, 5);
      const [hours, minutes] = scheduleStartTime.split(':');
      const scheduleTime = customDate ? new Date(customDate) : new Date();
      scheduleTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      isLate = timeInDate > scheduleTime;
      lateMinutes = isLate ? Math.floor((timeInDate.getTime() - scheduleTime.getTime()) / (1000 * 60)) : 0;
    }

    return NextResponse.json({ 
      ok: true, 
      attendanceId: attendance.id,
      action: action,
      studentName: student.user?.name || "Unknown Student",
      studentDepartment: student.department?.name || "Unknown Department",
      studentYear: student.yearLevel || "Unknown Year",
      studentSection: student.section || "Unknown Section",
      timeIn: attendance.timeIn ? formatDateToManilaTime12Hour(attendance.timeIn) : null,
      timeOut: attendance.timeOut ? formatDateToManilaTime12Hour(attendance.timeOut) : null,
      isLate: isLate,
      lateMinutes: lateMinutes,
      subjectCode: schedule.subject.code,
      subjectName: schedule.subject.name,
      message: action === 'time_in' 
        ? `✅ Time IN recorded${isLate ? ` (Late by ${lateMinutes} minutes)` : ''}`
        : `✅ Time OUT recorded`,
      nextAction: action === 'time_in' ? 'Scan again for time-out when class ends' : 'Attendance completed for today'
    });

  } catch (error) {
    console.error("Error in simple scan:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      studentId,
      scheduleId
    });
    return NextResponse.json({ 
      error: "Failed to process scan",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}











