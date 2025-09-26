import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSectionSchema = z.object({
  name: z.string().min(1, "Section name is required").optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session || (session as any).user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const section = await prisma.section.findUnique({
      where: { id },
      include: {
        Department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        Student: {
          select: {
            id: true,
            studentId: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        Schedule: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            subject: {
              select: {
                code: true,
                name: true,
              },
            },
            teacher: {
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json(section);
  } catch (error) {
    console.error("Error fetching section:", error);
    return NextResponse.json({ error: "Failed to fetch section" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session || (session as any).user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateSectionSchema.parse(body);

    // Check if section exists
    const existingSection = await prisma.section.findUnique({
      where: { id },
    });

    if (!existingSection) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Check if section name already exists (if name is being updated)
    if (validatedData.name) {
      const duplicateSection = await prisma.section.findFirst({
        where: {
          name: validatedData.name,
          id: { not: id },
        },
      });

      if (duplicateSection) {
        return NextResponse.json(
          { error: "Section name already exists" },
          { status: 400 }
        );
      }
    }

    const section = await prisma.section.update({
      where: { id },
      data: validatedData,
      include: {
        Department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json(section);
  } catch (error) {
    console.error("Error updating section:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session || (session as any).user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Check if section exists
    const section = await prisma.section.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            Student: true,
            Schedule: true,
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Check if section has students or schedules
    if (section._count.Student > 0) {
      return NextResponse.json(
        { error: "Cannot delete section with assigned students" },
        { status: 400 }
      );
    }

    if (section._count.Schedule > 0) {
      return NextResponse.json(
        { error: "Cannot delete section with assigned schedules" },
        { status: 400 }
      );
    }

    await prisma.section.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Section deleted successfully" });
  } catch (error) {
    console.error("Error deleting section:", error);
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 });
  }
}








