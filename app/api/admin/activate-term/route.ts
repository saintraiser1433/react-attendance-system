import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { academicYearId, semesterId } = body ?? {};
  if (!academicYearId || !semesterId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  await prisma.$transaction([
    prisma.academicYear.updateMany({ data: { isActive: false } }),
    prisma.semester.updateMany({ data: { isActive: false } }),
    prisma.academicYear.update({ where: { id: academicYearId }, data: { isActive: true } }),
    prisma.semester.update({ where: { id: semesterId }, data: { isActive: true } }),
    prisma.setting.upsert({ where: { id: "singleton" }, update: { activeAcademicYearId: academicYearId, activeSemesterId: semesterId }, create: { id: "singleton", activeAcademicYearId: academicYearId, activeSemesterId: semesterId } }),
  ]);

  await prisma.auditLog.create({ data: { actorUserId: session.user.id, actorRole: "admin", action: "term.activate", entity: "Setting", entityId: "singleton", metadata: { academicYearId, semesterId } } });

  return NextResponse.json({ ok: true });
}


