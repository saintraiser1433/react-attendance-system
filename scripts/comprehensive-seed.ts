import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Realistic names for teachers and students
const teacherNames = [
  "Dr. Alice Johnson", "Prof. Robert Smith", "Dr. Carol Davis", "James Wilson",
  "Dr. Linda Brown", "Michael Garcia", "Dr. Sarah Martinez", "David Anderson",
  "Dr. Jennifer Taylor", "Christopher Thompson", "Dr. Michelle White", "Daniel Harris"
];

const studentNames = [
  "Emma Thompson", "Liam Johnson", "Olivia Brown", "Noah Davis", "Ava Wilson",
  "Ethan Garcia", "Sophia Martinez", "Mason Anderson", "Isabella Taylor", "William Thomas",
  "Charlotte Jackson", "James White", "Amelia Harris", "Benjamin Martin", "Mia Thompson",
  "Lucas Clark", "Harper Lewis", "Henry Lee", "Evelyn Walker", "Alexander Hall",
  "Abigail Allen", "Michael Young", "Emily King", "Ethan Wright", "Madison Lopez",
  "Daniel Hill", "Elizabeth Scott", "Matthew Green", "Sofia Adams", "Joseph Baker",
  "Avery Gonzalez", "Samuel Nelson", "Ella Carter", "David Mitchell", "Scarlett Perez",
  "Carter Roberts", "Victoria Turner", "Wyatt Phillips", "Grace Campbell", "Owen Parker",
  "Aria Evans", "Luke Edwards", "Chloe Collins", "Grayson Stewart", "Camila Sanchez",
  "Isaac Morris", "Penelope Rogers", "Jaxon Reed", "Layla Cook", "Lincoln Bailey"
];

const departments = [
  { name: "Computer Science", code: "CS" },
  { name: "Mathematics", code: "MATH" },
  { name: "Engineering", code: "ENG" },
  { name: "Business Administration", code: "BUS" },
  { name: "Biology", code: "BIO" },
  { name: "Physics", code: "PHY" }
];

const subjects = [
  // Computer Science
  { code: "CS101", name: "Introduction to Programming", credits: 3, department: "CS" },
  { code: "CS102", name: "Data Structures", credits: 4, department: "CS" },
  { code: "CS201", name: "Algorithms", credits: 4, department: "CS" },
  { code: "CS301", name: "Database Systems", credits: 3, department: "CS" },
  
  // Mathematics
  { code: "MATH101", name: "Calculus I", credits: 4, department: "MATH" },
  { code: "MATH102", name: "Calculus II", credits: 4, department: "MATH" },
  { code: "MATH201", name: "Linear Algebra", credits: 3, department: "MATH" },
  { code: "MATH301", name: "Statistics", credits: 3, department: "MATH" },
  
  // Engineering
  { code: "ENG101", name: "Engineering Fundamentals", credits: 3, department: "ENG" },
  { code: "ENG201", name: "Mechanics", credits: 4, department: "ENG" },
  { code: "ENG301", name: "Thermodynamics", credits: 4, department: "ENG" },
  
  // Business
  { code: "BUS101", name: "Business Fundamentals", credits: 3, department: "BUS" },
  { code: "BUS201", name: "Marketing", credits: 3, department: "BUS" },
  
  // Biology
  { code: "BIO101", name: "General Biology", credits: 4, department: "BIO" },
  { code: "BIO201", name: "Genetics", credits: 3, department: "BIO" },
  
  // Physics
  { code: "PHY101", name: "Physics I", credits: 4, department: "PHY" },
  { code: "PHY201", name: "Physics II", credits: 4, department: "PHY" }
];

function getRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomAttendanceRate() {
  // Generate realistic attendance rates (70-98%)
  return Math.round((Math.random() * 28 + 70) * 10) / 10;
}

