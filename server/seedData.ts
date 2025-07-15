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
      description: 'Learn the fundamentals of programming, algorithms, and data structures. This course covers basic programming concepts using Python.',
      courseCode: 'CS101',
      semester: 'Fall',
      year: 2024,
      teacherId: 'teacher'
    },
    {
      title: 'Database Systems',
      description: 'Comprehensive course covering relational databases, SQL, normalization, and database design principles.',
      courseCode: 'CS203',
      semester: 'Fall',
      year: 2024,
      teacherId: 'teacher'
    },
    {
      title: 'Web Development',
      description: 'Learn to build modern web applications using HTML, CSS, JavaScript, and popular frameworks.',
      courseCode: 'CS301',
      semester: 'Fall',
      year: 2024,
      teacherId: 'teacher2'
    },
    {
      title: 'Data Structures and Algorithms',
      description: 'In-depth study of fundamental data structures and algorithms with emphasis on efficiency and problem-solving.',
      courseCode: 'CS202',
      semester: 'Spring',
      year: 2024,
      teacherId: 'teacher2'
    },
    {
      title: 'Software Engineering',
      description: 'Principles and practices of software development including project management, testing, and maintenance.',
      courseCode: 'CS401',
      semester: 'Spring',
      year: 2024,
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
    { studentId: 'student', courseId: courses[0]?.id }, // CS101
    { studentId: 'student', courseId: courses[1]?.id }, // CS203
    { studentId: 'student', courseId: courses[2]?.id }, // CS301
    
    { studentId: 'student2', courseId: courses[0]?.id }, // CS101
    { studentId: 'student2', courseId: courses[3]?.id }, // CS202
    { studentId: 'student2', courseId: courses[4]?.id }, // CS401
    
    { studentId: 'student3', courseId: courses[1]?.id }, // CS203
    { studentId: 'student3', courseId: courses[2]?.id }, // CS301
    { studentId: 'student3', courseId: courses[3]?.id }, // CS202
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
    // CS101 assignments
    {
      title: 'Hello World Program',
      description: 'Write your first Python program that prints "Hello, World!" to the console.',
      courseId: courses[0]?.id,
      dueDate: new Date('2024-09-15'),
      totalPoints: 10
    },
    {
      title: 'Variables and Data Types',
      description: 'Create a program demonstrating different data types and variable operations.',
      courseId: courses[0]?.id,
      dueDate: new Date('2024-09-22'),
      totalPoints: 25
    },
    {
      title: 'Control Structures',
      description: 'Implement loops and conditional statements to solve basic problems.',
      courseId: courses[0]?.id,
      dueDate: new Date('2024-10-01'),
      totalPoints: 35
    },
    
    // CS203 assignments
    {
      title: 'Database Design',
      description: 'Design a normalized database schema for a library management system.',
      courseId: courses[1]?.id,
      dueDate: new Date('2024-09-30'),
      totalPoints: 50
    },
    {
      title: 'SQL Queries',
      description: 'Write complex SQL queries to retrieve and manipulate data.',
      courseId: courses[1]?.id,
      dueDate: new Date('2024-10-15'),
      totalPoints: 40
    },
    
    // CS301 assignments
    {
      title: 'HTML/CSS Portfolio',
      description: 'Create a personal portfolio website using HTML and CSS.',
      courseId: courses[2]?.id,
      dueDate: new Date('2024-09-25'),
      totalPoints: 45
    },
    {
      title: 'JavaScript Interactive Page',
      description: 'Build an interactive web page using JavaScript and DOM manipulation.',
      courseId: courses[2]?.id,
      dueDate: new Date('2024-10-10'),
      totalPoints: 55
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
    // Student submissions with grades
    {
      assignmentId: assignments[0]?.id,
      studentId: 'student',
      submittedAt: new Date('2024-09-14'),
      grade: 10,
      feedback: 'Excellent work! Clean code and correct output.'
    },
    {
      assignmentId: assignments[1]?.id,
      studentId: 'student',
      submittedAt: new Date('2024-09-21'),
      grade: 22,
      feedback: 'Good understanding of data types. Minor syntax issues.'
    },
    {
      assignmentId: assignments[0]?.id,
      studentId: 'student2',
      submittedAt: new Date('2024-09-15'),
      grade: 9,
      feedback: 'Good work, but could improve code comments.'
    },
    {
      assignmentId: assignments[1]?.id,
      studentId: 'student2',
      submittedAt: new Date('2024-09-22'),
      grade: 20,
      feedback: 'Solid understanding, keep up the good work!'
    },
    {
      assignmentId: assignments[3]?.id,
      studentId: 'student3',
      submittedAt: new Date('2024-09-29'),
      grade: 45,
      feedback: 'Excellent database design with proper normalization.'
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
      title: 'Welcome to CS101!',
      content: 'Welcome to Introduction to Computer Science! Please review the syllabus and prepare for our first coding assignment.',
      courseId: courses[0]?.id,
      authorId: 'teacher',
      isImportant: true
    },
    {
      title: 'Assignment 1 Due Date Extended',
      content: 'Due to technical difficulties, the due date for Assignment 1 has been extended to September 17th.',
      courseId: courses[0]?.id,
      authorId: 'teacher',
      isImportant: true
    },
    {
      title: 'Database Lab Session',
      content: 'Optional lab session will be held on Friday at 2 PM in Room 204 for extra help with SQL queries.',
      courseId: courses[1]?.id,
      authorId: 'teacher',
      isImportant: false
    },
    {
      title: 'Web Development Project Guidelines',
      content: 'Please review the project guidelines document for your final project. Groups of 2-3 students are allowed.',
      courseId: courses[2]?.id,
      authorId: 'teacher2',
      isImportant: false
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
      content: 'Hi Professor, I have a question about the assignment due date.',
      isRead: true
    },
    {
      senderId: 'teacher',
      receiverId: 'student',
      content: 'Hello! The assignment is due on September 22nd. Let me know if you have any other questions.',
      isRead: false
    },
    {
      senderId: 'student2',
      receiverId: 'teacher2',
      content: 'Could you please explain the web development project requirements?',
      isRead: true
    },
    {
      senderId: 'teacher2',
      receiverId: 'student2',
      content: 'Sure! The project should be a responsive website using HTML, CSS, and JavaScript. I\'ll send you the detailed requirements.',
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

export async function runSeedProcess() {
  console.log('=================================');
  console.log('  Database Seeding Process');
  console.log('=================================');
  
  const shouldSeed = await shouldSeedData();
  if (!shouldSeed) {
    console.log('Seeding skipped based on environment configuration');
    return;
  }
  
  const dataExists = await checkIfDataExists();
  if (dataExists) {
    console.log('Sample data already exists, skipping seeding process');
    return;
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