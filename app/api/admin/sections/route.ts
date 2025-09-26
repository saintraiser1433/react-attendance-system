import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSectionSchema = z.object({
  name: z.string().min(1, "Section name is required"),
});

const updateSectionSchema = z.object({
  name: z.string().min(1, "Section name is required").optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session || (session as any).user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sections = await prisma.section.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        departmentId: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error("Error fetching sections:", error);
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session || (session as any).user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createSectionSchema.parse(body);

    // Get the first department as default
    const defaultDepartment = await prisma.department.findFirst({
      orderBy: { createdAt: 'asc' }
    });

    if (!defaultDepartment) {
      return NextResponse.json(
        { error: "No department found. Please create a department first." },
        { status: 400 }
      );
    }

    // Generate a unique code based on section name
    const code = validatedData.name.replace(/\s+/g, '').substring(0, 10).toUpperCase();

    // Check if section name already exists
    const existingSection = await prisma.section.findFirst({
      where: {
        name: validatedData.name,
      },
    });

    if (existingSection) {
      return NextResponse.json(
        { error: "Section name already exists" },
        { status: 400 }
      );
    }

    const section = await prisma.section.create({
      data: {
        name: validatedData.name,
        code: code,
        departmentId: defaultDepartment.id,
      },
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error("Error creating section:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to create section" }, { status: 500 });
  }
}








