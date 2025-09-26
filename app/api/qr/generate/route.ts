import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session || !["teacher", "admin"].includes((session as any).user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  const body = await req.json();
  const { studentId } = body ?? {};
  
  if (!studentId) {
    return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
  }

  // Get student information
  const student = await prisma.student.findUnique({
    where: { studentId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        }
      },
      department: {
        select: {
          name: true,
        }
      },
      section: {
        select: {
          id: true,
          name: true,
          code: true,
        }
      }
    }
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Simple QR payload with student information
  const payload = {
    studentId: student.studentId,
    studentName: student.user.name,
    email: student.user.email,
    department: student.department.name,
    section: student.section?.name || null,
    sectionId: student.sectionId,
    yearLevel: student.yearLevel,
    timestamp: new Date().toISOString(),
    generatedBy: (session as any).user?.id,
  };

  try {
    // Generate QR code image
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(payload), {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });

    return NextResponse.json({
      ...payload,
      qrCodeImage: qrCodeDataURL
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(payload); // Return without QR image if generation fails
  }
}


