import { db } from "./db-drizzle";
import { 
  enrollments, 
  submissions, 
  gradeBook, 
  attendance, 
  quizAttempts, 
  discussions, 
  discussionReplies, 
  messages, 
  notifications, 
  plagiarismDatabase,
  assignments,
  quizzes
} from "@shared/schema";
import { and, eq, or } from "drizzle-orm";

export interface WithdrawalImpactAnalysis {
  enrollment: boolean;
  submissions: number;
  grades: number;
  attendance: number;
  quizAttempts: number;
  discussions: number;
  discussionReplies: number;
  messages: number;
  notifications: number;
  plagiarismRecords: number;
}

export interface WithdrawalResult {
  success: boolean;
  impactAnalysis: WithdrawalImpactAnalysis;
  warnings: string[];
  preservedRecords: string[];
}

export class CourseWithdrawalManager {
  
  /**
   * Analyze the impact of withdrawing a student from a course
   */
  async analyzeWithdrawalImpact(studentId: string, courseId: number): Promise<WithdrawalImpactAnalysis> {
    const [
      enrollmentExists,
      submissionsCount,
      gradesCount,
      attendanceCount,
      quizAttemptsCount,
      discussionsCount,
      discussionRepliesCount,
      messagesCount,
      notificationsCount,
      plagiarismCount
    ] = await Promise.all([
      // Check if enrollment exists
      db.select().from(enrollments)
        .where(and(eq(enrollments.studentId, studentId), eq(enrollments.courseId, courseId)))
        .then(result => result.length > 0),
      
      // Count submissions
      db.select().from(submissions)
        .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
        .where(and(eq(submissions.studentId, studentId), eq(assignments.courseId, courseId)))
        .then(result => result.length),
      
      // Count grade book entries
      db.select().from(gradeBook)
        .where(and(eq(gradeBook.studentId, studentId), eq(gradeBook.courseId, courseId)))
        .then(result => result.length),
      
      // Count attendance records
      db.select().from(attendance)
        .where(and(eq(attendance.studentId, studentId), eq(attendance.courseId, courseId)))
        .then(result => result.length),
      
      // Count quiz attempts
      db.select().from(quizAttempts)
        .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
        .where(and(eq(quizAttempts.studentId, studentId), eq(quizzes.courseId, courseId)))
        .then(result => result.length),
      
      // Count discussions
      db.select().from(discussions)
        .where(and(eq(discussions.authorId, studentId), eq(discussions.courseId, courseId)))
        .then(result => result.length),
      
      // Count discussion replies
      db.select().from(discussionReplies)
        .innerJoin(discussions, eq(discussionReplies.discussionId, discussions.id))
        .where(and(eq(discussionReplies.authorId, studentId), eq(discussions.courseId, courseId)))
        .then(result => result.length),
      
      // Count messages
      db.select().from(messages)
        .where(and(
          or(eq(messages.senderId, studentId), eq(messages.receiverId, studentId)),
          eq(messages.courseId, courseId)
        ))
        .then(result => result.length),
      
      // Count notifications
      db.select().from(notifications)
        .where(and(eq(notifications.recipientId, studentId), eq(notifications.courseId, courseId)))
        .then(result => result.length),
      
      // Count plagiarism records
      db.select().from(plagiarismDatabase)
        .where(and(eq(plagiarismDatabase.studentId, studentId), eq(plagiarismDatabase.courseId, courseId)))
        .then(result => result.length)
    ]);

    return {
      enrollment: enrollmentExists,
      submissions: submissionsCount,
      grades: gradesCount,
      attendance: attendanceCount,
      quizAttempts: quizAttemptsCount,
      discussions: discussionsCount,
      discussionReplies: discussionRepliesCount,
      messages: messagesCount,
      notifications: notificationsCount,
      plagiarismRecords: plagiarismCount
    };
  }

