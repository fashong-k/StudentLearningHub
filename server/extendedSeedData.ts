import { db } from './db-drizzle';
import { 
  courses, 
  assignments, 
  submissions, 
  announcements, 
  messages, 
  enrollments, 
  users 
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Extended seed data for course update validation system
export async function seedExtendedData() {
  console.log('🌱 Seeding extended data for course update validation...');

  try {
    // First, let's add some additional courses to make the validation more comprehensive
    const additionalCourses = [
      {
        title: 'Advanced JavaScript Frameworks',
        description: 'Deep dive into React, Vue, and Angular frameworks with practical projects',
        courseCode: 'CS-301',
        teacherId: 'teacher',
        semester: 'Fall',
        year: 2025,
        visibility: 'institution' as const,
        gradingScheme: 'percentage' as const,
        isActive: true
      },
      {
        title: 'Database Design and Management',
        description: 'Comprehensive course on database design, SQL, and database administration',
        courseCode: 'CS-250',
        teacherId: 'teacher',
        semester: 'Spring',
        year: 2025,
        visibility: 'private' as const,
        gradingScheme: 'letter' as const,
        isActive: true
      },
      {
        title: 'Web Development Fundamentals',
        description: 'Introduction to HTML, CSS, JavaScript, and basic web development concepts',
        courseCode: 'CS-150',
        teacherId: 'teacher',
        semester: 'Fall',
        year: 2024,
        visibility: 'institution' as const,
        gradingScheme: 'points' as const,
        isActive: false // This is an archived course
      }
    ];

    // Insert additional courses
    const insertedCourses = await db.insert(courses).values(additionalCourses).returning();
    console.log(`✅ Added ${insertedCourses.length} additional courses`);

    // Get all courses including existing ones
    const allCourses = await db.select().from(courses);
    console.log(`📚 Total courses in database: ${allCourses.length}`);

    // Add more comprehensive assignments for validation testing
    const additionalAssignments = [
      // For CS-301 (Advanced JavaScript Frameworks)
      {
        courseId: insertedCourses[0].id,
        title: 'React Component Library Project',
        description: 'Build a reusable component library with TypeScript and Storybook',
        dueDate: new Date('2025-03-15'),
        maxPoints: 150,
        assignmentType: 'project',
        isActive: true
      },
      {
        courseId: insertedCourses[0].id,
        title: 'Vue.js E-commerce Application',
        description: 'Create a full-featured e-commerce site using Vue.js and Vuex',
        dueDate: new Date('2025-04-20'),
        maxPoints: 200,
        assignmentType: 'project',
        isActive: true
      },
      {
        courseId: insertedCourses[0].id,
        title: 'Angular Testing Workshop',
        description: 'Comprehensive testing strategies for Angular applications',
        dueDate: new Date('2025-05-10'),
        maxPoints: 100,
        assignmentType: 'homework',
        isActive: true
      },
      
      // For CS-250 (Database Design)
      {
        courseId: insertedCourses[1].id,
        title: 'Database Schema Design',
        description: 'Design a normalized database schema for a hospital management system',
        dueDate: new Date('2025-02-28'),
        maxPoints: 120,
        assignmentType: 'project',
        isActive: true
      },
      {
        courseId: insertedCourses[1].id,
        title: 'SQL Query Optimization',
        description: 'Optimize complex SQL queries for better performance',
        dueDate: new Date('2025-03-30'),
        maxPoints: 80,
        assignmentType: 'homework',
        isActive: true
      },
      
      // For CS-150 (Web Development Fundamentals) - archived course
      {
        courseId: insertedCourses[2].id,
        title: 'Portfolio Website',
        description: 'Create a personal portfolio website using HTML, CSS, and JavaScript',
        dueDate: new Date('2024-12-15'),
        maxPoints: 100,
        assignmentType: 'project',
        isActive: false // Assignment in archived course
      }
    ];

    const insertedAssignments = await db.insert(assignments).values(additionalAssignments).returning();
    console.log(`✅ Added ${insertedAssignments.length} additional assignments`);

    // Add more student enrollments to test cascade effects
    const additionalEnrollments = [
      // Student enrolled in multiple courses
      {
        studentId: 'student',
        courseId: insertedCourses[0].id,
        isActive: true
      },
      {
        studentId: 'student',
        courseId: insertedCourses[1].id,
        isActive: true
      },
      {
        studentId: 'student',
        courseId: insertedCourses[2].id,
        isActive: false // Enrollment in archived course
      }
    ];

    const insertedEnrollments = await db.insert(enrollments).values(additionalEnrollments).returning();
    console.log(`✅ Added ${insertedEnrollments.length} additional enrollments`);

    // Add submissions for the new assignments to test validation impact
    const additionalSubmissions = [
      {
        assignmentId: insertedAssignments[0].id,
        studentId: 'student',
        submissionText: 'Component library with 15 reusable components built in TypeScript...',
        grade: 140,
        feedback: 'Excellent work on the component library. Great use of TypeScript.',
        submittedAt: new Date('2025-03-14'),
        gradedAt: new Date('2025-03-16'),
        isLate: false
      },
      {
        assignmentId: insertedAssignments[1].id,
        studentId: 'student',
        submissionText: 'Vue.js e-commerce application with shopping cart, user authentication...',
        grade: 185,
        feedback: 'Outstanding implementation of the e-commerce features.',
        submittedAt: new Date('2025-04-19'),
        gradedAt: new Date('2025-04-22'),
        isLate: false
      },
      {
        assignmentId: insertedAssignments[2].id,
        studentId: 'student',
        submissionText: 'Comprehensive testing suite for Angular app with 95% code coverage...',
        grade: 95,
        feedback: 'Good testing practices demonstrated.',
        submittedAt: new Date('2025-05-09'),
        gradedAt: new Date('2025-05-12'),
        isLate: false
      },
      {
        assignmentId: insertedAssignments[3].id,
        studentId: 'student',
        submissionText: 'Hospital management database schema with 12 normalized tables...',
        grade: 110,
        feedback: 'Well-designed schema with proper normalization.',
        submittedAt: new Date('2025-02-27'),
        gradedAt: new Date('2025-03-02'),
        isLate: false
      }
    ];

    const insertedSubmissions = await db.insert(submissions).values(additionalSubmissions).returning();
    console.log(`✅ Added ${insertedSubmissions.length} additional submissions`);

    // Add more announcements for validation testing
    const additionalAnnouncements = [
      {
        courseId: insertedCourses[0].id,
        title: 'Framework Comparison Assignment Guidelines',
        content: 'Please review the updated guidelines for comparing React, Vue, and Angular frameworks...',
        isImportant: true,
        authorId: 'teacher'
      },
      {
        courseId: insertedCourses[0].id,
        title: 'Guest Lecture on Modern JavaScript',
        content: 'We have a special guest lecturer from Google speaking about modern JavaScript practices...',
        isImportant: false,
        authorId: 'teacher'
      },
      {
        courseId: insertedCourses[1].id,
        title: 'Database Performance Workshop',
        content: 'Optional workshop on database performance optimization techniques...',
        isImportant: false,
        authorId: 'teacher'
      },
      {
        courseId: insertedCourses[1].id,
        title: 'Final Project Requirements Updated',
        content: 'The final project requirements have been updated to include additional database security considerations...',
        isImportant: true,
        authorId: 'teacher'
      }
    ];

    const insertedAnnouncements = await db.insert(announcements).values(additionalAnnouncements).returning();
    console.log(`✅ Added ${insertedAnnouncements.length} additional announcements`);

    // Add more messages for comprehensive validation
    const additionalMessages = [
      {
        senderId: 'student',
        receiverId: 'teacher',
        courseId: insertedCourses[0].id,
        content: 'Hi Professor, I have a question about the React component library project. Should we include unit tests for all components?',
        isRead: false
      },
      {
        senderId: 'teacher',
        receiverId: 'student',
        courseId: insertedCourses[0].id,
        content: 'Yes, please include unit tests for all components. Focus on testing the component API and main functionality.',
        isRead: true
      },
      {
        senderId: 'student',
        receiverId: 'teacher',
        courseId: insertedCourses[1].id,
        content: 'Could you provide more details about the database normalization requirements for the hospital project?',
        isRead: false
      },
      {
        senderId: 'teacher',
        receiverId: 'student',
        courseId: insertedCourses[1].id,
        content: 'The schema should be in at least 3rd normal form. I\'ll post additional resources on the course page.',
        isRead: true
      }
    ];

    const insertedMessages = await db.insert(messages).values(additionalMessages).returning();
    console.log(`✅ Added ${insertedMessages.length} additional messages`);

    // Summary of seeded data
    console.log('\n🎯 Extended Data Seeding Summary:');
    console.log(`   📚 Total Courses: ${allCourses.length}`);
    console.log(`   📝 Additional Assignments: ${insertedAssignments.length}`);
    console.log(`   👥 Additional Enrollments: ${insertedEnrollments.length}`);
    console.log(`   📤 Additional Submissions: ${insertedSubmissions.length}`);
    console.log(`   📢 Additional Announcements: ${insertedAnnouncements.length}`);
    console.log(`   💬 Additional Messages: ${insertedMessages.length}`);
    
    console.log('\n✅ Course Update Validation Data Ready!');
    console.log('📊 The validation system can now analyze:');
    console.log('   - Multiple courses with different statuses');
    console.log('   - Complex assignment dependencies');
    console.log('   - Student enrollment impacts');
    console.log('   - Submission and grading effects');
    console.log('   - Communication cascades');
    
    return {
      courses: allCourses,
      assignments: insertedAssignments,
      enrollments: insertedEnrollments,
      submissions: insertedSubmissions,
      announcements: insertedAnnouncements,
      messages: insertedMessages
    };

  } catch (error) {
    console.error('❌ Error seeding extended data:', error);
    throw error;
  }
}

// Function to create comprehensive sample data for specific course validation scenarios
export async function createValidationScenarioData() {
  console.log('🔬 Creating specific validation scenario data...');
  
  try {
    // Get existing courses
    const existingCourses = await db.select().from(courses);
    
    if (existingCourses.length === 0) {
      console.log('⚠️ No courses found. Please run basic seed data first.');
      return;
    }

    // Create scenario: Course with many dependencies
    const mainCourse = existingCourses[0]; // Use first course for validation testing
    
    // Add time-sensitive assignments that would be affected by date changes
    const timeSensitiveAssignments = [
      {
        courseId: mainCourse.id,
        title: 'Mid-term Exam Preparation',
        description: 'Comprehensive review materials and practice questions',
        dueDate: new Date('2025-03-15'), // Will be affected by semester date changes
        maxPoints: 100,
        assignmentType: 'exam',
        isActive: true
      },
      {
        courseId: mainCourse.id,
        title: 'Final Project Proposal',
        description: 'Detailed proposal for your final project with timeline',
        dueDate: new Date('2025-04-01'), // Will be affected by semester date changes
        maxPoints: 50,
        assignmentType: 'project',
        isActive: true
      },
      {
        courseId: mainCourse.id,
        title: 'Peer Review Assignment',
        description: 'Review and provide feedback on classmates\' work',
        dueDate: new Date('2025-04-15'), // Will be affected by semester date changes
        maxPoints: 25,
        assignmentType: 'homework',
        isActive: true
      }
    ];

    const scenarioAssignments = await db.insert(assignments).values(timeSensitiveAssignments).returning();
    console.log(`✅ Created ${scenarioAssignments.length} time-sensitive assignments`);

    // Add multiple student enrollments to test notification cascade
    const multipleEnrollments = [
      {
        studentId: 'student',
        courseId: mainCourse.id,
        isActive: true
      }
    ];

    // Add submissions that would be affected by course changes
    const affectedSubmissions = scenarioAssignments.map(assignment => ({
      assignmentId: assignment.id,
      studentId: 'student',
      submissionText: `Submission for ${assignment.title} - detailed work completed according to requirements...`,
      grade: Math.floor(Math.random() * 20) + 80, // Random grade between 80-100
      feedback: `Good work on this assignment. ${assignment.title} shows understanding of key concepts.`,
      submittedAt: new Date(),
      gradedAt: new Date(),
      isLate: false
    }));

    const scenarioSubmissions = await db.insert(submissions).values(affectedSubmissions).returning();
    console.log(`✅ Created ${scenarioSubmissions.length} submissions that would be affected by course changes`);

    // Add announcements that reference course timing
    const timeRelatedAnnouncements = [
      {
        courseId: mainCourse.id,
        title: 'Important: Semester Schedule Update',
        content: 'Please note that our semester schedule may be updated. All assignment due dates will be adjusted accordingly.',
        isImportant: true,
        authorId: 'teacher'
      },
      {
        courseId: mainCourse.id,
        title: 'Final Exam Date Confirmation',
        content: 'Final exam will be held during the last week of the semester. Exact date to be confirmed.',
        isImportant: true,
        authorId: 'teacher'
      }
    ];

    const scenarioAnnouncements = await db.insert(announcements).values(timeRelatedAnnouncements).returning();
    console.log(`✅ Created ${scenarioAnnouncements.length} time-related announcements`);

    console.log('\n🎭 Validation Scenario Data Created!');
    console.log('📈 Course update validation will now detect:');
    console.log(`   - ${scenarioAssignments.length} assignments affected by date changes`);
    console.log(`   - ${scenarioSubmissions.length} submissions requiring adjustment`);
    console.log(`   - ${scenarioAnnouncements.length} announcements referencing course timing`);
    console.log(`   - Student enrollment notifications for schedule changes`);

    return {
      assignments: scenarioAssignments,
      submissions: scenarioSubmissions,
      announcements: scenarioAnnouncements
    };

  } catch (error) {
    console.error('❌ Error creating validation scenario data:', error);
    throw error;
  }
}

// Export functions for manual execution
export { seedExtendedData as default };