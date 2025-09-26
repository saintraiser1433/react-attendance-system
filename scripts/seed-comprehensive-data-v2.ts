import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define data arrays
const academicYears = [
  { name: "2025/2026", startDate: new Date("2025-06-01"), endDate: new Date("2026-05-31") },
  { name: "2026/2027", startDate: new Date("2026-06-01"), endDate: new Date("2027-05-31") },
  { name: "2027/2028", startDate: new Date("2027-06-01"), endDate: new Date("2028-05-31") }
];

const semesters = [
  { name: "First Semester", order: 1 },
  { name: "Second Semester", order: 2 }
];

const departments = [
  { name: "College of Information Technology", code: "CCIT" },
  { name: "College of Engineering", code: "COE" },
  { name: "College of Business Administration", code: "CBA" },
  { name: "College of Education", code: "COE" },
  { name: "College of Arts and Sciences", code: "CAS" }
];

const sections = [
  { name: "Section A", code: "A" },
  { name: "Section B", code: "B" },
  { name: "Section C", code: "C" },
  { name: "Section D", code: "D" },
  { name: "Section E", code: "E" }
];

const courses = [
  { code: "BSIT", name: "Bachelor of Science in Information Technology", yearLevel: "1st Year" },
  { code: "BSCS", name: "Bachelor of Science in Computer Science", yearLevel: "1st Year" },
  { code: "BSIS", name: "Bachelor of Science in Information Systems", yearLevel: "1st Year" },
  { code: "BSCE", name: "Bachelor of Science in Civil Engineering", yearLevel: "1st Year" },
  { code: "BSEE", name: "Bachelor of Science in Electrical Engineering", yearLevel: "1st Year" },
  { code: "BSME", name: "Bachelor of Science in Mechanical Engineering", yearLevel: "1st Year" },
  { code: "BSBA", name: "Bachelor of Science in Business Administration", yearLevel: "1st Year" },
  { code: "BSEd", name: "Bachelor of Science in Education", yearLevel: "1st Year" },
  { code: "BSA", name: "Bachelor of Science in Accountancy", yearLevel: "1st Year" },
  { code: "BSM", name: "Bachelor of Science in Mathematics", yearLevel: "1st Year" }
];

const timeSlots = [
  { startTime: "07:00", endTime: "08:00" },
  { startTime: "08:00", endTime: "09:00" },
  { startTime: "09:00", endTime: "10:00" },
  { startTime: "10:00", endTime: "11:00" },
  { startTime: "11:00", endTime: "12:00" },
  { startTime: "13:00", endTime: "14:00" },
  { startTime: "14:00", endTime: "15:00" },
  { startTime: "15:00", endTime: "16:00" },
  { startTime: "16:00", endTime: "17:00" },
  { startTime: "17:00", endTime: "18:00" },
  { startTime: "18:00", endTime: "19:00" },
  { startTime: "19:00", endTime: "20:00" }
];

const days = [
  { name: "Monday", value: 1 },
  { name: "Tuesday", value: 2 },
  { name: "Wednesday", value: 3 },
  { name: "Thursday", value: 4 },
  { name: "Friday", value: 5 },
  { name: "Saturday", value: 6 }
];

const rooms = [
  "Room 101", "Room 102", "Room 103", "Room 104", "Room 105",
  "Lab A", "Lab B", "Lab C", "Lab D", "Lab E",
  "Computer Lab 1", "Computer Lab 2", "Engineering Lab", "Math Lab", "Science Lab"
];

const firstNames = [
  "John", "Jane", "Michael", "Sarah", "David", "Lisa", "Robert", "Emily", "James", "Jessica",
  "William", "Ashley", "Richard", "Amanda", "Joseph", "Jennifer", "Thomas", "Michelle", "Christopher", "Kimberly",
  "Daniel", "Donna", "Paul", "Carol", "Mark", "Sandra", "Donald", "Ruth", "Steven", "Sharon",
  "Andrew", "Nancy", "Joshua", "Deborah", "Kenneth", "Dorothy", "Kevin", "Lisa", "Brian", "Helen",
  "George", "Shirley", "Edward", "Cynthia", "Ronald", "Marie", "Timothy", "Janet", "Jason", "Catherine"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"
];

