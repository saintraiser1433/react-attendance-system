import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session || (session as any).user?.role !== "teacher") {
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












