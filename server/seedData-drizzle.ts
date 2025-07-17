import { db } from './db-drizzle';
import { users, courses, assignments, enrollments, announcements, messages, submissions } from '../shared/schema';
import { eq } from 'drizzle-orm';

export async function shouldSeedData(): Promise<boolean> {
  const environment = process.env.ENVIRONMENT || 'development';
  const runMode = process.env.RUN_MODE || 'demo';
  
  console.log(`Environment: ${environment}, Run Mode: ${runMode}`);
  
  // Check if we should seed data based on environment
  if (environment === 'development') {
    return true; // Always seed in development
  } else if (environment === 'production' && runMode === 'demo') {
    return true; // Seed in production if demo mode
  }
  
  return false; // Don't seed in production live mode
}

export async function checkIfDataExists(): Promise<boolean> {
  try {
    const userCount = await db.select().from(users).then(rows => rows.length);
    const courseCount = await db.select().from(courses).then(rows => rows.length);
    const assignmentCount = await db.select().from(assignments).then(rows => rows.length);
    
    // If we have any substantial data, don't seed
    return userCount > 3 || courseCount > 0 || assignmentCount > 0;
  } catch (error) {
    console.error('Error checking existing data:', error);
    return false;
  }
}

export async function seedDefaultUsers() {
  console.log('Seeding default users...');
  
  const defaultUsers = [
    {
      id: 'admin',
      email: 'admin@lms.local',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin' as const,
      profileImageUrl: null
    },
    {
      id: 'teacher',
      email: 'teacher@lms.local',
      firstName: 'John',
      lastName: 'Teacher',
      role: 'teacher' as const,
      profileImageUrl: null
    },
    {
      id: 'student',
      email: 'student@lms.local',
      firstName: 'Jane',
      lastName: 'Student',
      role: 'student' as const,
      profileImageUrl: null
    },
    {
      id: 'student2',
      email: 'student2@lms.local',
      firstName: 'Mike',
      lastName: 'Wilson',
      role: 'student' as const,
      profileImageUrl: null
    },
    {
      id: 'student3',
      email: 'student3@lms.local',
      firstName: 'Emily',
      lastName: 'Davis',
      role: 'student' as const,
      profileImageUrl: null
    },
    {
      id: 'teacher2',
      email: 'teacher2@lms.local',
      firstName: 'Dr. Sarah',
      lastName: 'Johnson',
      role: 'teacher' as const,
      profileImageUrl: null
    }
  ];

  for (const userData of defaultUsers) {
    try {
      await db.insert(users).values(userData).onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date()
        }
      });
      console.log(`   ✅ Created/updated user: ${userData.id}`);
    } catch (error) {
      console.error(`   ❌ Failed to create user ${userData.id}:`, error);
    }
  }
}

export async function seedSampleCourses() {
  console.log('Seeding sample courses...');
  
  const sampleCourses = [
    {
      title: 'Introduction to Computer Science',
      description: 'A comprehensive introduction to computer science fundamentals, covering programming basics, data structures, algorithms, and problem-solving techniques.',
      courseCode: 'CS 101',
      teacherId: 'teacher',
      semester: 'Fall',
      year: 2025,
      termType: 'semester',
      visibility: 'private' as const,
      gradingScheme: 'letter' as const,
      isActive: true
    },
    {
      title: 'Calculus and Analytical Geometry',
      description: 'Advanced calculus covering limits, derivatives, integrals, and their applications in real-world problem solving.',
      courseCode: 'MATH 201',
      teacherId: 'teacher2',
      semester: 'Fall',
      year: 2025,
      termType: 'semester',
      visibility: 'private' as const,
      gradingScheme: 'letter' as const,
      isActive: true
    },
    {
      title: 'Introduction to Psychology',
      description: 'Overview of psychological principles, research methods, and applications in understanding human behavior and mental processes.',
      courseCode: 'PSYC 101',
      teacherId: 'teacher',
      semester: 'Fall',
      year: 2025,
      termType: 'semester',
      visibility: 'private' as const,
      gradingScheme: 'letter' as const,
      isActive: true
    },
    {
      title: 'Data Structures and Algorithms',
      description: 'Advanced course covering complex data structures, algorithm design, analysis, and optimization techniques.',
      courseCode: 'CS 201',
      teacherId: 'teacher',
      semester: 'Spring',
      year: 2025,
      termType: 'semester',
      visibility: 'private' as const,
      gradingScheme: 'letter' as const,
      isActive: true
    },
    {
      title: 'Statistics and Probability',
      description: 'Comprehensive course on statistical methods, probability theory, and data analysis techniques.',
      courseCode: 'STAT 301',
      teacherId: 'teacher2',
      semester: 'Spring',
      year: 2025,
      termType: 'semester',
      visibility: 'private' as const,
      gradingScheme: 'letter' as const,
      isActive: true
    }
  ];

  const createdCourses = [];
  for (const courseData of sampleCourses) {
    try {
      // Check if course already exists
      const existingCourse = await db.select().from(courses).where(eq(courses.courseCode, courseData.courseCode));
      if (existingCourse.length > 0) {
        console.log(`   ⚠️  Course "${courseData.title}" already exists, skipping...`);
        createdCourses.push(existingCourse[0]);
        continue;
      }

      const [newCourse] = await db.insert(courses).values(courseData).returning();
      createdCourses.push(newCourse);
      console.log(`   ✅ Created course: ${courseData.title}`);
    } catch (error) {
      console.error(`   ❌ Failed to create course ${courseData.title}:`, error);
    }
  }

  return createdCourses;
}

