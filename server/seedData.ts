import { User, Course, Assignment, Enrollment, Announcement, Message, Submission } from './models/models';
import { sequelize } from './db';

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
    const userCount = await User.count();
    const courseCount = await Course.count();
    const assignmentCount = await Assignment.count();
    
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
      profileImageUrl: undefined
    },
    {
      id: 'teacher',
      email: 'teacher@lms.local',
      firstName: 'John',
      lastName: 'Teacher',
      role: 'teacher' as const,
      profileImageUrl: undefined
    },
    {
      id: 'student',
      email: 'student@lms.local',
      firstName: 'Jane',
      lastName: 'Student',
      role: 'student' as const,
      profileImageUrl: undefined
    },
    {
      id: 'teacher2',
      email: 'teacher2@lms.local',
      firstName: 'Sarah',
      lastName: 'Wilson',
      role: 'teacher' as const,
      profileImageUrl: undefined
    },
    {
      id: 'student2',
      email: 'student2@lms.local',
      firstName: 'Mike',
      lastName: 'Johnson',
      role: 'student' as const,
      profileImageUrl: undefined
    },
    {
      id: 'student3',
      email: 'student3@lms.local',
      firstName: 'Emily',
      lastName: 'Davis',
      role: 'student' as const,
      profileImageUrl: undefined
    }
  ];
  
  for (const userData of defaultUsers) {
    try {
      const existingUser = await User.findByPk(userData.id);
      if (!existingUser) {
        await User.create(userData);
        console.log(`   ✅ Created user: ${userData.id} (${userData.role})`);
      } else {
        console.log(`   ⚠️  User "${userData.id}" already exists, skipping...`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to create user "${userData.id}":`, error);
    }
  }
}

export async function seedSampleCourses() {
  console.log('Seeding sample courses...');
  
  const sampleCourses = [
    {
      title: 'Introduction to Computer Science',
      description: 'Learn the fundamentals of programming, algorithms, and data structures. This course covers basic programming concepts using Python and introduces computational thinking.',
      courseCode: 'CS 101',
      semester: 'Fall',
      year: 2025,
      teacherId: 'teacher'
    },
    {
      title: 'Calculus I',
      description: 'Differential and integral calculus with applications. Topics include limits, derivatives, integrals, and the fundamental theorem of calculus.',
      courseCode: 'MATH 201',
      semester: 'Fall',
      year: 2025,
      teacherId: 'teacher2'
    },
    {
      title: 'Introduction to Psychology',
      description: 'Overview of psychological principles, research methods, and applications in understanding human behavior and mental processes.',
      courseCode: 'PSYC 101',
      semester: 'Fall',
      year: 2025,
      teacherId: 'teacher'
    }
  ];
  
  const createdCourses = [];
  for (const courseData of sampleCourses) {
    try {
      const existingCourse = await Course.findOne({ where: { courseCode: courseData.courseCode } });
      if (!existingCourse) {
        const course = await Course.create(courseData);
        createdCourses.push(course);
        console.log(`   ✅ Created course: ${courseData.courseCode} - ${courseData.title}`);
      } else {
        createdCourses.push(existingCourse);
        console.log(`   ⚠️  Course "${courseData.courseCode}" already exists, skipping...`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to create course "${courseData.courseCode}":`, error);
    }
  }
  
  return createdCourses;
}

