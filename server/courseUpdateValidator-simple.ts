import { db } from "./db-drizzle";
import { courses, assignments, enrollments, announcements, submissions } from "@shared/schema";
import { eq, and, count } from "drizzle-orm";

export interface CourseUpdateValidation {
  canUpdate: boolean;
  warnings: string[];
  errors: string[];
  affectedRecords: {
    enrollments: number;
    assignments: number;
    announcements: number;
    submissions: number;
  };
}

export async function validateCourseUpdate(
  courseId: number,
  updates: any,
  currentCourse: any
): Promise<CourseUpdateValidation> {
  const warnings: string[] = [];
  const errors: string[] = [];
  let canUpdate = true;

  try {
    // Get affected record counts
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

    const [submissionCount] = await db
      .select({ count: count() })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .where(eq(assignments.courseId, courseId));

    const affectedRecords = {
      enrollments: enrollmentCount.count,
      assignments: assignmentCount.count,
      announcements: announcementCount.count,
      submissions: submissionCount.count,
    };

    // Validate course code changes
    if (updates.courseCode && updates.courseCode !== currentCourse.courseCode) {
      if (affectedRecords.enrollments > 0) {
        warnings.push(
          `Course code change will affect ${affectedRecords.enrollments} enrolled students. Students may need to update bookmarks and references.`
        );
      }
      if (affectedRecords.assignments > 0) {
        warnings.push(
          `Course code change will affect ${affectedRecords.assignments} assignments. Assignment links may need to be updated.`
        );
      }
    }

    // Validate date changes
    if (updates.startDate !== currentCourse.startDate || updates.endDate !== currentCourse.endDate) {
      if (affectedRecords.assignments > 0) {
        warnings.push(
          `Date changes will affect ${affectedRecords.assignments} assignments. Assignment due dates may need to be adjusted.`
        );
      }
      if (affectedRecords.enrollments > 0) {
        warnings.push(
          `Date changes will affect ${affectedRecords.enrollments} enrolled students. They should be notified of the schedule change.`
        );
      }
    }

    // Validate grading scheme changes
    if (updates.gradingScheme && updates.gradingScheme !== currentCourse.gradingScheme) {
      if (affectedRecords.submissions > 0) {
        warnings.push(
          `Grading scheme change will affect ${affectedRecords.submissions} existing submissions. Grades may need to be recalculated.`
        );
      }
    }

    // Validate semester changes
    if (updates.semester && updates.semester !== currentCourse.semester) {
      if (affectedRecords.enrollments > 0) {
        warnings.push(
          `Semester change will affect ${affectedRecords.enrollments} enrolled students. This may impact their academic planning.`
        );
      }
    }

    return {
      canUpdate,
      warnings,
      errors,
      affectedRecords,
    };
  } catch (error) {
    console.error("Validation error:", error);
    return {
      canUpdate: false,
      warnings: [],
      errors: [error instanceof Error ? error.message : "Unknown validation error"],
      affectedRecords: {
        enrollments: 0,
        assignments: 0,
        announcements: 0,
        submissions: 0,
      },
    };
  }
}