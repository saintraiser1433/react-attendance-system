import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';

// POST /api/admin/teachers/upload-image - Upload teacher profile image
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const teacherId = formData.get('teacherId') as string;

    if (!file || !teacherId) {
      return NextResponse.json({ error: "Missing file or teacher ID" }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 });
    }

    // Verify teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "teachers");
    
    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const filename = `teacher-${teacherId}-${timestamp}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Update teacher record with image URL
    const imageUrl = `/uploads/teachers/${filename}`;
    
    await prisma.teacher.update({
      where: { id: teacherId },
      data: { image: imageUrl }
    });

    return NextResponse.json({ 
      success: true,
      imageUrl: imageUrl,
      message: "Image uploaded successfully"
    });

  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}

