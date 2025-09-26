import { NextResponse } from "next/server";
import { verifyQR, QRPayload } from "@/lib/qr";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = (await req.json()) as QRPayload & { scheduleId?: string };
  if (!body?.student_id || !body?.uuid || !body?.academic_year_id || !body?.semester_id || !body?.issued_at || !body?.sig) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }
  if (!verifyQR(body)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
  }

  // Check active year/semester
  const setting = await prisma.setting.findUnique({ where: { id: "singleton" } });
  if (!setting || setting.activeAcademicYearId !== body.academic_year_id || setting.activeSemesterId !== body.semester_id) {
    return NextResponse.json({ ok: false, error: "Inactive term" }, { status: 400 });
  }

  const qr = await prisma.qRLog.findFirst({ where: { uuid: body.uuid, studentId: body.student_id, academicYearId: body.academic_year_id, semesterId: body.semester_id, isRevoked: false } });
  if (!qr) return NextResponse.json({ ok: false, error: "QR not found" }, { status: 400 });

  return NextResponse.json({ ok: true });
}


