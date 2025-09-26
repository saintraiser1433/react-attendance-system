import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session || (session as any).user?.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const userId = (session as any).user?.id as string | undefined;
  const body = await req.json();
  const { scheduleId, date, newStartTime, newEndTime, isCancelled, isHalfDay, reason } = body ?? {};
  if (!scheduleId || !date) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Find existing override
  const existingOverride = await prisma.scheduleOverride.findFirst({
    where: { scheduleId, date: new Date(date) },
  });

  const override = existingOverride 
    ? await prisma.scheduleOverride.update({
        where: { id: existingOverride.id },
        data: { 
          newStartTime: newStartTime ? new Date(newStartTime) : null, 
          newEndTime: newEndTime ? new Date(newEndTime) : null, 
          overrideType: isCancelled ? "cancel" : isHalfDay ? "half-day" : "time-change",
          reason: reason ?? null 
        },
      })
    : await prisma.scheduleOverride.create({
        data: { 
          scheduleId, 
          date: new Date(date), 
          newStartTime: newStartTime ? new Date(newStartTime) : null, 
          newEndTime: newEndTime ? new Date(newEndTime) : null, 
          overrideType: isCancelled ? "cancel" : isHalfDay ? "half-day" : "time-change",
          reason: reason ?? null 
        },
      });

  await prisma.auditLog.create({
    data: { actorUserId: userId ?? "", actorRole: "teacher", action: "schedule.override", entity: "Schedule", entityId: scheduleId, metadata: { overrideId: override.id } },
  });

  return NextResponse.json({ ok: true, override });
}