const subjects = [
  { code: "CS101", name: "Introduction to Computer Science", credits: 3 },
  { code: "CS102", name: "Programming Fundamentals", credits: 3 },
  { code: "CS201", name: "Data Structures and Algorithms", credits: 3 },
  { code: "CS202", name: "Database Management Systems", credits: 3 },
  { code: "CS301", name: "Software Engineering", credits: 3 },
  { code: "CS302", name: "Computer Networks", credits: 3 },
  { code: "CS401", name: "Web Development", credits: 3 },
  { code: "CS402", name: "Mobile Application Development", credits: 3 },
  { code: "MATH101", name: "College Algebra", credits: 3 },
  { code: "MATH102", name: "Trigonometry", credits: 3 },
  { code: "MATH201", name: "Calculus I", credits: 3 },
  { code: "MATH202", name: "Calculus II", credits: 3 },
  { code: "ENG101", name: "English Composition", credits: 3 },
  { code: "ENG102", name: "Technical Writing", credits: 3 },
  { code: "PHYS101", name: "General Physics I", credits: 3 },
  { code: "PHYS102", name: "General Physics II", credits: 3 },
  { code: "CHEM101", name: "General Chemistry I", credits: 3 },
  { code: "CHEM102", name: "General Chemistry II", credits: 3 },
  { code: "BUS101", name: "Introduction to Business", credits: 3 },
  { code: "BUS201", name: "Principles of Management", credits: 3 }
];

const teachers = [
  { employeeId: "T001", name: "Dr. Maria Santos", email: "maria.santos@git.edu" },
  { employeeId: "T002", name: "Prof. Juan Dela Cruz", email: "juan.delacruz@git.edu" },
  { employeeId: "T003", name: "Dr. Ana Rodriguez", email: "ana.rodriguez@git.edu" },
  { employeeId: "T004", name: "Prof. Carlos Mendoza", email: "carlos.mendoza@git.edu" },
  { employeeId: "T005", name: "Dr. Sofia Garcia", email: "sofia.garcia@git.edu" },
  { employeeId: "T006", name: "Prof. Miguel Torres", email: "miguel.torres@git.edu" },
  { employeeId: "T007", name: "Dr. Elena Ramos", email: "elena.ramos@git.edu" },
  { employeeId: "T008", name: "Prof. Roberto Silva", email: "roberto.silva@git.edu" },
  { employeeId: "T009", name: "Dr. Carmen Lopez", email: "carmen.lopez@git.edu" },
  { employeeId: "T010", name: "Prof. Fernando Cruz", email: "fernando.cruz@git.edu" }
];