export async function seedSampleEnrollments(courses: any[]) {
  console.log('Seeding sample enrollments...');
  
  const enrollments = [
    // Students enrolled in multiple courses
    { studentId: 'student', courseId: courses[0]?.id }, // CS 101
    { studentId: 'student', courseId: courses[1]?.id }, // MATH 201
    { studentId: 'student', courseId: courses[2]?.id }, // PSYC 101
    
    { studentId: 'student2', courseId: courses[0]?.id }, // CS 101
    { studentId: 'student2', courseId: courses[1]?.id }, // MATH 201
    
    { studentId: 'student3', courseId: courses[0]?.id }, // CS 101
    { studentId: 'student3', courseId: courses[2]?.id }, // PSYC 101
  ];
  
  for (const enrollment of enrollments) {
    if (enrollment.courseId) {
      try {
        const existing = await Enrollment.findOne({
          where: { studentId: enrollment.studentId, courseId: enrollment.courseId }
        });
        if (!existing) {
          await Enrollment.create(enrollment);
          console.log(`   ✅ Enrolled ${enrollment.studentId} in course ${enrollment.courseId}`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to enroll student:`, error);
      }
    }
  }
}

export async function seedSampleAssignments(courses: any[]) {
  console.log('Seeding sample assignments...');
  
  const assignments = [
    // CS 101 assignments
    {
      title: 'Problem Set 3: Sorting Algorithms',
      description: 'Implement and analyze various sorting algorithms including bubble sort, merge sort, and quicksort.',
      courseId: courses[0]?.id,
      dueDate: new Date('2025-03-15'),
      totalPoints: 100
    },
    {
      title: 'Lab Exercise: Binary Trees',
      description: 'Implement a binary search tree with insertion, deletion, and traversal operations.',
      courseId: courses[0]?.id,
      dueDate: new Date('2025-03-08'),
      totalPoints: 75
    },
    
    // MATH 201 assignments
    {
      title: 'Integration Quiz',
      description: 'Quiz covering integration techniques including substitution, integration by parts, and partial fractions.',
      courseId: courses[1]?.id,
      dueDate: new Date('2025-03-12'),
      totalPoints: 50
    },
    {
      title: 'Homework 4: Derivatives',
      description: 'Problem set covering differentiation rules, chain rule, and implicit differentiation.',
      courseId: courses[1]?.id,
      dueDate: new Date('2025-02-28'),
      totalPoints: 50
    },
    {
      title: 'Midterm Exam',
      description: 'Comprehensive exam covering chapters 1-8, including limits, derivatives, and basic integration.',
      courseId: courses[1]?.id,
      dueDate: new Date('2025-03-25'),
      totalPoints: 200
    },
    
    // PSYC 101 assignments
    {
      title: 'Research Paper: Memory and Learning',
      description: '5-page research paper on the relationship between memory formation and learning processes.',
      courseId: courses[2]?.id,
      dueDate: new Date('2025-03-20'),
      totalPoints: 150
    },
    {
      title: 'Chapter 3 Quiz',
      description: 'Quiz covering cognitive psychology concepts including attention, memory, and perception.',
      courseId: courses[2]?.id,
      dueDate: new Date('2025-03-05'),
      totalPoints: 20
    }
  ];
  
  const createdAssignments = [];
  for (const assignmentData of assignments) {
    if (assignmentData.courseId) {
      try {
        const assignment = await Assignment.create(assignmentData);
        createdAssignments.push(assignment);
        console.log(`   ✅ Created assignment: ${assignmentData.title}`);
      } catch (error) {
        console.error(`   ❌ Failed to create assignment "${assignmentData.title}":`, error);
      }
    }
  }
  
  return createdAssignments;
}

export async function seedSampleSubmissions(assignments: any[]) {
  console.log('Seeding sample submissions...');
  
  const submissions = [
    // CS 101 submissions
    {
      assignmentId: assignments[0]?.id, // Problem Set 3: Sorting Algorithms
      studentId: 'student',
      submittedAt: new Date('2025-03-14'),
      grade: 88,
      feedback: 'Good implementation of algorithms. Consider optimizing the quicksort partition function.'
    },
    {
      assignmentId: assignments[1]?.id, // Lab Exercise: Binary Trees
      studentId: 'student',
      submittedAt: new Date('2025-03-10'),
      grade: 70,
      feedback: 'Correct implementation but submitted late. Consider time management for future assignments.'
    },
    
    // MATH 201 submissions
    {
      assignmentId: assignments[2]?.id, // Integration Quiz
      studentId: 'student',
      submittedAt: new Date('2025-03-12'),
      grade: 45,
      feedback: 'Excellent work on integration by parts. Minor error in partial fractions problem.'
    },
    {
      assignmentId: assignments[3]?.id, // Homework 4: Derivatives
      studentId: 'student',
      submittedAt: new Date('2025-02-28'),
      grade: 42,
      feedback: 'Good grasp of chain rule. Practice more with implicit differentiation.'
    },
    
    // PSYC 101 submissions
    {
      assignmentId: assignments[6]?.id, // Chapter 3 Quiz
      studentId: 'student',
      submittedAt: new Date('2025-03-05'),
      grade: 18,
      feedback: 'Strong understanding of cognitive concepts. Review attention mechanisms.'
    },
    
    // Additional student submissions
    {
      assignmentId: assignments[0]?.id, // Problem Set 3: Sorting Algorithms
      studentId: 'student2',
      submittedAt: new Date('2025-03-14'),
      grade: 92,
      feedback: 'Excellent implementation with great code documentation.'
    },
    {
      assignmentId: assignments[2]?.id, // Integration Quiz
      studentId: 'student2',
      submittedAt: new Date('2025-03-12'),
      grade: 48,
      feedback: 'Very good understanding of integration techniques.'
    }
  ];
  
  for (const submissionData of submissions) {
    if (submissionData.assignmentId) {
      try {
        await Submission.create(submissionData);
        console.log(`   ✅ Created submission for assignment ${submissionData.assignmentId}`);
      } catch (error) {
        console.error(`   ❌ Failed to create submission:`, error);
      }
    }
  }
}

export async function seedSampleAnnouncements(courses: any[]) {
  console.log('Seeding sample announcements...');
  
  const announcements = [
    {
      title: 'Midterm Exam Schedule Released',
      content: 'The midterm examination schedule has been posted. Please check your student portal for specific dates and times. All exams will be held in the main lecture hall unless otherwise specified. Make sure to bring valid photo ID and writing materials.',
      courseId: courses[0]?.id,
      authorId: 'teacher',
      isImportant: true
    },
    {
      title: 'Assignment 3 Extension',
      content: 'Due to technical difficulties with the server last week, we are extending the deadline for Assignment 3 by 48 hours. The new deadline is Friday, March 22nd at 11:59 PM. Please use this extra time to refine your solutions.',
      courseId: courses[1]?.id,
      authorId: 'teacher2',
      isImportant: false
    },
    {
      title: 'Office Hours Change',
      content: 'Starting next week, my office hours will change from Tuesday 2-4 PM to Wednesday 3-5 PM. This change is permanent for the rest of the semester. Please update your calendars accordingly.',
      courseId: courses[2]?.id,
      authorId: 'teacher',
      isImportant: false
    },
    {
      title: 'Guest Lecturer This Friday',
      content: 'We\'re excited to announce that Dr. Michael Rodriguez from MIT will be giving a guest lecture this Friday on \'Advanced Algorithms in Machine Learning\'. This is a great opportunity to learn from a leading expert in the field. Attendance is highly encouraged but not mandatory.',
      courseId: courses[0]?.id,
      authorId: 'teacher',
      isImportant: false
    },
    {
      title: 'Research Paper Guidelines Updated',
      content: 'I\'ve updated the research paper guidelines document with additional citation requirements and formatting specifications. Please download the latest version from the course materials section. Papers that don\'t follow the new guidelines will be returned for revision.',
      courseId: courses[2]?.id,
      authorId: 'teacher',
      isImportant: true
    }
  ];
  
  for (const announcementData of announcements) {
    if (announcementData.courseId) {
      try {
        await Announcement.create(announcementData);
        console.log(`   ✅ Created announcement: ${announcementData.title}`);
      } catch (error) {
        console.error(`   ❌ Failed to create announcement:`, error);
      }
    }
  }
}

export async function seedSampleMessages() {
  console.log('Seeding sample messages...');
  
  const messages = [
    {
      senderId: 'student',
      receiverId: 'teacher',
      content: 'Hi Professor, I have a question about the sorting algorithms assignment. Could you clarify the requirements for the efficiency analysis?',
      isRead: true
    },
    {
      senderId: 'teacher',
      receiverId: 'student',
      content: 'Hello! For the efficiency analysis, please include time complexity (Big O) for each algorithm and compare their performance with different input sizes. Let me know if you need more details.',
      isRead: false
    },
    {
      senderId: 'student2',
      receiverId: 'teacher2',
      content: 'I\'m having trouble with the integration by parts problems. Are there any additional resources you\'d recommend?',
      isRead: true
    },
    {
      senderId: 'teacher2',
      receiverId: 'student2',
      content: 'I recommend reviewing Khan Academy\'s integration by parts series. Also, practice with the problems at the end of Chapter 7. My office hours are Wednesday 3-5 PM if you need more help.',
      isRead: false
    },
    {
      senderId: 'student3',
      receiverId: 'teacher',
      content: 'Thank you for the feedback on my psychology research paper. I\'ve made the revisions you suggested.',
      isRead: true
    },
    {
      senderId: 'teacher',
      receiverId: 'student3',
      content: 'Great! I\'ll review your revised paper by Friday. Your improvements to the methodology section look much stronger.',
      isRead: false
    }
  ];
  
  for (const messageData of messages) {
    try {
      await Message.create(messageData);
      console.log(`   ✅ Created message from ${messageData.senderId} to ${messageData.receiverId}`);
    } catch (error) {
      console.error(`   ❌ Failed to create message:`, error);
    }
  }
}

export async function runSeedProcess(forceInit: boolean = false) {
  console.log('=================================');
  console.log('  Database Seeding Process');
  console.log('=================================');
  
  const shouldSeed = await shouldSeedData();
  if (!shouldSeed) {
    console.log('Seeding skipped based on environment configuration');
    return;
  }
  
  if (!forceInit) {
    const dataExists = await checkIfDataExists();
    if (dataExists) {
      console.log('Sample data already exists, skipping seeding process');
      return;
    }
  } else {
    console.log('DB_INIT=true detected. Force seeding data...');
  }
  
  try {
    await seedDefaultUsers();
    const courses = await seedSampleCourses();
    await seedSampleEnrollments(courses);
    const assignments = await seedSampleAssignments(courses);
    await seedSampleSubmissions(assignments);
    await seedSampleAnnouncements(courses);
    await seedSampleMessages();
    
    console.log('');
    console.log('✅ Database seeding completed successfully!');
    console.log('=================================');
  } catch (error) {
    console.error('❌ Error during seeding process:', error);
    throw error;
  }
}