async function main() {
  console.log("🌱 Starting comprehensive database seeding...");

  // Clear existing data
  await prisma.attendance.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.course.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Cleared existing data");

  const passwordHash = await bcrypt.hash("demo123", 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: "admin@attendance.local",
      name: "System Administrator",
      passwordHash,
      role: Role.admin,
    },
  });
  console.log("✅ Created admin user");

  // Create academic year and semester
  const academicYear = await prisma.academicYear.create({
    data: {
      name: "2025/2026",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-08-31"),
      isActive: true,
    },
  });

  const semester = await prisma.semester.create({
    data: {
      name: "Fall 2025",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2025-12-31"),
      academicYearId: academicYear.id,
      isActive: true,
    },
  });

  console.log("✅ Created academic year and semester");

  // Create departments
  const createdDepartments = [];
  for (const dept of departments) {
    const department = await prisma.department.create({
      data: {
        name: dept.name,
        code: dept.code,
      },
    });
    createdDepartments.push(department);
  }
  console.log(`✅ Created ${createdDepartments.length} departments`);

  // Create courses for each department
  const createdCourses: any[] = [];
  for (const dept of createdDepartments) {
    const course = await prisma.course.create({
      data: {
        name: `${dept.name} Program`,
        code: `${dept.code}_PROG`,
        description: `${dept.name} undergraduate program`,
        yearLevel: "1",
        departmentId: dept.id,
      },
    });
    createdCourses.push(course);
  }
  console.log(`✅ Created ${createdCourses.length} courses`);

  // Create teachers
  const createdTeachers = [];
  for (let i = 0; i < teacherNames.length; i++) {
    const deptIndex = i % createdDepartments.length;
    const department = createdDepartments[deptIndex];
    
    const user = await prisma.user.create({
      data: {
        email: `teacher${i + 1}@attendance.local`,
        name: teacherNames[i],
        passwordHash,
        role: Role.teacher,
      },
    });

    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        employeeId: `T${String(i + 1).padStart(3, '0')}`,
        departmentId: department.id,
      },
    });

    createdTeachers.push(teacher);
  }
  console.log(`✅ Created ${createdTeachers.length} teachers`);

  // Create subjects and assign to teachers
  const createdSubjects = [];
  for (const subjectData of subjects) {
    const department = createdDepartments.find(d => d.code === subjectData.department);
    const course = createdCourses.find(c => c.departmentId === department?.id);
    const teachersInDept = createdTeachers.filter(t => t.departmentId === department?.id);
    const assignedTeacher = teachersInDept[Math.floor(Math.random() * teachersInDept.length)];

    if (course && assignedTeacher) {
      const subject = await prisma.subject.create({
        data: {
          code: subjectData.code,
          name: subjectData.name,
          courseId: course.id,
          teacherId: assignedTeacher.id,
        },
      });
      createdSubjects.push(subject);
    }
  }
  console.log(`✅ Created ${createdSubjects.length} subjects`);

  // Create students
  const createdStudents = [];
  for (let i = 0; i < studentNames.length; i++) {
    const deptIndex = i % createdDepartments.length;
    const department = createdDepartments[deptIndex];
    
    const user = await prisma.user.create({
      data: {
        email: `student${i + 1}@attendance.local`,
        name: studentNames[i],
        passwordHash,
        role: Role.student,
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        studentId: `S${String(i + 1).padStart(4, '0')}`,
        departmentId: department.id,
      },
    });

    createdStudents.push(student);
  }
  console.log(`✅ Created ${createdStudents.length} students`);

  // Create enrollments (students enrolled in subjects)
  let enrollmentCount = 0;
  for (const student of createdStudents) {
    // Each student enrolls in 3-6 subjects from their department
    const deptSubjects = createdSubjects.filter(s => {
      const course = createdCourses.find(c => c.id === s.courseId);
      return course?.departmentId === student.departmentId;
    });

    const numEnrollments = Math.floor(Math.random() * 4) + 3; // 3-6 subjects
    const selectedSubjects = deptSubjects
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(numEnrollments, deptSubjects.length));

    for (const subject of selectedSubjects) {
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          subjectId: subject.id,
          academicYearId: academicYear.id,
          semesterId: semester.id,
        },
      });
      enrollmentCount++;
    }
  }
  console.log(`✅ Created ${enrollmentCount} enrollments`);

  // Create schedules for subjects
  const timeSlots = [
    { start: "08:00", end: "09:30" },
    { start: "10:00", end: "11:30" },
    { start: "12:00", end: "13:30" },
    { start: "14:00", end: "15:30" },
    { start: "16:00", end: "17:30" }
  ];

  const daysOfWeek = [1, 2, 3, 4, 5]; // Monday to Friday (1-5)
  let scheduleCount = 0;

  for (const subject of createdSubjects) {
    // Each subject has 2-3 classes per week
    const numClasses = Math.floor(Math.random() * 2) + 2;
    const selectedDays = daysOfWeek
      .sort(() => 0.5 - Math.random())
      .slice(0, numClasses);

    for (const dayOfWeek of selectedDays) {
      const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
      
      // Create DateTime objects for start and end times
      const baseDate = new Date('2025-01-01'); // Use a base date
      const [startHour, startMinute] = timeSlot.start.split(':').map(Number);
      const [endHour, endMinute] = timeSlot.end.split(':').map(Number);
      
      const startTime = new Date(baseDate);
      startTime.setHours(startHour, startMinute, 0);
      
      const endTime = new Date(baseDate);
      endTime.setHours(endHour, endMinute, 0);
      
      await prisma.schedule.create({
        data: {
          subjectId: subject.id,
          teacherId: subject.teacherId!,
          dayOfWeek: dayOfWeek,
          startTime: startTime,
          endTime: endTime,
          room: `Room ${Math.floor(Math.random() * 500) + 100}`,
          academicYearId: academicYear.id,
          semesterId: semester.id,
        },
      });
      scheduleCount++;
    }
  }
  console.log(`✅ Created ${scheduleCount} schedules`);

  // Create attendance records (last 30 days)
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const endDate = new Date();

  let attendanceCount = 0;
  const enrollments = await prisma.enrollment.findMany({
    include: {
      subject: {
        include: {
          schedules: true
        }
      },
      student: true
    }
  });

  for (const enrollment of enrollments) {
    const schedules = enrollment.subject.schedules;
    
    for (const schedule of schedules) {
      // Generate attendance for each class day in the last 30 days
      const classDate = new Date(startDate);
      
      while (classDate <= endDate) {
        const dayOfWeek = classDate.getDay(); // 0=Sunday, 1=Monday, etc.
        
        if (dayOfWeek === schedule.dayOfWeek) {
          // 85% chance of attendance (realistic rate)
          const isPresent = Math.random() < 0.85;
          const status = isPresent ? "PRESENT" : "ABSENT";
          
          await prisma.attendance.create({
            data: {
              enrollmentId: enrollment.id,
              scheduleId: schedule.id,
              date: new Date(classDate),
              status,
              scannedAt: isPresent ? new Date(classDate.getTime() + Math.random() * 3600000) : null, // Random time within an hour
            },
          });
          attendanceCount++;
        }
        
        classDate.setDate(classDate.getDate() + 1);
      }
    }
  }
  console.log(`✅ Created ${attendanceCount} attendance records`);

  // Update global settings
  await prisma.setting.upsert({
    where: { id: "singleton" },
    update: {
      activeAcademicYearId: academicYear.id,
      activeSemesterId: semester.id,
    },
    create: {
      id: "singleton",
      activeAcademicYearId: academicYear.id,
      activeSemesterId: semester.id,
    },
  });

  console.log("✅ Updated global settings");

  // Print summary statistics
  const stats = {
    totalUsers: await prisma.user.count(),
    totalTeachers: await prisma.teacher.count(),
    totalStudents: await prisma.student.count(),
    totalDepartments: await prisma.department.count(),
    totalSubjects: await prisma.subject.count(),
    totalEnrollments: await prisma.enrollment.count(),
    totalSchedules: await prisma.schedule.count(),
    totalAttendance: await prisma.attendance.count(),
    // Calculate attendance rate manually
    presentRecords: await prisma.attendance.count({ where: { status: "PRESENT" } })
  };

  const totalAttendanceRecords = await prisma.attendance.count();
  const presentRecords = await prisma.attendance.count({ where: { status: "PRESENT" } });
  const attendanceRate = totalAttendanceRecords > 0 ? (presentRecords / totalAttendanceRecords * 100).toFixed(1) : 0;

  console.log("\n🎉 Comprehensive seeding completed!");
  console.log("\n📊 Summary Statistics:");
  console.log(`Total Users: ${stats.totalUsers}`);
  console.log(`Teachers: ${stats.totalTeachers}`);
  console.log(`Students: ${stats.totalStudents}`);
  console.log(`Departments: ${stats.totalDepartments}`);
  console.log(`Subjects: ${stats.totalSubjects}`);
  console.log(`Enrollments: ${stats.totalEnrollments}`);
  console.log(`Schedules: ${stats.totalSchedules}`);
  console.log(`Attendance Records: ${stats.totalAttendance}`);
  console.log(`Overall Attendance Rate: ${attendanceRate}%`);

  console.log("\n🔐 Login Credentials:");
  console.log("Admin: admin@attendance.local / demo123");
  console.log("Teachers: teacher1@attendance.local to teacher12@attendance.local / demo123");
  console.log("Students: student1@attendance.local to student50@attendance.local / demo123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
