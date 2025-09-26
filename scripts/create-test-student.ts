import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestStudent() {
  try {
    console.log('🎓 Creating test student...');
    
    // Get the active academic year and semester
    const settings = await prisma.setting.findFirst();
    
    if (!settings?.activeAcademicYearId || !settings?.activeSemesterId) {
      console.log('❌ No active academic year or semester found');
      return;
    }
    
    // Get a department and section
    const department = await prisma.department.findFirst();
    const section = await prisma.section.findFirst();
    
    if (!department || !section) {
      console.log('❌ No department or section found');
      return;
    }
    
    console.log(`📅 Using Academic Year: ${settings.activeAcademicYearId}`);
    console.log(`📅 Using Semester: ${settings.activeSemesterId}`);
    console.log(`🏢 Using Department: ${department.name}`);
    console.log(`📚 Using Section: ${section.name}`);
    
    // Create user first
    const user = await prisma.user.create({
      data: {
        name: "Test Student",
        email: null,
        passwordHash: null,
        role: "student" as const,
      }
    });
    
    console.log(`👤 Created user: ${user.name} (${user.id})`);
    
    // Create student with academic year and semester
    const student = await prisma.student.create({
      data: {
        userId: user.id,
        studentId: "TEST001",
        departmentId: department.id,
        sectionId: section.id,
        yearLevel: "1st Year",
        academicYearId: settings.activeAcademicYearId,
        semesterId: settings.activeSemesterId,
      },
      include: {
        user: true,
        academicYear: true,
        semester: true,
        department: true,
        section: true
      }
    });
    
    console.log(`✅ Created student: ${student.user.name} (${student.studentId})`);
    console.log(`   - Academic Year: ${student.academicYear?.name}`);
    console.log(`   - Semester: ${student.semester?.name}`);
    console.log(`   - Department: ${student.department?.name}`);
    console.log(`   - Section: ${student.section?.name}`);
    console.log(`   - Year Level: ${student.yearLevel}`);
    
  } catch (error) {
    console.error('❌ Error creating test student:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestStudent();