export async function seedSampleEnrollments(courseList: any[]) {
  console.log('Seeding sample enrollments...');
  
  // Enroll students in multiple courses for comprehensive analytics
  const enrollmentData = [
    // Student 1 enrollments
    { studentId: 'student', courseId: courseList[0]?.id }, // CS 101
    { studentId: 'student', courseId: courseList[1]?.id }, // MATH 201
    { studentId: 'student', courseId: courseList[2]?.id }, // PSYC 101
    
    // Student 2 enrollments
    { studentId: 'student2', courseId: courseList[0]?.id }, // CS 101
    { studentId: 'student2', courseId: courseList[3]?.id }, // CS 201
    { studentId: 'student2', courseId: courseList[4]?.id }, // STAT 301
    
    // Student 3 enrollments
    { studentId: 'student3', courseId: courseList[1]?.id }, // MATH 201
    { studentId: 'student3', courseId: courseList[2]?.id }, // PSYC 101
    { studentId: 'student3', courseId: courseList[4]?.id }, // STAT 301
  ];

  for (const enrollment of enrollmentData) {
    if (enrollment.courseId) {
      try {
        await db.insert(enrollments).values({
          studentId: enrollment.studentId,
          courseId: enrollment.courseId,
          isActive: true
        });
        console.log(`   ✅ Enrolled ${enrollment.studentId} in course ${enrollment.courseId}`);
      } catch (error) {
        console.error(`   ❌ Failed to enroll ${enrollment.studentId}:`, error);
      }
    }
  }
}

