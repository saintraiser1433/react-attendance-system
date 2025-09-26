import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { writeFile } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const attendanceId = formData.get("attendanceId") as string;

    if (!file || !attendanceId) {
      return NextResponse.json({ error: "Missing file or attendance ID" }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads");
    
    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Save attachment record
    const attachment = await prisma.attendanceAttachment.create({
      data: {
        attendanceId,
        url: `/uploads/${filename}`,
        contentType: file.type,
        size: file.size,
        createdById: (session as any).user?.id,
      },
    });

    return NextResponse.json({ 
      success: true, 
      attachment: {
        id: attachment.id,
        url: attachment.url,
        contentType: attachment.contentType,
        size: attachment.size,
      }
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
