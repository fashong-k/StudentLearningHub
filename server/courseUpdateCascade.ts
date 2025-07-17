import { db } from "./db-drizzle";
import { courses, assignments, calendarEvents, announcements, systemLogs } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface CascadeUpdateResult {
  success: boolean;
  updatedRecords: {
    assignments: number;
    calendarEvents: number;
    announcements: number;
  };
  errors: string[];
}

export class CourseUpdateCascade {
  async performCascadeUpdates(
    courseId: number,
    updates: any,
    currentCourse: any,
    userId: string
  ): Promise<CascadeUpdateResult> {
    const errors: string[] = [];
    let updatedAssignments = 0;
    let updatedCalendarEvents = 0;
    let updatedAnnouncements = 0;

    try {
      // Start transaction
      await db.transaction(async (tx) => {
        // Update the course first
        await tx.update(courses).set({
          ...updates,
          updatedAt: new Date(),
        }).where(eq(courses.id, courseId));

        // Log the course update
        await this.logCourseUpdate(courseId, updates, currentCourse, userId);

        // Cascade date changes to assignments
        if (this.hasDateChanges(updates, currentCourse)) {
          updatedAssignments = await this.updateAssignmentDates(courseId, updates, currentCourse);
          updatedCalendarEvents = await this.updateCalendarEvents(courseId, updates, currentCourse);
        }

        // Update announcement relevance if course scope changes
        if (updates.title || updates.description || updates.courseCode) {
          updatedAnnouncements = await this.updateAnnouncementContext(courseId, updates);
        }

        // Send notifications to enrolled students about significant changes
        await this.sendChangeNotifications(courseId, updates, currentCourse, userId);
      });

      return {
        success: true,
        updatedRecords: {
          assignments: updatedAssignments,
          calendarEvents: updatedCalendarEvents,
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
          calendarEvents: 0,
          announcements: 0,
        },
        errors: [error instanceof Error ? error.message : "Unknown error occurred"],
      };
    }
  }

  private async updateAssignmentDates(
    courseId: number,
    updates: any,
    currentCourse: any
  ): Promise<number> {
    // Calculate date shift if course dates changed
    let dateShift = 0;
    
    if (updates.startDate && currentCourse.startDate) {
      const newStart = new Date(updates.startDate);
      const oldStart = new Date(currentCourse.startDate);
      dateShift = newStart.getTime() - oldStart.getTime();
    }

    if (dateShift !== 0) {
      // Get all assignments for this course
      const courseAssignments = await db
        .select()
        .from(assignments)
        .where(and(eq(assignments.courseId, courseId), eq(assignments.isActive, true)));

      // Update each assignment's due date
      for (const assignment of courseAssignments) {
        if (assignment.dueDate) {
          const newDueDate = new Date(assignment.dueDate.getTime() + dateShift);
          await db
            .update(assignments)
            .set({ 
              dueDate: newDueDate,
              updatedAt: new Date(),
            })
            .where(eq(assignments.id, assignment.id));
        }
      }

      return courseAssignments.length;
    }

    return 0;
  }

  private async updateCalendarEvents(
    courseId: number,
    updates: any,
    currentCourse: any
  ): Promise<number> {
    // Calculate date shift for calendar events
    let dateShift = 0;
    
    if (updates.startDate && currentCourse.startDate) {
      const newStart = new Date(updates.startDate);
      const oldStart = new Date(currentCourse.startDate);
      dateShift = newStart.getTime() - oldStart.getTime();
    }

    if (dateShift !== 0) {
      // Get all calendar events for this course
      const courseEvents = await db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.courseId, courseId));

      // Update each event's dates
      for (const event of courseEvents) {
        const newStartDate = new Date(event.startDate.getTime() + dateShift);
        const newEndDate = new Date(event.endDate.getTime() + dateShift);
        
        await db
          .update(calendarEvents)
          .set({
            startDate: newStartDate,
            endDate: newEndDate,
            updatedAt: new Date(),
          })
          .where(eq(calendarEvents.id, event.id));
      }

      return courseEvents.length;
    }

    return 0;
  }

  private async updateAnnouncementContext(
    courseId: number,
    updates: any
  ): Promise<number> {
    // This could be expanded to update announcement content
    // For now, just update the timestamp to indicate changes
    const result = await db
      .update(announcements)
      .set({ updatedAt: new Date() })
      .where(eq(announcements.courseId, courseId));

    return 1; // Simplified count
  }

  private async sendChangeNotifications(
    courseId: number,
    updates: any,
    currentCourse: any,
    userId: string
  ): Promise<void> {
    // Create notification content based on changes
    const changes: string[] = [];
    
    if (updates.title && updates.title !== currentCourse.title) {
      changes.push(`Course title changed to "${updates.title}"`);
    }
    
    if (updates.courseCode && updates.courseCode !== currentCourse.courseCode) {
      changes.push(`Course code changed to "${updates.courseCode}"`);
    }
    
    if (this.hasDateChanges(updates, currentCourse)) {
      changes.push("Course dates have been updated");
    }
    
    if (updates.gradingScheme && updates.gradingScheme !== currentCourse.gradingScheme) {
      changes.push(`Grading scheme changed to "${updates.gradingScheme}"`);
    }

    if (changes.length > 0) {
      // In a real implementation, this would send notifications to enrolled students
      // For now, we'll just log the notification intent
      console.log(`Notifications would be sent for course ${courseId}:`, changes);
    }
  }

  private async logCourseUpdate(
    courseId: number,
    updates: any,
    currentCourse: any,
    userId: string
  ): Promise<void> {
    const changedFields = Object.keys(updates).filter(
      key => updates[key] !== currentCourse[key]
    );

    await db.insert(systemLogs).values({
      userId,
      action: "update",
      resourceType: "course",
      resourceId: courseId.toString(),
      details: {
        changedFields,
        previousValues: changedFields.reduce((acc, field) => {
          acc[field] = currentCourse[field];
          return acc;
        }, {} as any),
        newValues: changedFields.reduce((acc, field) => {
          acc[field] = updates[field];
          return acc;
        }, {} as any),
      },
    });
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
}

export const courseUpdateCascade = new CourseUpdateCascade();