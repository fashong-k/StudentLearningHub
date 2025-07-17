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

// Analyze what will be deleted when a course is removed
export async function analyzeCourseDeletionImpact(courseId: number) {
  console.log(`🔍 Analyzing deletion impact for course ${courseId}...`);
  
  try {
    // Get the course details
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId));
    if (!course) {
      throw new Error(`Course with ID ${courseId} not found`);
    }
    
    // Count all related records that will be deleted
    const [assignmentCount] = await db
      .select({ count: assignments.id })
      .from(assignments)
      .where(eq(assignments.courseId, courseId));
    
    const [enrollmentCount] = await db
      .select({ count: enrollments.id })
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId));
    
    const [submissionCount] = await db
      .select({ count: submissions.id })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .where(eq(assignments.courseId, courseId));
    
    const [announcementCount] = await db
      .select({ count: announcements.id })
      .from(announcements)
      .where(eq(announcements.courseId, courseId));
    
    const [messageCount] = await db
      .select({ count: messages.id })
      .from(messages)
      .where(eq(messages.courseId, courseId));
    
    const impactAnalysis = {
      courseDetails: {
        id: course.id,
        title: course.title,
        courseCode: course.courseCode,
        teacherId: course.teacherId,
        semester: course.semester,
        year: course.year,
        isActive: course.isActive
      },
      cascadeEffects: {
        assignments: assignmentCount || 0,
        enrollments: enrollmentCount || 0,
        submissions: submissionCount || 0,
        announcements: announcementCount || 0,
        messages: messageCount || 0
      },
      additionalTables: {
        // These will also be deleted due to CASCADE DELETE constraints
        calendar_events: 'All course calendar events',
        quizzes: 'All quizzes and quiz questions',
        quiz_attempts: 'All student quiz attempts',
        grade_book: 'All grade book entries for this course',
        course_instructors: 'All instructor assignments',
        course_materials: 'All course materials and files',
        course_schedules: 'All course schedules',
        assignment_rubrics: 'All assignment rubrics',
        attendance: 'All attendance records',
        file_uploads: 'All course-related file uploads',
        notifications: 'All course notifications',
        system_logs: 'Some system logs (user references set to NULL)'
      }
    };
    
    console.log('📊 Course Deletion Impact Analysis:');
    console.log(`   📚 Course: ${course.title} (${course.courseCode})`);
    console.log(`   📝 Assignments to delete: ${impactAnalysis.cascadeEffects.assignments}`);
    console.log(`   👥 Enrollments to delete: ${impactAnalysis.cascadeEffects.enrollments}`);
    console.log(`   📤 Submissions to delete: ${impactAnalysis.cascadeEffects.submissions}`);
    console.log(`   📢 Announcements to delete: ${impactAnalysis.cascadeEffects.announcements}`);
    console.log(`   💬 Messages to delete: ${impactAnalysis.cascadeEffects.messages}`);
    console.log(`   🗂️  Additional tables affected: ${Object.keys(impactAnalysis.additionalTables).length}`);
    
    return impactAnalysis;
    
  } catch (error) {
    console.error('❌ Error analyzing course deletion impact:', error);
    throw error;
  }
}

// Simulate course deletion (for demonstration purposes)
export async function simulateCourseDeletion(courseId: number) {
  console.log(`🎭 Simulating course deletion for course ${courseId}...`);
  
  try {
    // First, analyze the impact
    const impact = await analyzeCourseDeletionImpact(courseId);
    
    console.log('\n🔄 If this course were deleted, here\'s what would happen:');
    console.log('   1. Course record removed from courses table');
    console.log('   2. CASCADE DELETE automatically removes:');
    console.log(`      - ${impact.cascadeEffects.assignments} assignments`);
    console.log(`      - ${impact.cascadeEffects.enrollments} student enrollments`);
    console.log(`      - ${impact.cascadeEffects.submissions} submissions`);
    console.log(`      - ${impact.cascadeEffects.announcements} announcements`);
    console.log(`      - ${impact.cascadeEffects.messages} messages`);
    console.log('      - All calendar events, quizzes, grade book entries');
    console.log('      - All course materials, schedules, and notifications');
    console.log('   3. User references in system_logs set to NULL');
    console.log('   4. All file uploads for this course removed');
    
    const totalRecords = Object.values(impact.cascadeEffects).reduce((sum, count) => sum + count, 0);
    console.log(`\n📊 Total records that would be deleted: ${totalRecords} (plus extended table data)`);
    
    return impact;
    
  } catch (error) {
    console.error('❌ Error simulating course deletion:', error);
    throw error;
  }
}