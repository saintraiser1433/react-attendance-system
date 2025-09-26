import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database contents...');
    
    // Check all tables
    const users = await prisma.user.findMany();
    const students = await prisma.student.findMany();
    const teachers = await prisma.teacher.findMany();
    const subjects = await prisma.subject.findMany();
    const courses = await prisma.course.findMany();
    const departments = await prisma.department.findMany();
    const academicYears = await prisma.academicYear.findMany();
    const semesters = await prisma.semester.findMany();
    const settings = await prisma.setting.findMany();
    
    console.log(`👤 Users: ${users.length}`);
    console.log(`🎓 Students: ${students.length}`);
    console.log(`👨‍🏫 Teachers: ${teachers.length}`);
    console.log(`📚 Subjects: ${subjects.length}`);
    console.log(`📖 Courses: ${courses.length}`);
    console.log(`🏢 Departments: ${departments.length}`);
    console.log(`📅 Academic Years: ${academicYears.length}`);
    console.log(`📆 Semesters: ${semesters.length}`);
    console.log(`⚙️ Settings: ${settings.length}`);
    
    if (users.length > 0) {
      console.log('\n👤 Users:');
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }
    
    if (academicYears.length > 0) {
      console.log('\n📅 Academic Years:');
      academicYears.forEach(ay => {
        console.log(`  - ${ay.name} (${ay.id}) - Active: ${ay.isActive}`);
      });
    }
    
    if (semesters.length > 0) {
      console.log('\n📆 Semesters:');
      semesters.forEach(sem => {
        console.log(`  - ${sem.name} (${sem.id}) - Active: ${sem.isActive}`);
      });
    }
    
    if (settings.length > 0) {
      console.log('\n⚙️ Settings:');
      settings.forEach(setting => {
        console.log(`  - Active Academic Year: ${setting.activeAcademicYearId}`);
        console.log(`  - Active Semester: ${setting.activeSemesterId}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

