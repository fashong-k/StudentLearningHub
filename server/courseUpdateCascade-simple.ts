import { db } from "./db-drizzle";
import { courses, assignments, announcements } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface CascadeUpdateResult {
  success: boolean;
  updatedRecords: {
    assignments: number;
    announcements: number;
  };
  errors: string[];
}

export async function applyCourseUpdateCascade(
  courseId: number,
  updates: any
): Promise<CascadeUpdateResult> {
  const errors: string[] = [];
  let updatedAssignments = 0;
  let updatedAnnouncements = 0;

  try {
    // Update assignments if date changes affect them
    if (updates.startDate || updates.endDate) {
      const assignmentUpdateResult = await db
        .update(assignments)
        .set({ updatedAt: new Date() })
        .where(and(eq(assignments.courseId, courseId), eq(assignments.isActive, true)));
      
      updatedAssignments = assignmentUpdateResult.rowCount || 0;
    }

    // Update announcements to reflect course changes
    if (updates.title || updates.description || updates.courseCode) {
      const announcementUpdateResult = await db
        .update(announcements)
        .set({ updatedAt: new Date() })
        .where(eq(announcements.courseId, courseId));
      
      updatedAnnouncements = announcementUpdateResult.rowCount || 0;
    }

    return {
      success: true,
      updatedRecords: {
        assignments: updatedAssignments,
        announcements: updatedAnnouncements,
      },
      errors: [],
    };
  } catch (error) {
    console.error("Cascade update failed:", error);
    return {
      success: false,
      updatedRecords: {
        assignments: 0,
        announcements: 0,
      },
      errors: [error instanceof Error ? error.message : "Unknown error occurred"],
    };
  }
}