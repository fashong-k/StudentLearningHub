import { db } from "./db-drizzle";
import { courses, assignments, enrollments, announcements, calendarEvents, quizzes, gradeBook } from "@shared/schema";
import { eq, and, gte, lte, count } from "drizzle-orm";

export interface CourseUpdateValidation {
  canUpdate: boolean;
  warnings: string[];
  errors: string[];
  affectedRecords: {
    enrollments: number;
    assignments: number;
    announcements: number;
    calendarEvents: number;
    quizzes: number;
    grades: number;
  };
}

export interface CourseUpdateImpact {
  dateChanges: boolean;
  gradingSchemeChange: boolean;
  teacherChange: boolean;
  codeChange: boolean;
  affectedAssignments: number;
  affectedEvents: number;
}

export class CourseUpdateValidator {
  async validateCourseUpdate(
    courseId: number,
    updates: any,
    currentCourse: any
  ): Promise<CourseUpdateValidation> {
    const warnings: string[] = [];
    const errors: string[] = [];
    let canUpdate = true;

    // Get affected record counts
    const affectedRecords = await this.getAffectedRecordCounts(courseId);

    // Validate course code changes
    if (updates.courseCode && updates.courseCode !== currentCourse.courseCode) {
      if (affectedRecords.enrollments > 0) {
        warnings.push(
          `Course code change will affect ${affectedRecords.enrollments} enrolled students. Students may need to update bookmarks and references.`
        );
      }
      
      // Check if new course code already exists
      const existingCourse = await db.select().from(courses).where(eq(courses.courseCode, updates.courseCode));
      if (existingCourse.length > 0) {
        errors.push("Course code already exists. Please choose a different code.");
        canUpdate = false;
      }
    }

    // Validate date changes
    if (this.hasDateChanges(updates, currentCourse)) {
      if (affectedRecords.assignments > 0) {
        warnings.push(
          `Date changes will affect ${affectedRecords.assignments} assignments. Assignment due dates may need adjustment.`
        );
      }
      
      if (affectedRecords.calendarEvents > 0) {
        warnings.push(
          `Date changes will affect ${affectedRecords.calendarEvents} calendar events. Events will be automatically updated.`
        );
      }

      // Validate date logic
      if (updates.startDate && updates.endDate) {
        const startDate = new Date(updates.startDate);
        const endDate = new Date(updates.endDate);
        
        if (startDate >= endDate) {
          errors.push("Start date must be before end date.");
          canUpdate = false;
        }
        
        if (startDate < new Date()) {
          errors.push("Start date cannot be in the past.");
          canUpdate = false;
        }
      }
    }

    // Validate grading scheme changes
    if (updates.gradingScheme && updates.gradingScheme !== currentCourse.gradingScheme) {
      if (affectedRecords.grades > 0) {
        warnings.push(
          `Grading scheme change will affect ${affectedRecords.grades} existing grades. Grade calculations may need review.`
        );
      }
    }

    // Validate teacher changes
    if (updates.teacherId && updates.teacherId !== currentCourse.teacherId) {
      warnings.push(
        "Teacher change will transfer course ownership and may affect permissions for assignments and grading."
      );
    }

    // Check for active assignments with upcoming due dates
    const activeAssignments = await this.getActiveAssignments(courseId);
    if (activeAssignments.length > 0 && this.hasDateChanges(updates, currentCourse)) {
      warnings.push(
        `${activeAssignments.length} assignments have upcoming due dates. Consider updating assignment deadlines accordingly.`
      );
    }

    return {
      canUpdate,
      warnings,
      errors,
      affectedRecords,
    };
  }

  private async getAffectedRecordCounts(courseId: number) {
    const [enrollmentCount] = await db
      .select({ count: count() })
      .from(enrollments)
      .where(and(eq(enrollments.courseId, courseId), eq(enrollments.isActive, true)));

    const [assignmentCount] = await db
      .select({ count: count() })
      .from(assignments)
      .where(and(eq(assignments.courseId, courseId), eq(assignments.isActive, true)));

    const [announcementCount] = await db
      .select({ count: count() })
      .from(announcements)
      .where(eq(announcements.courseId, courseId));

    const [calendarEventCount] = await db
      .select({ count: count() })
      .from(calendarEvents)
      .where(eq(calendarEvents.courseId, courseId));

    const [quizCount] = await db
      .select({ count: count() })
      .from(quizzes)
      .where(and(eq(quizzes.courseId, courseId), eq(quizzes.isActive, true)));

    const [gradeCount] = await db
      .select({ count: count() })
      .from(gradeBook)
      .where(eq(gradeBook.courseId, courseId));

    return {
      enrollments: enrollmentCount.count,
      assignments: assignmentCount.count,
      announcements: announcementCount.count,
      calendarEvents: calendarEventCount.count,
      quizzes: quizCount.count,
      grades: gradeCount.count,
    };
  }

  private hasDateChanges(updates: any, currentCourse: any): boolean {
    return (
      (updates.startDate && updates.startDate !== currentCourse.startDate) ||
      (updates.endDate && updates.endDate !== currentCourse.endDate) ||
      (updates.semester && updates.semester !== currentCourse.semester) ||
      (updates.year && updates.year !== currentCourse.year) ||
      (updates.termType && updates.termType !== currentCourse.termType)
    );
  }

  private async getActiveAssignments(courseId: number) {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return await db
      .select()
      .from(assignments)
      .where(
        and(
          eq(assignments.courseId, courseId),
          eq(assignments.isActive, true),
          gte(assignments.dueDate, now),
          lte(assignments.dueDate, oneWeekFromNow)
        )
      );
  }

  async getUpdateImpact(courseId: number, updates: any, currentCourse: any): Promise<CourseUpdateImpact> {
    const dateChanges = this.hasDateChanges(updates, currentCourse);
    const gradingSchemeChange = updates.gradingScheme && updates.gradingScheme !== currentCourse.gradingScheme;
    const teacherChange = updates.teacherId && updates.teacherId !== currentCourse.teacherId;
    const codeChange = updates.courseCode && updates.courseCode !== currentCourse.courseCode;

    let affectedAssignments = 0;
    let affectedEvents = 0;

    if (dateChanges) {
      const [assignmentCount] = await db
        .select({ count: count() })
        .from(assignments)
        .where(and(eq(assignments.courseId, courseId), eq(assignments.isActive, true)));

      const [eventCount] = await db
        .select({ count: count() })
        .from(calendarEvents)
        .where(eq(calendarEvents.courseId, courseId));

      affectedAssignments = assignmentCount.count;
      affectedEvents = eventCount.count;
    }

    return {
      dateChanges,
      gradingSchemeChange,
      teacherChange,
      codeChange,
      affectedAssignments,
      affectedEvents,
    };
  }
}

export const courseUpdateValidator = new CourseUpdateValidator();