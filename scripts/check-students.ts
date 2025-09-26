import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStudents() {
  try {
    console.log('🔍 Checking all students in database...');
    
    const students = await prisma.student.findMany({
      include: {
        user: true,
        academicYear: true,
        semester: true
      }
    });
    
    console.log(`📊 Total students: ${students.length}`);
    
    if (students.length === 0) {
      console.log('❌ No students found in database');
      return;
    }
    
    console.log('\n📋 All students:');
    students.forEach((student, index) => {
      console.log(`${index + 1}. ${student.user.name} (${student.studentId})`);
      console.log(`   - Academic Year: ${student.academicYear?.name || 'NULL'} (${student.academicYearId || 'NULL'})`);
      console.log(`   - Semester: ${student.semester?.name || 'NULL'} (${student.semesterId || 'NULL'})`);
      console.log(`   - Created: ${student.createdAt}`);
      console.log('');
    });
    
    // Check settings
    const settings = await prisma.setting.findFirst();
    console.log('\n⚙️ Current Settings:');
    console.log(`   - Active Academic Year: ${settings?.activeAcademicYearId || 'NULL'}`);
    console.log(`   - Active Semester: ${settings?.activeSemesterId || 'NULL'}`);
    
  } catch (error) {
    console.error('❌ Error checking students:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudents();

