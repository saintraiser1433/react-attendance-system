import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bulkSubjectSchema = z.object({
  teacherId: z.string().min(1, "Teacher is required"),
  courseId: z.string().min(1, "Course is required"),
  subjects: z.array(z.object({
    name: z.string().min(1, "Subject name is required"),
    code: z.string().min(1, "Subject code is required"),
    description: z.string().optional(),
    credits: z.number().min(1).max(10),
  })).min(1, "At least one subject is required"),
});

// POST /api/admin/subjects/bulk - Create multiple subjects
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bulkSubjectSchema.parse(body);

    // Verify teacher and course exist
    const teacher = await prisma.teacher.findUnique({
      where: { id: validatedData.teacherId }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const course = await prisma.course.findUnique({
      where: { id: validatedData.courseId }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check for duplicate subject codes
    const subjectCodes = validatedData.subjects.map(s => s.code);
    const existingSubjects = await prisma.subject.findMany({
      where: { 
        code: { in: subjectCodes }
      }
    });

    if (existingSubjects.length > 0) {
      const duplicateCodes = existingSubjects.map(s => s.code);
      return NextResponse.json({ 
        error: `Subject codes already exist: ${duplicateCodes.join(', ')}` 
      }, { status: 400 });
    }

    // Create all subjects in a transaction
    const createdSubjects = await prisma.$transaction(async (tx) => {
      const subjects = [];
      
      for (const subjectData of validatedData.subjects) {
        const subject = await tx.subject.create({
          data: {
            name: subjectData.name,
            code: subjectData.code,
            description: subjectData.description || "",
            credits: subjectData.credits,
            teacherId: validatedData.teacherId,
            courseId: validatedData.courseId,
          },
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    name: true,
                  }
                }
              }
            },
            course: {
              select: {
                name: true,
                code: true,
              }
            },
            _count: {
              select: {
                enrollments: true,
                schedules: true,
              }
            }
          }
        });
        
        subjects.push(subject);
      }
      
      return subjects;
    });

    const formattedSubjects = createdSubjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      description: subject.description || "",
      credits: subject.credits,
      teacherId: subject.teacherId,
      teacherName: subject.teacher?.user?.name || "Unassigned",
      courseId: subject.courseId,
      courseName: subject.course.name,
      enrollmentCount: subject._count.enrollments,
      scheduleCount: subject._count.schedules,
      createdAt: subject.createdAt.toISOString().split('T')[0],
    }));

    return NextResponse.json({ subjects: formattedSubjects }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error creating bulk subjects:", error);
    return NextResponse.json({ error: "Failed to create subjects" }, { status: 500 });
  }
}