export async function seedSampleAssignments(courseList: any[]) {
  console.log('Seeding sample assignments...');
  
  const assignmentData = [
    // CS 101 assignments
    {
      courseId: courseList[0]?.id,
      title: 'Python Basics Programming',
      description: 'Write a Python program that demonstrates variables, loops, and functions.',
      dueDate: new Date('2025-08-15'),
      maxPoints: 100,
      assignmentType: 'programming',
      isActive: true
    },
    {
      courseId: courseList[0]?.id,
      title: 'Algorithm Analysis Report',
      description: 'Analyze the time complexity of different sorting algorithms.',
      dueDate: new Date('2025-08-25'),
      maxPoints: 150,
      assignmentType: 'report',
      isActive: true
    },
    {
      courseId: courseList[0]?.id,
      title: 'Text Processing Application',
      description: 'Create a text processing application using Python.',
      dueDate: new Date('2025-09-05'),
      maxPoints: 200,
      assignmentType: 'project',
      isActive: true
    },
    
    // MATH 201 assignments
    {
      courseId: courseList[1]?.id,
      title: 'Calculus Problem Set 1',
      description: 'Solve calculus problems involving limits and derivatives.',
      dueDate: new Date('2025-08-20'),
      maxPoints: 100,
      assignmentType: 'homework',
      isActive: true
    },
    {
      courseId: courseList[1]?.id,
      title: 'Applications of Derivatives',
      description: 'Apply derivative concepts to real-world optimization problems.',
      dueDate: new Date('2025-08-30'),
      maxPoints: 120,
      assignmentType: 'homework',
      isActive: true
    },
    {
      courseId: courseList[1]?.id,
      title: 'Integration Techniques Exam',
      description: 'Comprehensive exam on integration methods and applications.',
      dueDate: new Date('2025-09-10'),
      maxPoints: 200,
      assignmentType: 'exam',
      isActive: true
    },
    
    // PSYC 101 assignments
    {
      courseId: courseList[2]?.id,
      title: 'Research Methods Essay',
      description: 'Write an essay on psychological research methodologies.',
      dueDate: new Date('2025-08-18'),
      maxPoints: 100,
      assignmentType: 'essay',
      isActive: true
    },
    {
      courseId: courseList[2]?.id,
      title: 'Case Study Analysis',
      description: 'Analyze a psychological case study using course concepts.',
      dueDate: new Date('2025-08-28'),
      maxPoints: 150,
      assignmentType: 'case_study',
      isActive: true
    },
    {
      courseId: courseList[2]?.id,
      title: 'Behavioral Observation Lab',
      description: 'Conduct behavioral observations and write a lab report.',
      dueDate: new Date('2025-09-08'),
      maxPoints: 120,
      assignmentType: 'lab',
      isActive: true
    },
    
    // CS 201 assignments
    {
      courseId: courseList[3]?.id,
      title: 'Linked List Implementation',
      description: 'Implement a doubly linked list with all basic operations.',
      dueDate: new Date('2025-08-22'),
      maxPoints: 150,
      assignmentType: 'programming',
      isActive: true
    },
    {
      courseId: courseList[3]?.id,
      title: 'Binary Search Tree Project',
      description: 'Design and implement a balanced binary search tree.',
      dueDate: new Date('2025-09-02'),
      maxPoints: 200,
      assignmentType: 'project',
      isActive: true
    },
    
    // STAT 301 assignments
    {
      courseId: courseList[4]?.id,
      title: 'Descriptive Statistics Analysis',
      description: 'Analyze a dataset using descriptive statistical methods.',
      dueDate: new Date('2025-08-25'),
      maxPoints: 100,
      assignmentType: 'homework',
      isActive: true
    },
    {
      courseId: courseList[4]?.id,
      title: 'Hypothesis Testing Project',
      description: 'Design and conduct a hypothesis testing experiment.',
      dueDate: new Date('2025-09-05'),
      maxPoints: 180,
      assignmentType: 'project',
      isActive: true
    }
  ];

  const createdAssignments = [];
  for (const assignment of assignmentData) {
    if (assignment.courseId) {
      try {
        const [newAssignment] = await db.insert(assignments).values(assignment).returning();
        createdAssignments.push(newAssignment);
        console.log(`   ✅ Created assignment: ${assignment.title}`);
      } catch (error) {
        console.error(`   ❌ Failed to create assignment ${assignment.title}:`, error);
      }
    }
  }

  return createdAssignments;
}

export async function seedSampleSubmissions(assignmentList: any[]) {
  console.log('Seeding sample submissions...');
  
  const submissionData = [
    // Student submissions with varied grades for analytics
    { assignmentId: assignmentList[0]?.id, studentId: 'student', grade: 95, submissionText: 'Excellent Python program with clear logic and proper documentation.', isLate: false },
    { assignmentId: assignmentList[0]?.id, studentId: 'student2', grade: 87, submissionText: 'Good implementation with minor syntax issues.', isLate: false },
    { assignmentId: assignmentList[0]?.id, studentId: 'student3', grade: 92, submissionText: 'Well-structured code with creative problem-solving approach.', isLate: false },
    
    { assignmentId: assignmentList[1]?.id, studentId: 'student', grade: 88, submissionText: 'Thorough analysis with good understanding of algorithms.', isLate: false },
    { assignmentId: assignmentList[1]?.id, studentId: 'student2', grade: 94, submissionText: 'Excellent report with detailed complexity analysis.', isLate: false },
    
    { assignmentId: assignmentList[3]?.id, studentId: 'student', grade: 91, submissionText: 'Solid calculus work with clear step-by-step solutions.', isLate: false },
    { assignmentId: assignmentList[3]?.id, studentId: 'student2', grade: 79, submissionText: 'Basic understanding shown but needs more practice.', isLate: true },
    { assignmentId: assignmentList[3]?.id, studentId: 'student3', grade: 96, submissionText: 'Outstanding mathematical reasoning and presentation.', isLate: false },
    
    { assignmentId: assignmentList[4]?.id, studentId: 'student', grade: 93, submissionText: 'Excellent application of derivative concepts.', isLate: false },
    { assignmentId: assignmentList[4]?.id, studentId: 'student3', grade: 89, submissionText: 'Good work with minor calculation errors.', isLate: false },
    
    { assignmentId: assignmentList[6]?.id, studentId: 'student', grade: 90, submissionText: 'Well-researched essay with proper APA formatting.', isLate: false },
    { assignmentId: assignmentList[6]?.id, studentId: 'student3', grade: 85, submissionText: 'Good analysis but could use more references.', isLate: false },
    
    { assignmentId: assignmentList[7]?.id, studentId: 'student', grade: 88, submissionText: 'Insightful case study analysis with practical applications.', isLate: false },
    { assignmentId: assignmentList[7]?.id, studentId: 'student3', grade: 92, submissionText: 'Excellent psychological insights and clear writing.', isLate: false },
    
    { assignmentId: assignmentList[9]?.id, studentId: 'student2', grade: 89, submissionText: 'Solid implementation with good commenting.', isLate: false },
    { assignmentId: assignmentList[9]?.id, studentId: 'student3', grade: 94, submissionText: 'Excellent data structure implementation.', isLate: false },
    
    { assignmentId: assignmentList[11]?.id, studentId: 'student2', grade: 91, submissionText: 'Thorough statistical analysis with clear conclusions.', isLate: false },
    { assignmentId: assignmentList[11]?.id, studentId: 'student3', grade: 87, submissionText: 'Good statistical work with minor interpretation issues.', isLate: false }
  ];

  for (const submission of submissionData) {
    if (submission.assignmentId) {
      try {
        await db.insert(submissions).values({
          assignmentId: submission.assignmentId,
          studentId: submission.studentId,
          submissionText: submission.submissionText,
          grade: submission.grade,
          gradedAt: new Date(),
          isLate: submission.isLate,
          submittedAt: new Date()
        });
        console.log(`   ✅ Created submission for assignment ${submission.assignmentId}`);
      } catch (error) {
        console.error(`   ❌ Failed to create submission:`, error);
      }
    }
  }
}

