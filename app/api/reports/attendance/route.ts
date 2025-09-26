import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { toCSV } from "@/lib/csv";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session || !["admin", "teacher"].includes((session as any).user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId");
  const date = searchParams.get("date"); // YYYY-MM-DD
  if (!subjectId || !date) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const day = new Date(date);
  const rows = await prisma.attendance.findMany({
    where: { date: new Date(day.toDateString()), enrollment: { subjectId } },
    include: { enrollment: { include: { student: { include: { user: true } } } } },
  });

  const data = rows.map((r) => ({
    studentId: r.enrollment.student.studentId,
    name: r.enrollment.student.user.name,
    status: r.status,
    scannedAt: r.scannedAt?.toISOString() ?? "",
    note: r.note ?? "",
  }));

  const csv = toCSV(data as any);
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename=attendance-${subjectId}-${date}.csv` } });
}


