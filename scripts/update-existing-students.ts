import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateExistingStudents() {
  try {
    console.log('🔄 Updating existing students with active academic year and semester...');
    
    // Get the current active academic year and semester
    const settings = await prisma.setting.findFirst();
    
    if (!settings?.activeAcademicYearId || !settings?.activeSemesterId) {
      console.log('❌ No active academic year or semester found in settings');
      console.log('Please set an active academic year and semester first');
      return;
    }
    
    console.log(`📅 Active Academic Year: ${settings.activeAcademicYearId}`);
    console.log(`📅 Active Semester: ${settings.activeSemesterId}`);
    
    // Find all students that don't have academic year and semester set
    const studentsToUpdate = await prisma.student.findMany({
      where: {
        OR: [
          { academicYearId: null },
          { semesterId: null }
        ]
      },
      include: {
        user: true
      }
    });
    
    console.log(`👥 Found ${studentsToUpdate.length} students to update`);
    
    if (studentsToUpdate.length === 0) {
      console.log('✅ All students already have academic year and semester set');
      return;
    }
    
    // Update all students with the active academic year and semester
    const updateResult = await prisma.student.updateMany({
      where: {
        OR: [
          { academicYearId: null },
          { semesterId: null }
        ]
      },
      data: {
        academicYearId: settings.activeAcademicYearId,
        semesterId: settings.activeSemesterId
      }
    });
    
    console.log(`✅ Updated ${updateResult.count} students successfully`);
    
    // Verify the update
    const updatedStudents = await prisma.student.findMany({
      where: {
        academicYearId: settings.activeAcademicYearId,
        semesterId: settings.activeSemesterId
      },
      include: {
        user: true,
        academicYear: true,
        semester: true
      }
    });
    
    console.log(`📊 Verification: ${updatedStudents.length} students now have academic year and semester set`);
    
    // Show some examples
    console.log('\n📋 Sample updated students:');
    updatedStudents.slice(0, 5).forEach(student => {
      console.log(`  - ${student.user.name} (${student.studentId}) - ${student.academicYear?.name} - ${student.semester?.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating students:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingStudents();