export async function seedSampleAnnouncements(courseList: any[]) {
  console.log('Seeding sample announcements...');
  
  const announcementData = [
    // CS 101 announcements
    { courseId: courseList[0]?.id, title: 'Welcome to CS 101!', content: 'Welcome to Introduction to Computer Science! Please review the syllabus and prepare for an exciting semester.', authorId: 'teacher', isImportant: true },
    { courseId: courseList[0]?.id, title: 'Python Development Environment Setup', content: 'Please install Python 3.9+ and your preferred IDE. Instructions are available in the course materials.', authorId: 'teacher', isImportant: false },
    { courseId: courseList[0]?.id, title: 'Midterm Project Guidelines', content: 'The midterm project details have been posted. Please review the requirements and start planning your approach.', authorId: 'teacher', isImportant: true },
    
    // MATH 201 announcements
    { courseId: courseList[1]?.id, title: 'Calculus Study Group', content: 'Join our weekly calculus study group every Wednesday at 3 PM in the math tutoring center.', authorId: 'teacher2', isImportant: false },
    { courseId: courseList[1]?.id, title: 'Integration Exam Next Week', content: 'The integration techniques exam is scheduled for next Friday. Review chapters 5-7 and practice problems.', authorId: 'teacher2', isImportant: true },
    { courseId: courseList[1]?.id, title: 'Graphing Calculator Policy', content: 'Reminder: Only TI-84 calculators are allowed during exams. No phones or other devices permitted.', authorId: 'teacher2', isImportant: true },
    
    // PSYC 101 announcements
    { courseId: courseList[2]?.id, title: 'Research Participation Opportunity', content: 'Students can earn extra credit by participating in psychology research studies. Sign up in the department office.', authorId: 'teacher', isImportant: false },
    { courseId: courseList[2]?.id, title: 'Guest Lecture: Dr. Sarah Chen', content: 'Dr. Chen will present on cognitive psychology research this Thursday at 2 PM. Attendance is highly recommended.', authorId: 'teacher', isImportant: true },
    { courseId: courseList[2]?.id, title: 'Case Study Assignment Instructions', content: 'Detailed instructions for the case study assignment are now available. Please read carefully before starting.', authorId: 'teacher', isImportant: false },
    
    // CS 201 announcements
    { courseId: courseList[3]?.id, title: 'Advanced Programming Concepts', content: 'We will be covering advanced topics in data structures. Please review prerequisite materials from CS 101.', authorId: 'teacher', isImportant: false },
    { courseId: courseList[3]?.id, title: 'Group Project Formation', content: 'Students should form groups of 3-4 for the final project. Use the class forum to find teammates.', authorId: 'teacher', isImportant: true },
    
    // STAT 301 announcements
    { courseId: courseList[4]?.id, title: 'Statistical Software Installation', content: 'Please install R and RStudio for statistical analysis. Links and instructions are in the course materials.', authorId: 'teacher2', isImportant: true },
    { courseId: courseList[4]?.id, title: 'Real-World Data Analysis Project', content: 'Choose a dataset from the provided list for your final project. Proposals due next week.', authorId: 'teacher2', isImportant: false }
  ];

  for (const announcement of announcementData) {
    if (announcement.courseId) {
      try {
        await db.insert(announcements).values(announcement);
        console.log(`   ✅ Created announcement: ${announcement.title}`);
      } catch (error) {
        console.error(`   ❌ Failed to create announcement:`, error);
      }
    }
  }
}

