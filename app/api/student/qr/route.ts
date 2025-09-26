import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

// GET /api/student/qr - Get student QR code data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    
    if (!session || (session as any).user?.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = (session as any).user?.id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    // Get student data
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        department: {
          select: {
            name: true
          }
        },
        section: {
          select: {
            name: true
          }
        },
        enrollments: {
          include: {
            subject: {
              select: {
                code: true,
                name: true
              }
            },
            academicYear: {
              select: {
                name: true
              }
            },
            semester: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Generate QR code data
    const qrData = {
      studentId: student.studentId,
      name: student.user.name,
      email: student.user.email,
      department: student.department.name,
      section: student.section?.name || "N/A",
      yearLevel: student.yearLevel
    };

    // Generate QR code image
    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Get current academic period
    const settings = await prisma.setting.findFirst();
    let activeAcademicYear = null;
    let activeSemester = null;

    if (settings) {
      if (settings.activeAcademicYearId) {
        activeAcademicYear = await prisma.academicYear.findUnique({
          where: { id: settings.activeAcademicYearId },
          select: { name: true }
        });
      }
      if (settings.activeSemesterId) {
        activeSemester = await prisma.semester.findUnique({
          where: { id: settings.activeSemesterId },
          select: { name: true }
        });
      }
    }

    // Filter enrollments for current academic period
    const currentEnrollments = student.enrollments.filter(enrollment => {
      const isCurrentYear = !activeAcademicYear || enrollment.academicYear.name === activeAcademicYear.name;
      const isCurrentSemester = !activeSemester || enrollment.semester.name === activeSemester.name;
      return isCurrentYear && isCurrentSemester;
    });

    // Return QR code data
    return NextResponse.json({
      studentId: student.studentId,
      studentName: student.user.name,
      email: student.user.email,
      department: student.department.name,
      section: student.section?.name || "N/A",
      yearLevel: student.yearLevel,
      academicYear: activeAcademicYear?.name || "N/A",
      semester: activeSemester?.name || "N/A",
      qrCodeImage: qrCodeImage,
      enrolledSubjects: currentEnrollments.map(enrollment => ({
        subjectCode: enrollment.subject.code,
        subjectName: enrollment.subject.name
      })),
      hasEnrollments: currentEnrollments.length > 0
    });

  } catch (error) {
    console.error("Error fetching student QR data:", error);
    return NextResponse.json({ error: "Failed to fetch student data" }, { status: 500 });
  }
}

