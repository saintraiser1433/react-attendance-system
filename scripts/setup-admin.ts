import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function setupAdminSystem() {
  console.log("🚀 Setting up Admin System...");

  try {
    // 1. Create Admin User
    const adminPasswordHash = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.upsert({
      where: { email: "admin@attendance.local" },
      update: {
        passwordHash: adminPasswordHash,
        name: "System Administrator",
        role: "admin"
      },
      create: {
        email: "admin@attendance.local",
        name: "System Administrator",
        role: "admin",
        passwordHash: adminPasswordHash,
      },
    });
    console.log("✅ Admin user created:", admin.email);

    // 2. Create Default Department
    const department = await prisma.department.upsert({
      where: { code: "CS" },
      update: {},
      create: {
        name: "Computer Science",
        code: "CS",
      },
    });
    console.log("✅ Department created:", department.name);

    // 3. Create Academic Year
    const academicYear = await prisma.academicYear.upsert({
      where: { name: "2025/2026" },
      update: {},
      create: {
        name: "2025/2026",
        startDate: new Date("2025-09-01"),
        endDate: new Date("2026-08-31"),
        isActive: true,
      },
    });
    console.log("✅ Academic year created:", academicYear.name);

    // 4. Create Semester
    const semester = await prisma.semester.upsert({
      where: { 
        academicYearId_name: { 
          academicYearId: academicYear.id, 
          name: "Fall 2025" 
        } 
      },
      update: {},
      create: {
        name: "Fall 2025",
        academicYearId: academicYear.id,
        startDate: new Date("2025-09-01"),
        endDate: new Date("2025-12-31"),
        isActive: true,
      },
    });
    console.log("✅ Semester created:", semester.name);

    // 5. Create Course
    const course = await prisma.course.upsert({
      where: { code: "CS101" },
      update: {},
      create: {
        code: "CS101",
        name: "Introduction to Computer Science",
        description: "Basic computer science course",
        yearLevel: "1",
        departmentId: department.id,
      },
    });
    console.log("✅ Course created:", course.name);

    // 6. Create Sample Teacher
    const teacherPasswordHash = await bcrypt.hash("teacher123", 10);
    const teacherUser = await prisma.user.upsert({
      where: { email: "teacher@attendance.local" },
      update: {},
      create: {
        email: "teacher@attendance.local",
        name: "John Teacher",
        role: "teacher",
        passwordHash: teacherPasswordHash,
      },
    });

    const teacher = await prisma.teacher.upsert({
      where: { userId: teacherUser.id },
      update: {},
      create: {
        userId: teacherUser.id,
        employeeId: "T001",
        departmentId: department.id,
      },
    });
    console.log("✅ Teacher created:", teacherUser.name);

    // 7. Create Sample Student
    const studentPasswordHash = await bcrypt.hash("student123", 10);
    const studentUser = await prisma.user.upsert({
      where: { email: "student@attendance.local" },
      update: {},
      create: {
        email: "student@attendance.local",
        name: "Jane Student",
        role: "student",
        passwordHash: studentPasswordHash,
      },
    });

    // Create Sample Section
    const section = await prisma.section.upsert({
      where: { 
        code_departmentId: {
          code: "A",
          departmentId: department.id,
        }
      },
      update: {},
      create: {
        name: "Section A",
        code: "A",
        departmentId: department.id,
      },
    });
    console.log("✅ Section created:", section.name);

    const student = await prisma.student.upsert({
      where: { userId: studentUser.id },
      update: {},
      create: {
        userId: studentUser.id,
        studentId: "S001",
        departmentId: department.id,
        sectionId: section.id,
        yearLevel: "1st Year",
      },
    });
    console.log("✅ Student created:", studentUser.name);

    // 8. Create Sample Subject
    const subject = await prisma.subject.upsert({
      where: { code: "CS101-01" },
      update: {},
      create: {
        code: "CS101-01",
        name: "Introduction to Computer Science",
        description: "Basic concepts of computer science",
        credits: 3,
        courseId: course.id,
        teacherId: teacher.id,
      },
    });
    console.log("✅ Subject created:", subject.name);

    // 9. Create Enrollment
    const enrollment = await prisma.enrollment.upsert({
      where: {
        studentId_subjectId_academicYearId_semesterId: {
          studentId: student.id,
          subjectId: subject.id,
          academicYearId: academicYear.id,
          semesterId: semester.id,
        },
      },
      update: {},
      create: {
        studentId: student.id,
        subjectId: subject.id,
        academicYearId: academicYear.id,
        semesterId: semester.id,
      },
    });
    console.log("✅ Enrollment created");

    // 10. Update Global Settings
    await prisma.setting.upsert({
      where: { id: "singleton" },
      update: {
        activeAcademicYearId: academicYear.id,
        activeSemesterId: semester.id,
        qrSecret: "your-secret-key-here",
        rateLimitPerMinute: 60,
      },
      create: {
        id: "singleton",
        activeAcademicYearId: academicYear.id,
        activeSemesterId: semester.id,
        qrSecret: "your-secret-key-here",
        rateLimitPerMinute: 60,
      },
    });
    console.log("✅ Global settings updated");

    console.log("\n🎉 Admin System Setup Complete!");
    console.log("\n📋 Login Credentials:");
    console.log("┌─────────────────────────────────────────┐");
    console.log("│ Admin: admin@attendance.local / admin123│");
    console.log("│ Teacher: teacher@attendance.local / teacher123│");
    console.log("│ Student: student@attendance.local / student123│");
    console.log("└─────────────────────────────────────────┘");

  } catch (error) {
    console.error("❌ Error setting up admin system:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdminSystem();