export async function seedSampleMessages(courseList: any[]) {
  console.log('Seeding sample messages...');
  
  const messageData = [
    // Student-Teacher conversations
    {
      senderId: 'student',
      receiverId: 'teacher',
      courseId: courseList[0]?.id,
      subject: 'Question about Assignment 1',
      content: 'Hi Professor, I\'m having trouble with the calculator assignment. The division by zero handling isn\'t working as expected. Could you provide some guidance?',
      isRead: true
    },
    {
      senderId: 'teacher',
      receiverId: 'student',
      courseId: courseList[0]?.id,
      subject: 'Re: Question about Assignment 1',
      content: 'Hi Jane, for division by zero, use a try-except block to catch ZeroDivisionError. Return an error message instead of crashing. Check the example in lecture notes. Let me know if you need more help!',
      isRead: false
    },
    {
      senderId: 'student2',
      receiverId: 'teacher2',
      courseId: courseList[1]?.id,
      subject: 'Office Hours Question',
      content: 'Hello, I won\'t be able to attend office hours today. Could we schedule a brief meeting to discuss the integration problems? I\'m particularly confused about partial fractions.',
      isRead: true
    },
    {
      senderId: 'teacher2',
      receiverId: 'student2',
      courseId: courseList[1]?.id,
      subject: 'Re: Office Hours Question',
      content: 'Sure Mike, I\'m available tomorrow at 3 PM or Friday at 1 PM. For partial fractions, remember to factor the denominator completely first. We can work through examples when we meet.',
      isRead: false
    },
    {
      senderId: 'student3',
      receiverId: 'teacher',
      courseId: courseList[2]?.id,
      subject: 'Research Paper Topic',
      content: 'I\'m interested in writing about the effectiveness of cognitive behavioral therapy for anxiety disorders. Is this topic appropriate for our research paper assignment?',
      isRead: true
    },
    {
      senderId: 'teacher',
      receiverId: 'student3',
      courseId: courseList[2]?.id,
      subject: 'Re: Research Paper Topic',
      content: 'That\'s an excellent topic, Emily! Make sure to include recent studies and discuss both benefits and limitations. Focus on specific anxiety disorders for more depth. Good choice!',
      isRead: false
    }
  ];

  for (const message of messageData) {
    if (message.courseId) {
      try {
        await db.insert(messages).values(message);
        console.log(`   ✅ Created message: ${message.subject}`);
      } catch (error) {
        console.error(`   ❌ Failed to create message:`, error);
      }
    }
  }
}

export async function seedAllData() {
  console.log('🌱 Starting comprehensive data seeding...');
  
  try {
    // Check if we should seed data
    const shouldSeed = await shouldSeedData();
    if (!shouldSeed) {
      console.log('⚠️  Skipping data seeding based on environment settings');
      return;
    }
    
    // If DB_INIT is true, force seeding even if data exists
    if (process.env.DB_INIT === 'true') {
      console.log('🚀 DB_INIT=true - Force seeding comprehensive analytics data...');
    } else {
      // Check if data already exists
      const dataExists = await checkIfDataExists();
      if (dataExists) {
        console.log('⚠️  Data already exists, skipping seeding');
        return;
      }
    }
    
    // Seed all data in order
    await seedDefaultUsers();
    const courseList = await seedSampleCourses();
    await seedSampleEnrollments(courseList);
    const assignmentList = await seedSampleAssignments(courseList);
    await seedSampleSubmissions(assignmentList);
    await seedSampleAnnouncements(courseList);
    await seedSampleMessages(courseList);
    
    console.log('✅ Comprehensive data seeding completed successfully!');
    console.log('📊 Analytics data ready for demonstration:');
    console.log('   - 5 courses with varied enrollment');
    console.log('   - 13 assignments with realistic due dates');
    console.log('   - 18+ submissions with graded analytics');
    console.log('   - 13 announcements across all courses');
    console.log('   - 6 message conversations');
    console.log('   - Comprehensive analytics for dashboard');
    
  } catch (error) {
    console.error('❌ Error during data seeding:', error);
  }
}