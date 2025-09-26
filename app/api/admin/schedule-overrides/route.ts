import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ScheduleOverrideStatus } from "@prisma/client";

// Helper function to format time from date object
function formatTimeFromDate(date: Date): string {
  return date.toLocaleTimeString("en-US", { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  });
}

// GET /api/admin/schedule-overrides - Get all schedule override requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    console.log("GET request - Session:", session);
    console.log("GET request - User role:", (session as any)?.user?.role);
    
    if (!session || (session as any).user?.role !== "admin") {
      console.log("GET request - Access denied");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const overrides = await prisma.scheduleOverride.findMany({
      include: {
        schedule: {
          include: {
            subject: {
              select: {
                name: true,
                code: true,
              },
            },
            teacher: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedOverrides = overrides.map((override) => ({
      id: override.id,
      scheduleId: override.scheduleId,
      teacherName: override.schedule.teacher.user.name,
      teacherEmail: override.schedule.teacher.user.email || "N/A",
      subjectName: override.schedule.subject.name,
      subjectCode: override.schedule.subject.code,
      originalStartTime: override.schedule.startTime.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true }),
      originalEndTime: override.schedule.endTime.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true }),
      date: override.date.toISOString().split("T")[0],
      reason: override.reason,
      overrideType: override.overrideType,
      newStartTime: override.newStartTime ? formatTimeFromDate(override.newStartTime) : null,
      newEndTime: override.newEndTime ? formatTimeFromDate(override.newEndTime) : null,
      status: override.status,
      adminNotes: override.adminNotes,
      createdAt: override.createdAt.toISOString(),
    }));

    return NextResponse.json({ overrides: formattedOverrides });
  } catch (error) {
    console.error("Error fetching schedule overrides:", error);
    return NextResponse.json({ error: "Failed to fetch schedule overrides" }, { status: 500 });
  }
}