  /**
   * Perform soft withdrawal (recommended approach)
   * Marks enrollment as inactive but preserves all academic records
   */
  async performSoftWithdrawal(studentId: string, courseId: number): Promise<WithdrawalResult> {
    const impact = await this.analyzeWithdrawalImpact(studentId, courseId);
    
    if (!impact.enrollment) {
      return {
        success: false,
        impactAnalysis: impact,
        warnings: ["Student is not enrolled in this course"],
        preservedRecords: []
      };
    }

    try {
      // Mark enrollment as inactive instead of deleting
      await db
        .update(enrollments)
        .set({ isActive: false })
        .where(and(eq(enrollments.studentId, studentId), eq(enrollments.courseId, courseId)));

      // Mark notifications as inactive (optional)
      if (impact.notifications > 0) {
        await db
          .update(notifications)
          .set({ isActive: false })
          .where(and(eq(notifications.recipientId, studentId), eq(notifications.courseId, courseId)));
      }

      const warnings = [];
      const preservedRecords = [];

      if (impact.submissions > 0) {
        warnings.push(`${impact.submissions} assignment submissions will be preserved for academic records`);
        preservedRecords.push(`${impact.submissions} submissions`);
      }

      if (impact.grades > 0) {
        warnings.push(`${impact.grades} grade entries will be preserved for transcript purposes`);
        preservedRecords.push(`${impact.grades} grades`);
      }

      if (impact.attendance > 0) {
        warnings.push(`${impact.attendance} attendance records will be preserved`);
        preservedRecords.push(`${impact.attendance} attendance records`);
      }

      if (impact.discussions > 0 || impact.discussionReplies > 0) {
        warnings.push(`Discussion posts and replies will remain visible for course continuity`);
        preservedRecords.push(`${impact.discussions} discussions, ${impact.discussionReplies} replies`);
      }

      return {
        success: true,
        impactAnalysis: impact,
        warnings,
        preservedRecords
      };

    } catch (error) {
      console.error("Error during soft withdrawal:", error);
      return {
        success: false,
        impactAnalysis: impact,
        warnings: ["Database error occurred during withdrawal"],
        preservedRecords: []
      };
    }
  }

  /**
   * Perform hard withdrawal (complete data removal)
   * WARNING: This permanently deletes all student-course data
   */
  async performHardWithdrawal(studentId: string, courseId: number): Promise<WithdrawalResult> {
    const impact = await this.analyzeWithdrawalImpact(studentId, courseId);
    
    if (!impact.enrollment) {
      return {
        success: false,
        impactAnalysis: impact,
        warnings: ["Student is not enrolled in this course"],
        preservedRecords: []
      };
    }

    try {
      // Delete in reverse dependency order to avoid foreign key constraints
      
      // 1. Delete plagiarism records
      await db
        .delete(plagiarismDatabase)
        .where(and(eq(plagiarismDatabase.studentId, studentId), eq(plagiarismDatabase.courseId, courseId)));

      // 2. Delete notifications
      await db
        .delete(notifications)
        .where(and(eq(notifications.recipientId, studentId), eq(notifications.courseId, courseId)));

      // 3. Delete quiz attempts
      await db
        .delete(quizAttempts)
        .where(and(eq(quizAttempts.studentId, studentId)));

      // 4. Delete discussion replies
      await db
        .delete(discussionReplies)
        .where(and(eq(discussionReplies.authorId, studentId)));

      // 5. Delete discussions
      await db
        .delete(discussions)
        .where(and(eq(discussions.authorId, studentId), eq(discussions.courseId, courseId)));

      // 6. Delete attendance records
      await db
        .delete(attendance)
        .where(and(eq(attendance.studentId, studentId), eq(attendance.courseId, courseId)));

      // 7. Delete grade book entries
      await db
        .delete(gradeBook)
        .where(and(eq(gradeBook.studentId, studentId), eq(gradeBook.courseId, courseId)));

      // 8. Delete submissions
      await db
        .delete(submissions)
        .where(and(eq(submissions.studentId, studentId)));

      // 9. Delete course messages
      await db
        .delete(messages)
        .where(and(
          or(eq(messages.senderId, studentId), eq(messages.receiverId, studentId)),
          eq(messages.courseId, courseId)
        ));

      // 10. Finally, delete enrollment
      await db
        .delete(enrollments)
        .where(and(eq(enrollments.studentId, studentId), eq(enrollments.courseId, courseId)));

      return {
        success: true,
        impactAnalysis: impact,
        warnings: [
          "All student data for this course has been permanently deleted",
          "This action cannot be undone",
          "Academic records and transcript data has been lost"
        ],
        preservedRecords: []
      };

    } catch (error) {
      console.error("Error during hard withdrawal:", error);
      return {
        success: false,
        impactAnalysis: impact,
        warnings: ["Database error occurred during withdrawal"],
        preservedRecords: []
      };
    }
  }

  /**
   * Re-enroll a student (reactivate soft-deleted enrollment)
   */
  async reEnrollStudent(studentId: string, courseId: number): Promise<boolean> {
    try {
      const result = await db
        .update(enrollments)
        .set({ isActive: true })
        .where(and(eq(enrollments.studentId, studentId), eq(enrollments.courseId, courseId)));

      // Also reactivate notifications
      await db
        .update(notifications)
        .set({ isActive: true })
        .where(and(eq(notifications.recipientId, studentId), eq(notifications.courseId, courseId)));

      return result.rowCount > 0;
    } catch (error) {
      console.error("Error during re-enrollment:", error);
      return false;
    }
  }
}

export const courseWithdrawalManager = new CourseWithdrawalManager();