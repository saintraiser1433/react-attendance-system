import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPasswordHash = await bcrypt.hash("demo123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@attendance.local" },
    update: {},
    create: {
      email: "admin@attendance.local",
      name: "System Administrator",
      role: "admin",
      passwordHash: adminPasswordHash,
    },
  });
  console.log("✅ Created admin user:", admin.email);

  // Create department
  const department = await prisma.department.upsert({
    where: { code: "CS" },
    update: {},
    create: {
      name: "Computer Science",
      code: "CS",
    },
  });
  console.log("✅ Created department:", department.name);

  // Create academic year
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
  console.log("✅ Created academic year:", academicYear.name);

  // Create semester
  const semester = await prisma.semester.upsert({
    where: { academicYearId_name: { academicYearId: academicYear.id, name: "Fall 2025" } },
    update: {},
    create: {
      name: "Fall 2025",
      academicYearId: academicYear.id,
      startDate: new Date("2025-09-01"),
      endDate: new Date("2025-12-31"),
      isActive: true,
    },
  });
  console.log("✅ Created semester:", semester.name);

  // Create course
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
  console.log("✅ Created course:", course.name);

  // Create teacher user
  const teacherPasswordHash = await bcrypt.hash("demo123", 10);
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

  // Create teacher record
  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      employeeId: "T001",
      departmentId: department.id,
    },
  });
  console.log("✅ Created teacher:", teacherUser.name);

  // Create subject
  const subject = await prisma.subject.upsert({
    where: { code: "CS101-01" },
    update: {},
    create: {
      code: "CS101-01",
      name: "Intro to CS - Section 01",
      courseId: course.id,
      teacherId: teacher.id,
    },
  });
  console.log("✅ Created subject:", subject.name);

  // Create student user
  const studentPasswordHash = await bcrypt.hash("demo123", 10);
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

  // Create student record
  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      studentId: "S001",
      departmentId: department.id,
    },
  });
  console.log("✅ Created student:", studentUser.name);

  // Create enrollment
  const enrollment = await prisma.enrollment.upsert({
    where: { 
      studentId_subjectId_academicYearId_semesterId: {
        studentId: student.id,
        subjectId: subject.id,
        academicYearId: academicYear.id,
        semesterId: semester.id,
      }
    },
    update: {},
    create: {
      studentId: student.id,
      subjectId: subject.id,
      academicYearId: academicYear.id,
      semesterId: semester.id,
    },
  });
  console.log("✅ Created enrollment");

  // Set global settings
  await prisma.setting.upsert({
    where: { id: "singleton" },
    update: {
      activeAcademicYearId: academicYear.id,
      activeSemesterId: semester.id,
      qrSecret: process.env.QR_SECRET || "change-me-please-32chars",
    },
    create: {
      id: "singleton",
      activeAcademicYearId: academicYear.id,
      activeSemesterId: semester.id,
      qrSecret: process.env.QR_SECRET || "change-me-please-32chars",
    },
  });
  console.log("✅ Updated global settings");

  console.log("\n🎉 Seeding completed!");
  console.log("\nTest accounts:");
  console.log("Admin: admin@attendance.local / demo123");
  console.log("Teacher: teacher@attendance.local / demo123");
  console.log("Student: student@attendance.local / demo123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
