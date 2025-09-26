import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ScheduleOverrideStatus } from "@prisma/client";

const updateScheduleOverrideSchema = z.object({
  status: z.nativeEnum(ScheduleOverrideStatus),
  adminNotes: z.string().optional().nullable(),
});

// PUT /api/admin/schedule-overrides/[id] - Update schedule override status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions as any);
    console.log("PUT request - Session:", session);
    console.log("PUT request - User role:", (session as any)?.user?.role);
    
    if (!session || (session as any).user?.role !== "admin") {
      console.log("PUT request - Access denied");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: overrideId } = await params;
    const body = await request.json();
    const validatedData = updateScheduleOverrideSchema.parse(body);

    const updatedOverride = await prisma.scheduleOverride.update({
      where: { id: overrideId },
      data: {
        status: validatedData.status,
        adminNotes: validatedData.adminNotes,
      },
    });

    return NextResponse.json({ message: "Schedule override updated successfully", override: updatedOverride });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error updating schedule override:", error);
    return NextResponse.json({ error: "Failed to update schedule override" }, { status: 500 });
  }
}



