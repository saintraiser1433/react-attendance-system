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
  const newStartTime = new Date(`1970-01-01T${newStart}:00`);
  const newEndTime = new Date(`1970-01-01T${newEnd}:00`);
  
  // Check if new schedule overlaps with existing schedule
  return (
    (newStartTime < existingEnd && newEndTime > existingStart) ||
    (newStartTime.getTime() === existingStart.getTime()) ||
    (newEndTime.getTime() === existingEnd.getTime())
  );
}

const bulkAssignWithScheduleSchema = z.object({
  teacherId: z.string().min(1, "Teacher is required"),
  courseId: z.string().min(1, "Course is required"),
  subjectIds: z.array(z.string()).min(1, "At least one subject is required"),
  schedules: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    room: z.string().optional().default(""),
    department: z.string().optional().default(""),
    year: z.string().optional().default(""),
    section: z.string().optional().default("")
  })).optional().default([])
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session as any).user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bulkAssignWithScheduleSchema.parse(body);
    const { teacherId, courseId, subjectIds, schedules } = validatedData;

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

    // Check if all subjects exist and are unassigned
    const subjects = await prisma.subject.findMany({
      where: {
        id: { in: subjectIds },
        teacherId: null // Only unassigned subjects
      }
    });

    if (subjects.length !== subjectIds.length) {
      return NextResponse.json({ 
        error: "Some subjects are already assigned or don't exist" 
      }, { status: 400 });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update all subjects
      await tx.subject.updateMany({
        where: {
          id: { in: subjectIds }
        },
        data: {
          teacherId,
          courseId
        }
      });

      // Initialize schedule tracking variables
      let scheduleData = [];
      let conflictingSchedules = [];

      // Create schedules for each subject
      if (schedules.length > 0) {
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

        // Get existing schedules for all subjects to check for conflicts
        const existingSchedules = await tx.schedule.findMany({
          where: {
            subjectId: { in: subjectIds },
            academicYearId: activeAcademicYear.id,
            semesterId: activeSemester.id
          }
        });


        for (const subjectId of subjectIds) {
          for (const schedule of schedules) {
            let hasConflict = false;
            const conflictDetails = [];

            // Check against existing schedules for the same subject and day
            for (const existingSchedule of existingSchedules) {
              if (existingSchedule.subjectId === subjectId && existingSchedule.dayOfWeek === schedule.dayOfWeek) {
                if (hasTimeConflict(
                  schedule.startTime,
                  schedule.endTime,
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
                subjectId,
                day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][schedule.dayOfWeek],
                time: `${schedule.startTime} - ${schedule.endTime}`,
                conflicts: conflictDetails
              });
            } else {
              scheduleData.push({
                teacherId,
                subjectId,
                academicYearId: activeAcademicYear.id,
                semesterId: activeSemester.id,
                dayOfWeek: schedule.dayOfWeek,
                startTime: new Date(`1970-01-01T${schedule.startTime}:00`),
                endTime: new Date(`1970-01-01T${schedule.endTime}:00`),
                room: schedule.room || null,
                department: schedule.department || null,
                year: schedule.year || null,
                section: schedule.section || null
              });
            }
          }
        }

        // If there are conflicts, return error with details
        if (conflictingSchedules.length > 0) {
          throw new Error(`Time conflicts detected: ${JSON.stringify(conflictingSchedules)}`);
        }

        // Create only the valid (non-conflicting) schedules
        if (scheduleData.length > 0) {
          await tx.schedule.createMany({
            data: scheduleData
          });
        }
      }

      return {
        subjectsUpdated: subjectIds.length,
        schedulesCreated: scheduleData.length
      };
    });

    return NextResponse.json({
      message: "Subjects assigned successfully with schedules",
      result: {
        subjectsAssigned: result.subjectsUpdated,
        schedulesCreated: result.schedulesCreated,
        teacherName: teacher.user.name,
        courseName: course.name
      }
    });

  } catch (error) {
    console.error("Bulk assign subjects with schedule error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to bulk assign subjects with schedule" },
      { status: 500 }
    );
  }
}








