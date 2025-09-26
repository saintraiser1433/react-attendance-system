import { createHmac } from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "./db";
import { assertEnv } from "./utils";

type QRPayload = {
  student_id: string;
  uuid: string;
  academic_year_id: string;
  semester_id: string;
  issued_at: string; // ISO
  sig: string; // HMAC hex
};

export async function ensureStudentQR(
  studentId: string,
  academicYearId: string,
  semesterId: string,
  issuerUserId: string
): Promise<QRPayload> {
  const existing = await prisma.qRLog.findUnique({
    where: { studentId_academicYearId_semesterId: { studentId, academicYearId, semesterId } },
  });
  if (existing) {
    return {
      student_id: studentId,
      uuid: existing.uuid,
      academic_year_id: academicYearId,
      semester_id: semesterId,
      issued_at: existing.issuedAt.toISOString(),
      sig: existing.signature,
    };
  }

  const uuid = uuidv4();
  const issuedAt = new Date();
  const sig = signQR({
    student_id: studentId,
    uuid,
    academic_year_id: academicYearId,
    semester_id: semesterId,
    issued_at: issuedAt.toISOString(),
  });

  const created = await prisma.qRLog.create({
    data: {
      studentId,
      academicYearId,
      semesterId,
      uuid,
      issuedAt,
      signature: sig,
      createdById: issuerUserId,
    },
  });

  return {
    student_id: studentId,
    uuid: created.uuid,
    academic_year_id: academicYearId,
    semester_id: semesterId,
    issued_at: created.issuedAt.toISOString(),
    sig: created.signature,
  };
}

export function signQR(payload: Omit<QRPayload, "sig">): string {
  const secret = assertEnv("QR_SECRET");
  const message = `${payload.student_id}|${payload.uuid}|${payload.academic_year_id}|${payload.semester_id}|${payload.issued_at}`;
  return createHmac("sha256", secret).update(message).digest("hex");
}

export function verifyQR(payload: QRPayload): boolean {
  const expected = signQR({
    student_id: payload.student_id,
    uuid: payload.uuid,
    academic_year_id: payload.academic_year_id,
    semester_id: payload.semester_id,
    issued_at: payload.issued_at,
  });
  return expected === payload.sig;
}

export type { QRPayload };


