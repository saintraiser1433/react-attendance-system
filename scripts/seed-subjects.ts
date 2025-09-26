import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const subjects = [
  // Computer Science & IT
  { code: 'CS101', name: 'Introduction to Computer Science', description: 'Fundamental concepts of computer science', credits: 3 },
  { code: 'CS102', name: 'Programming Fundamentals', description: 'Basic programming concepts and syntax', credits: 3 },
  { code: 'CS201', name: 'Data Structures and Algorithms', description: 'Study of fundamental data structures and algorithms', credits: 4 },
  { code: 'CS202', name: 'Object-Oriented Programming', description: 'OOP principles and design patterns', credits: 3 },
  { code: 'CS301', name: 'Database Systems', description: 'Database design and management', credits: 3 },
  { code: 'CS302', name: 'Software Engineering', description: 'Software development methodologies', credits: 3 },
  { code: 'CS401', name: 'Web Development', description: 'Frontend and backend web technologies', credits: 4 },
  { code: 'CS402', name: 'Mobile Application Development', description: 'Mobile app development frameworks', credits: 4 },
  { code: 'CS501', name: 'Artificial Intelligence', description: 'AI concepts and machine learning', credits: 4 },
  { code: 'CS502', name: 'Computer Networks', description: 'Network protocols and security', credits: 3 },
  { code: 'CS601', name: 'Cybersecurity', description: 'Information security and ethical hacking', credits: 4 },
  { code: 'CS602', name: 'Cloud Computing', description: 'Cloud platforms and services', credits: 3 },

  // Mathematics
  { code: 'MATH101', name: 'College Algebra', description: 'Fundamental algebraic concepts', credits: 3 },
  { code: 'MATH102', name: 'Trigonometry', description: 'Trigonometric functions and identities', credits: 3 },
  { code: 'MATH201', name: 'Calculus I', description: 'Differential calculus', credits: 4 },
  { code: 'MATH202', name: 'Calculus II', description: 'Integral calculus', credits: 4 },
  { code: 'MATH301', name: 'Linear Algebra', description: 'Vector spaces and linear transformations', credits: 3 },
  { code: 'MATH302', name: 'Discrete Mathematics', description: 'Mathematical structures for computer science', credits: 3 },
  { code: 'MATH401', name: 'Statistics', description: 'Statistical analysis and probability', credits: 3 },
  { code: 'MATH402', name: 'Numerical Analysis', description: 'Numerical methods and algorithms', credits: 3 },

  // Business & Management
  { code: 'BUS101', name: 'Introduction to Business', description: 'Fundamental business concepts', credits: 3 },
  { code: 'BUS201', name: 'Principles of Management', description: 'Management theories and practices', credits: 3 },
  { code: 'BUS202', name: 'Marketing Principles', description: 'Marketing strategies and consumer behavior', credits: 3 },
  { code: 'BUS301', name: 'Financial Management', description: 'Corporate finance and investment', credits: 3 },
  { code: 'BUS302', name: 'Human Resource Management', description: 'HR policies and practices', credits: 3 },
  { code: 'BUS401', name: 'Strategic Management', description: 'Business strategy formulation', credits: 3 },
  { code: 'BUS402', name: 'Operations Management', description: 'Production and operations', credits: 3 },
  { code: 'BUS501', name: 'International Business', description: 'Global business environment', credits: 3 },

  // Engineering
  { code: 'ENGM101', name: 'Engineering Mathematics', description: 'Mathematical foundations for engineering', credits: 4 },
  { code: 'ENG201', name: 'Engineering Mechanics', description: 'Statics and dynamics', credits: 3 },
  { code: 'ENG202', name: 'Materials Science', description: 'Properties and behavior of materials', credits: 3 },
  { code: 'ENG301', name: 'Thermodynamics', description: 'Heat and energy transfer', credits: 3 },
  { code: 'ENG302', name: 'Fluid Mechanics', description: 'Fluid behavior and applications', credits: 3 },
  { code: 'ENG401', name: 'Control Systems', description: 'System dynamics and control', credits: 3 },
  { code: 'ENG402', name: 'Engineering Design', description: 'Design principles and methodologies', credits: 4 },

  // Liberal Arts & Humanities
  { code: 'ENG101', name: 'English Composition', description: 'Academic writing and communication', credits: 3 },
  { code: 'ENG102', name: 'Literature Survey', description: 'Introduction to literary analysis', credits: 3 },
  { code: 'HIST101', name: 'World History', description: 'Survey of world civilizations', credits: 3 },
  { code: 'HIST201', name: 'Modern History', description: 'History from 1500 to present', credits: 3 },
  { code: 'PHIL101', name: 'Introduction to Philosophy', description: 'Fundamental philosophical concepts', credits: 3 },
  { code: 'PHIL201', name: 'Ethics', description: 'Moral philosophy and ethical reasoning', credits: 3 },
  { code: 'PSYCH101', name: 'General Psychology', description: 'Introduction to psychological principles', credits: 3 },
  { code: 'SOC101', name: 'Introduction to Sociology', description: 'Social behavior and institutions', credits: 3 },

  // Natural Sciences
  { code: 'PHYS101', name: 'General Physics I', description: 'Mechanics and thermodynamics', credits: 4 },
  { code: 'PHYS102', name: 'General Physics II', description: 'Electricity and magnetism', credits: 4 },
  { code: 'CHEM101', name: 'General Chemistry I', description: 'Atomic structure and bonding', credits: 4 },
  { code: 'CHEM102', name: 'General Chemistry II', description: 'Chemical reactions and kinetics', credits: 4 },
  { code: 'BIO101', name: 'General Biology I', description: 'Cell biology and genetics', credits: 4 },
  { code: 'BIO102', name: 'General Biology II', description: 'Evolution and ecology', credits: 4 },

  // Health Sciences
  { code: 'NURS101', name: 'Fundamentals of Nursing', description: 'Basic nursing principles', credits: 4 },
  { code: 'NURS201', name: 'Medical-Surgical Nursing', description: 'Adult health nursing', credits: 4 },
  { code: 'NURS301', name: 'Pediatric Nursing', description: 'Child health nursing', credits: 3 },
  { code: 'NURS302', name: 'Mental Health Nursing', description: 'Psychiatric nursing care', credits: 3 },
  { code: 'PHARM101', name: 'Pharmacology', description: 'Drug actions and interactions', credits: 3 },
  { code: 'ANAT101', name: 'Human Anatomy', description: 'Structure of the human body', credits: 4 },
  { code: 'PHYS101A', name: 'Human Physiology', description: 'Function of body systems', credits: 4 },

  // Education
  { code: 'EDUC101', name: 'Foundations of Education', description: 'Educational theories and practices', credits: 3 },
  { code: 'EDUC201', name: 'Educational Psychology', description: 'Learning and development', credits: 3 },
  { code: 'EDUC301', name: 'Curriculum Development', description: 'Design and implementation of curricula', credits: 3 },
  { code: 'EDUC302', name: 'Classroom Management', description: 'Effective classroom strategies', credits: 3 },
  { code: 'EDUC401', name: 'Assessment and Evaluation', description: 'Educational measurement', credits: 3 },
  { code: 'EDUC402', name: 'Special Education', description: 'Teaching students with special needs', credits: 3 },

  // Arts & Design
  { code: 'ART101', name: 'Drawing Fundamentals', description: 'Basic drawing techniques', credits: 3 },
  { code: 'ART201', name: 'Color Theory', description: 'Principles of color and composition', credits: 3 },
  { code: 'ART301', name: 'Digital Art', description: 'Computer-based art creation', credits: 3 },
  { code: 'DES101', name: 'Graphic Design', description: 'Visual communication design', credits: 3 },
  { code: 'DES201', name: 'Web Design', description: 'User interface and experience design', credits: 3 },
  { code: 'DES301', name: 'Product Design', description: 'Industrial and product design', credits: 4 },

  // Languages
  { code: 'SPAN101', name: 'Elementary Spanish I', description: 'Basic Spanish language skills', credits: 3 },
  { code: 'SPAN102', name: 'Elementary Spanish II', description: 'Intermediate Spanish language skills', credits: 3 },
  { code: 'FREN101', name: 'Elementary French I', description: 'Basic French language skills', credits: 3 },
  { code: 'FREN102', name: 'Elementary French II', description: 'Intermediate French language skills', credits: 3 },
  { code: 'GERM101', name: 'Elementary German I', description: 'Basic German language skills', credits: 3 },
  { code: 'GERM102', name: 'Elementary German II', description: 'Intermediate German language skills', credits: 3 },

  // Communication
  { code: 'COMM101', name: 'Public Speaking', description: 'Oral communication skills', credits: 3 },
  { code: 'COMM201', name: 'Interpersonal Communication', description: 'Communication in relationships', credits: 3 },
  { code: 'COMM301', name: 'Mass Communication', description: 'Media and society', credits: 3 },
  { code: 'JOUR101', name: 'Journalism Fundamentals', description: 'News writing and reporting', credits: 3 },
  { code: 'JOUR201', name: 'Digital Journalism', description: 'Online media and reporting', credits: 3 },

  // Economics
  { code: 'ECON101', name: 'Principles of Microeconomics', description: 'Individual economic behavior', credits: 3 },
  { code: 'ECON102', name: 'Principles of Macroeconomics', description: 'National economic systems', credits: 3 },
  { code: 'ECON201', name: 'International Economics', description: 'Global economic relations', credits: 3 },
  { code: 'ECON301', name: 'Development Economics', description: 'Economic development theories', credits: 3 },

  // Political Science
  { code: 'POL101', name: 'Introduction to Political Science', description: 'Political systems and theories', credits: 3 },
  { code: 'POL201', name: 'Comparative Politics', description: 'Political systems comparison', credits: 3 },
  { code: 'POL301', name: 'International Relations', description: 'Global political interactions', credits: 3 },
  { code: 'POL401', name: 'Public Policy', description: 'Policy analysis and implementation', credits: 3 },

  // Environmental Studies
  { code: 'ENV101', name: 'Environmental Science', description: 'Environmental systems and issues', credits: 3 },
  { code: 'ENV201', name: 'Climate Change', description: 'Climate science and impacts', credits: 3 },
  { code: 'ENV301', name: 'Sustainable Development', description: 'Environmental sustainability', credits: 3 },
  { code: 'ENV401', name: 'Environmental Policy', description: 'Environmental regulations and policies', credits: 3 }
];

