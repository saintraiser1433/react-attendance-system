import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/admin/settings - Get current settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.setting.findUnique({
      where: { id: "singleton" }
    });

    if (!settings) {
      return NextResponse.json({
        activeAcademicYearId: null,
        activeSemesterId: null
      });
    }

    return NextResponse.json({
      activeAcademicYearId: settings.activeAcademicYearId,
      activeSemesterId: settings.activeSemesterId
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