async function main() {
  console.log("🌱 Starting comprehensive data seeding...");

  try {
    // 1. Create Academic Years
    console.log("📅 Creating academic years...");
    const academicYearRecords = [];
    for (const year of academicYears) {
      const academicYear = await prisma.academicYear.upsert({
        where: { name: year.name },
        update: {},
        create: {
          name: year.name,
          startDate: year.startDate,
          endDate: year.endDate,
          isActive: year.name === "2025/2026" // Set 2025/2026 as active
        }
      });
      academicYearRecords.push(academicYear);
      console.log(`✅ Created academic year: ${year.name}`);
    }

    // 2. Create Semesters for each Academic Year
    console.log("📚 Creating semesters...");
    const semesterRecords = [];
    for (const academicYear of academicYearRecords) {
      for (const semester of semesters) {
        const semesterRecord = await prisma.semester.upsert({
          where: { 
            academicYearId_name: {
              academicYearId: academicYear.id,
              name: semester.name
            }
          },
          update: {},
          create: {
            name: semester.name,
            academicYearId: academicYear.id,
            isActive: academicYear.name === "2025/2026" && semester.name === "First Semester"
          }
        });
        semesterRecords.push(semesterRecord);
        console.log(`✅ Created semester: ${semester.name} for ${academicYear.name}`);
      }
    }

    // 3. Create Departments
    console.log("🏢 Creating departments...");
    const departmentRecords = [];
    for (const dept of departments) {
      const department = await prisma.department.upsert({
        where: { code: dept.code },
        update: {},
        create: {
          name: dept.name,
          code: dept.code
        }
      });
      departmentRecords.push(department);
      console.log(`✅ Created department: ${dept.name}`);
    }

    // 4. Create Sections
    console.log("📋 Creating sections...");
    const sectionRecords = [];
    for (const section of sections) {
      const sectionRecord = await prisma.section.upsert({
        where: { 
          code_departmentId: {
            code: section.code,
            departmentId: departmentRecords[0].id // Link to first department
          }
        },
        update: {},
        create: {
          name: section.name,
          code: section.code,
          departmentId: departmentRecords[0].id
        }
      });
      sectionRecords.push(sectionRecord);
      console.log(`✅ Created section: ${section.name}`);
    }

    // 5. Create Courses
    console.log("🎓 Creating courses...");
    const courseRecords = [];
    for (const course of courses) {
      const courseRecord = await prisma.course.upsert({
        where: { code: course.code },
        update: {},
        create: {
          code: course.code,
          name: course.name,
          yearLevel: course.yearLevel,
          departmentId: departmentRecords[0].id // Link to first department
        }
      });
      courseRecords.push(courseRecord);
      console.log(`✅ Created course: ${course.name}`);
    }

    // 6. Create Teachers
    console.log("👨‍🏫 Creating teachers...");
    const teacherRecords = [];
    for (const teacher of teachers) {
      // Create user first
      const user = await prisma.user.upsert({
        where: { email: teacher.email },
        update: {},
        create: {
          name: teacher.name,
          email: teacher.email,
          passwordHash: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
          role: "teacher"
        }
      });

      const teacherRecord = await prisma.teacher.upsert({
        where: { employeeId: teacher.employeeId },
        update: {},
        create: {
          userId: user.id,
          employeeId: teacher.employeeId,
          departmentId: departmentRecords[0].id // Link to first department
        }
      });
      teacherRecords.push(teacherRecord);
      console.log(`✅ Created teacher: ${teacher.name}`);
    }

    // 7. Create Subjects
    console.log("📖 Creating subjects...");
    const subjectRecords = [];
    for (const subject of subjects) {
      const subjectRecord = await prisma.subject.upsert({
        where: { code: subject.code },
        update: {},
        create: {
          code: subject.code,
          name: subject.name,
          description: `Description for ${subject.name}`,
          credits: subject.credits,
          courseId: courseRecords[Math.floor(Math.random() * courseRecords.length)].id,
          teacherId: teacherRecords[Math.floor(Math.random() * teacherRecords.length)].id
        }
      });
      subjectRecords.push(subjectRecord);
      console.log(`✅ Created subject: ${subject.name}`);
    }

    // 8. Create Students (100 per semester)
    console.log("👨‍🎓 Creating students...");
    const studentRecords = [];
    let studentCounter = 1;

    for (const semester of semesterRecords) {
      console.log(`📝 Creating 100 students for ${semester.name}...`);
      
      for (let i = 0; i < 100; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const studentId = String(10000 + studentCounter).padStart(5, '0');
        
        // Create user first
        const user = await prisma.user.create({
          data: {
            name: `${firstName} ${lastName}`,
            email: null,
            passwordHash: null,
            role: "student"
          }
        });

        const student = await prisma.student.create({
          data: {
            userId: user.id,
            studentId: studentId,
            departmentId: departmentRecords[Math.floor(Math.random() * departmentRecords.length)].id,
            sectionId: sectionRecords[Math.floor(Math.random() * sectionRecords.length)].id,
            yearLevel: String(Math.floor(Math.random() * 4) + 1), // 1-4 years
            academicYearId: semester.academicYearId,
            semesterId: semester.id
          }
        });
        
        studentRecords.push(student);
        studentCounter++;
      }
      console.log(`✅ Created 100 students for ${semester.name}`);
    }

    // 9. Create Schedules
    console.log("📅 Creating schedules...");
    const scheduleRecords = [];
    
    for (const semester of semesterRecords) {
      console.log(`📅 Creating schedules for ${semester.name}...`);
      
      // Create 20 schedules per semester
      for (let i = 0; i < 20; i++) {
        const subject = subjectRecords[Math.floor(Math.random() * subjectRecords.length)];
        const teacher = teacherRecords[Math.floor(Math.random() * teacherRecords.length)];
        const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        const day = days[Math.floor(Math.random() * days.length)];
        const room = rooms[Math.floor(Math.random() * rooms.length)];

        const schedule = await prisma.schedule.create({
          data: {
            subjectId: subject.id,
            teacherId: teacher.id,
            academicYearId: semester.academicYearId,
            semesterId: semester.id,
            dayOfWeek: day.value,
            startTime: new Date(`1970-01-01T${timeSlot.startTime}:00.000Z`),
            endTime: new Date(`1970-01-01T${timeSlot.endTime}:00.000Z`),
            room: room
          }
        });
        
        scheduleRecords.push(schedule);
      }
      console.log(`✅ Created 20 schedules for ${semester.name}`);
    }

    // 10. Create Enrollments
    console.log("📝 Creating enrollments...");
    const enrollmentRecords = [];
    
    for (const semester of semesterRecords) {
      console.log(`📝 Creating enrollments for ${semester.name}...`);
      
      // Get students for this semester
      const semesterStudents = studentRecords.filter(s => s.semesterId === semester.id);
      
      // Get schedules for this semester
      const semesterSchedules = scheduleRecords.filter(s => s.semesterId === semester.id);
      
      for (const student of semesterStudents) {
        // Enroll each student in 3-5 random subjects
        const numSubjects = Math.floor(Math.random() * 3) + 3; // 3-5 subjects
        const selectedSchedules = semesterSchedules
          .sort(() => 0.5 - Math.random())
          .slice(0, numSubjects);
        
        for (const schedule of selectedSchedules) {
          const enrollment = await prisma.enrollment.upsert({
            where: {
              studentId_subjectId_academicYearId_semesterId: {
                studentId: student.id,
                subjectId: schedule.subjectId,
                academicYearId: semester.academicYearId,
                semesterId: semester.id
              }
            },
            update: {},
            create: {
              studentId: student.id,
              subjectId: schedule.subjectId,
              academicYearId: semester.academicYearId,
              semesterId: semester.id
            }
          });
          
          enrollmentRecords.push(enrollment);
        }
      }
      console.log(`✅ Created enrollments for ${semester.name}`);
    }

    // 11. Create Weekly Attendance Records
    console.log("📊 Creating weekly attendance records...");
    
    for (const semester of semesterRecords) {
      console.log(`📊 Creating attendance records for ${semester.name}...`);
      
      // Get enrollments for this semester
      const semesterEnrollments = enrollmentRecords.filter(e => e.semesterId === semester.id);
      
      // Get schedules for this semester
      const semesterSchedules = scheduleRecords.filter(s => s.semesterId === semester.id);
      
      // Create attendance for 16 weeks (typical semester length)
      for (let week = 1; week <= 16; week++) {
        for (const enrollment of semesterEnrollments) {
          // Find the corresponding schedule
          const schedule = semesterSchedules.find(s => s.subjectId === enrollment.subjectId);
          if (!schedule) continue;
          
          // Calculate the date for this week and day
          const semesterStart = new Date("2025-06-01"); // Start of academic year
          const weekStart = new Date(semesterStart);
          weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
          
          // Find the specific day of the week
          const targetDate = new Date(weekStart);
          const dayDiff = schedule.dayOfWeek - weekStart.getDay();
          targetDate.setDate(weekStart.getDate() + dayDiff);
          
          // Generate realistic attendance (80-95% attendance rate)
          const attendanceRate = Math.random();
          const status = attendanceRate > 0.15 ? "PRESENT" : "ABSENT"; // 85% attendance rate
          
          const attendance = await prisma.attendance.upsert({
            where: {
              enrollmentId_date: {
                enrollmentId: enrollment.id,
                date: targetDate
              }
            },
            update: {},
            create: {
              enrollmentId: enrollment.id,
              date: targetDate,
              status: status as "PRESENT" | "ABSENT",
              createdAt: new Date()
            }
          });
        }
      }
      console.log(`✅ Created attendance records for ${semester.name}`);
    }

    // 12. Set Active Academic Year and Semester
    console.log("⚙️ Setting active academic year and semester...");
    const activeAcademicYear = academicYearRecords.find(ay => ay.name === "2025/2026");
    const activeSemester = semesterRecords.find(s => 
      s.academicYearId === activeAcademicYear?.id && s.name === "First Semester"
    );

    await prisma.setting.upsert({
      where: { id: "singleton" },
      update: {
        activeAcademicYearId: activeAcademicYear?.id,
        activeSemesterId: activeSemester?.id
      },
      create: {
        id: "singleton",
        activeAcademicYearId: activeAcademicYear?.id,
        activeSemesterId: activeSemester?.id
      }
    });

    console.log("✅ Set active academic year and semester");

    // Summary
    console.log("\n🎉 Seeding completed successfully!");
    console.log("📊 Summary:");
    console.log(`   📅 Academic Years: ${academicYearRecords.length}`);
    console.log(`   📚 Semesters: ${semesterRecords.length}`);
    console.log(`   🏢 Departments: ${departmentRecords.length}`);
    console.log(`   📋 Sections: ${sectionRecords.length}`);
    console.log(`   🎓 Courses: ${courseRecords.length}`);
    console.log(`   👨‍🏫 Teachers: ${teacherRecords.length}`);
    console.log(`   📖 Subjects: ${subjectRecords.length}`);
    console.log(`   👨‍🎓 Students: ${studentRecords.length}`);
    console.log(`   📅 Schedules: ${scheduleRecords.length}`);
    console.log(`   📝 Enrollments: ${enrollmentRecords.length}`);
    console.log(`   📊 Attendance Records: Created for 16 weeks per semester`);

  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
