import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session || (session as any).user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: teacherId } = await params;

    // Get teacher subjects with enrollment counts
    const subjects = await prisma.subject.findMany({
      where: {
        teacherId: teacherId
      },
      include: {
        enrollments: {
          select: {
            id: true,
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
      },
      orderBy: {
        code: 'asc'
      }
    });

    // Format the subjects data
    const formattedSubjects = subjects.map(subject => {
      // Get unique academic year and semester from enrollments
      const uniquePeriods = subject.enrollments.reduce((acc, enrollment) => {
        const key = `${enrollment.academicYear.name}-${enrollment.semester.name}`;
        if (!acc[key]) {
          acc[key] = {
            academicYear: enrollment.academicYear.name,
            semester: enrollment.semester.name
          };
        }
        return acc;
      }, {} as Record<string, { academicYear: string; semester: string }>);

      const periods = Object.values(uniquePeriods);
      const primaryPeriod = periods[0] || { academicYear: 'N/A', semester: 'N/A' };

      return {
        id: subject.id,
        code: subject.code,
        name: subject.name,
        academicYear: primaryPeriod.academicYear,
        semester: primaryPeriod.semester,
        studentCount: subject.enrollments.length
      };
    });

    return NextResponse.json({ 
      subjects: formattedSubjects 
    });

  } catch (error) {
    console.error("Error fetching teacher subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher subjects" },
      { status: 500 }
    );
  }
}