async function seedSubjects() {
  try {
    console.log('🌱 Starting to seed subjects...');

    // Clear existing subjects first
    await prisma.subject.deleteMany({});
    console.log('🗑️ Cleared existing subjects');

    // Get or create a default department first
    let defaultDepartment = await prisma.department.findFirst({
      where: { code: 'DEFAULT' }
    });

    if (!defaultDepartment) {
      defaultDepartment = await prisma.department.create({
        data: {
          name: 'Default Department',
          code: 'DEFAULT'
        }
      });
    }

    // Get or create a default course for unassigned subjects
    let defaultCourse = await prisma.course.findFirst({
      where: { code: 'DEFAULT' }
    });

    if (!defaultCourse) {
      defaultCourse = await prisma.course.create({
        data: {
          name: 'Default Course',
          code: 'DEFAULT',
          description: 'Default course for subjects',
          yearLevel: '1',
          departmentId: defaultDepartment.id
        }
      });
    }

    // Create all subjects
    const createdSubjects = [];
    for (const subjectData of subjects) {
      const subject = await prisma.subject.create({
        data: {
          ...subjectData,
          teacherId: null, // No teacher assigned initially
          courseId: defaultCourse.id,  // Assign to default course initially
        },
      });
      createdSubjects.push(subject);
    }

    console.log(`✅ Successfully created ${createdSubjects.length} subjects`);
    console.log('📚 Subject categories:');
    console.log('   - Computer Science & IT: 12 subjects');
    console.log('   - Mathematics: 8 subjects');
    console.log('   - Business & Management: 8 subjects');
    console.log('   - Engineering: 7 subjects');
    console.log('   - Liberal Arts & Humanities: 8 subjects');
    console.log('   - Natural Sciences: 6 subjects');
    console.log('   - Health Sciences: 7 subjects');
    console.log('   - Education: 6 subjects');
    console.log('   - Arts & Design: 6 subjects');
    console.log('   - Languages: 6 subjects');
    console.log('   - Communication: 5 subjects');
    console.log('   - Economics: 4 subjects');
    console.log('   - Political Science: 4 subjects');
    console.log('   - Environmental Studies: 4 subjects');

  } catch (error) {
    console.error('❌ Error seeding subjects:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedSubjects()
  .then(() => {
    console.log('🎉 Subject seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Subject seeding failed:', error);
    process.exit(1);
  });








