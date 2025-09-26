import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Helper function to check for time conflicts
function hasTimeConflict(
  newStart: string,
  newEnd: string,
  existingStart: Date,
  existingEnd: Date
): boolean {
  // Convert 12-hour format to 24-hour format for comparison
  const convertTo24Hour = (timeStr: string) => {
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      // Handle 12-hour format like "8:00 AM" or "1:30 PM"
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split(':');
      let hour24 = parseInt(hours);
      
      if (period === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (period === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      
      return `${hour24.toString().padStart(2, '0')}:${minutes}`;
    }
    // Already in 24-hour format like "08:00"
    return timeStr;
  };
  
  const newStart24 = convertTo24Hour(newStart);
  const newEnd24 = convertTo24Hour(newEnd);
  
  const newStartTime = new Date(`1970-01-01T${newStart24}:00`);
  const newEndTime = new Date(`1970-01-01T${newEnd24}:00`);
  
  // Check if new schedule overlaps with existing schedule
  return (
    (newStartTime < existingEnd && newEndTime > existingStart) ||
    (newStartTime.getTime() === existingStart.getTime()) ||
    (newEndTime.getTime() === existingEnd.getTime())
  );
}

const assignWithScheduleSchema = z.object({
  teacherId: z.string().min(1, "Teacher is required"),
  courseId: z.string().min(1, "Course is required"),
  schedules: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    room: z.string().optional().default(""),
    department: z.string().optional().default(""),
    year: z.string().optional().default(""),
    sectionId: z.string().optional().default("")
  })).optional().default([])
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("=== Assign Subject API Called ===");
    
    const session = await getServerSession(authOptions);
    
    if (!session || (session as any).user?.role !== "admin") {
      console.log("Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    console.log("Subject ID:", id);
    
    const body = await request.json();
    console.log("Request body:", JSON.stringify(body, null, 2));
    
    const validatedData = assignWithScheduleSchema.parse(body);
    const { teacherId, courseId, schedules } = validatedData;
    
    console.log("Validated data - Teacher:", teacherId, "Course:", courseId, "Schedules:", schedules.length);

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id },
      include: {
        teacher: true,
        course: true
      }
    });

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check for conflicts before starting transaction
    let conflictingSchedules = [];
    let validSchedules = [];
    
    console.log("Starting conflict detection for", schedules.length, "schedules");
    
    if (schedules.length > 0) {
      // Get current active academic year and semester
      const settings = await prisma.setting.findUnique({
        where: { id: "singleton" }
      });

      if (!settings || !settings.activeAcademicYearId || !settings.activeSemesterId) {
        throw new Error("No active academic year or semester found");
      }

      const activeAcademicYear = await prisma.academicYear.findUnique({
        where: { id: settings.activeAcademicYearId }
      });

      const activeSemester = await prisma.semester.findUnique({
        where: { id: settings.activeSemesterId }
      });

      if (!activeAcademicYear || !activeSemester) {
        throw new Error("Active academic year or semester not found");
      }

      // Get existing schedules for this teacher to check for conflicts
      const existingSchedules = await prisma.schedule.findMany({
        where: {
          teacherId: teacherId,
          academicYearId: activeAcademicYear.id,
          semesterId: activeSemester.id
        }
      });

      // Check for time conflicts for each new schedule
      for (const newSchedule of schedules) {
        let hasConflict = false;
        const conflictDetails = [];

        // Check against existing schedules for the same day
        for (const existingSchedule of existingSchedules) {
          if (existingSchedule.dayOfWeek === newSchedule.dayOfWeek) {
            if (hasTimeConflict(
              newSchedule.startTime,
              newSchedule.endTime,
              existingSchedule.startTime,
              existingSchedule.endTime
            )) {
              hasConflict = true;
              conflictDetails.push({
                day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][existingSchedule.dayOfWeek],
                time: `${existingSchedule.startTime.toTimeString().slice(0, 5)} - ${existingSchedule.endTime.toTimeString().slice(0, 5)}`
              });
            }
          }
        }

        if (hasConflict) {
          conflictingSchedules.push({
            day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][newSchedule.dayOfWeek],
            time: `${newSchedule.startTime} - ${newSchedule.endTime}`,
            conflicts: conflictDetails
          });
        } else {
          validSchedules.push(newSchedule);
        }
      }
    }

    console.log("Conflict detection results:");
    console.log("- Valid schedules:", validSchedules.length);
    console.log("- Conflicting schedules:", conflictingSchedules.length);
    if (conflictingSchedules.length > 0) {
      console.log("- Conflicts:", conflictingSchedules);
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update the subject assignment
      const updatedSubject = await tx.subject.update({
        where: { id },
        data: {
          teacherId,
          courseId
        },
        include: {
          teacher: {
            include: { user: true }
          },
          course: true
        }
      });

      // Create the valid (non-conflicting) schedules
      if (validSchedules.length > 0) {
        // Get current active academic year and semester
        const settings = await tx.setting.findUnique({
          where: { id: "singleton" }
        });

        if (!settings || !settings.activeAcademicYearId || !settings.activeSemesterId) {
          throw new Error("No active academic year or semester found");
        }

        const activeAcademicYear = await tx.academicYear.findUnique({
          where: { id: settings.activeAcademicYearId }
        });

        const activeSemester = await tx.semester.findUnique({
          where: { id: settings.activeSemesterId }
        });

        if (!activeAcademicYear || !activeSemester) {
          throw new Error("Active academic year or semester not found");
        }

        await tx.schedule.createMany({
          data: validSchedules.map(schedule => {
            // Convert 12-hour format to 24-hour format
            const convertTo24Hour = (timeStr: string) => {
              if (timeStr.includes('AM') || timeStr.includes('PM')) {
                // Handle 12-hour format like "8:00 AM" or "1:30 PM"
                const [time, period] = timeStr.split(' ');
                const [hours, minutes] = time.split(':');
                let hour24 = parseInt(hours);
                
                if (period === 'PM' && hour24 !== 12) {
                  hour24 += 12;
                } else if (period === 'AM' && hour24 === 12) {
                  hour24 = 0;
                }
                
                return `${hour24.toString().padStart(2, '0')}:${minutes}`;
              }
              // Already in 24-hour format like "08:00"
              return timeStr;
            };
            
            const startTime24 = convertTo24Hour(schedule.startTime);
            const endTime24 = convertTo24Hour(schedule.endTime);
            
            return {
              teacherId,
              subjectId: id,
              academicYearId: activeAcademicYear.id,
              semesterId: activeSemester.id,
              dayOfWeek: schedule.dayOfWeek,
              startTime: new Date(`1970-01-01T${startTime24}:00`),
              endTime: new Date(`1970-01-01T${endTime24}:00`),
              room: schedule.room || null,
              department: schedule.department || null,
              year: schedule.year || null,
              sectionId: schedule.sectionId && schedule.sectionId.trim() !== "" ? schedule.sectionId : null
            };
          })
        });
      }

      return updatedSubject;
    });

    // Prepare response message based on conflicts
    let message = "Subject assigned successfully";
    let status = 200;
    
    if (conflictingSchedules.length > 0 && validSchedules.length > 0) {
      message = `Subject assigned with ${validSchedules.length} schedule(s). ${conflictingSchedules.length} schedule(s) had conflicts and were skipped.`;
    } else if (conflictingSchedules.length > 0 && validSchedules.length === 0) {
      message = "No schedules were created due to conflicts";
      status = 400;
    } else if (validSchedules.length > 0) {
      message = `Subject assigned successfully with ${validSchedules.length} schedule(s)`;
    }

    return NextResponse.json({
      message,
      subject: {
        id: result.id,
        name: result.name,
        code: result.code,
        description: result.description,
        credits: result.credits,
        teacherId: result.teacherId,
        teacherName: result.teacher?.user?.name || "Unassigned",
        courseId: result.courseId,
        courseName: result.course.name,
        schedulesCreated: validSchedules.length,
        schedulesSkipped: conflictingSchedules.length,
        conflicts: conflictingSchedules.length > 0 ? conflictingSchedules : undefined
      }
    }, { status });

  } catch (error) {
    console.error("Assign subject with schedule error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues[0].message },
        { status: 400 }
      );
    }

    // Check if it's a schedule conflict error
    if (error instanceof Error && error.message.includes("Schedule conflicts detected")) {
      return NextResponse.json(
        { 
          error: "Schedule conflicts detected", 
          details: error.message.replace("Schedule conflicts detected: ", "")
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to assign subject with schedule" },
      { status: 500 }
    );
  }
}








