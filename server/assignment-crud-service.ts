import { z } from 'zod';
import { db } from './db-drizzle';
import { assignments, courses, enrollments, submissions, users } from '../shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

// Enhanced validation schemas
export const assignmentValidationSchema = z.object({
  courseId: z.number().positive("Course ID must be positive"),
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().optional(),
  dueDate: z.coerce.date().refine(date => date > new Date(), "Due date must be in the future"),
  maxPoints: z.number().positive("Max points must be positive").max(1000, "Max points cannot exceed 1000"),
  assignmentType: z.enum(["homework", "quiz", "exam", "project", "lab"]).default("homework"),
  isActive: z.boolean().default(true),
});

export const createAssignmentSchema = assignmentValidationSchema;
export const updateAssignmentSchema = assignmentValidationSchema.partial();

// Types
export interface AssignmentFilters {
  isActive?: boolean;
  assignmentType?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
}

export interface PermissionResult {
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  reason?: string;
}

export interface AssignmentImpactAnalysis {
  submissionCount: number;
  studentsAffected: number;
  gradeRecalculationRequired: boolean;
  notificationRequired: boolean;
}

// Main Assignment Service Class
export class AssignmentCRUDService {
  
  // READ OPERATIONS
  
  async getAssignments(courseId: number, filters?: AssignmentFilters): Promise<any[]> {
    try {
      let query = db
        .select({
          id: assignments.id,
          courseId: assignments.courseId,
          title: assignments.title,
          description: assignments.description,
          dueDate: assignments.dueDate,
          maxPoints: assignments.maxPoints,
          assignmentType: assignments.assignmentType,
          isActive: assignments.isActive,
          createdAt: assignments.createdAt,
          updatedAt: assignments.updatedAt,
          courseTitle: courses.title,
          courseCode: courses.courseCode,
        })
        .from(assignments)
        .innerJoin(courses, eq(assignments.courseId, courses.id))
        .where(eq(assignments.courseId, courseId));

      // Apply filters
      if (filters?.isActive !== undefined) {
        query = query.where(and(
          eq(assignments.courseId, courseId),
          eq(assignments.isActive, filters.isActive)
        ));
      }

      const result = await query.orderBy(desc(assignments.dueDate));
      
      console.log(`✅ Retrieved ${result.length} assignments for course ${courseId}`);
      return result;
    } catch (error) {
      console.error('❌ Error fetching assignments:', error);
      throw new Error('Failed to fetch assignments');
    }
  }

  async getAssignmentById(id: number, includeRelations = true): Promise<any | null> {
    try {
      if (includeRelations) {
        const result = await db
          .select({
            id: assignments.id,
            courseId: assignments.courseId,
            title: assignments.title,
            description: assignments.description,
            dueDate: assignments.dueDate,
            maxPoints: assignments.maxPoints,
            assignmentType: assignments.assignmentType,
            isActive: assignments.isActive,
            createdAt: assignments.createdAt,
            updatedAt: assignments.updatedAt,
            courseTitle: courses.title,
            courseCode: courses.courseCode,
            teacherId: courses.teacherId,
          })
          .from(assignments)
          .innerJoin(courses, eq(assignments.courseId, courses.id))
          .where(eq(assignments.id, id))
          .limit(1);

        return result[0] || null;
      } else {
        const result = await db
          .select()
          .from(assignments)
          .where(eq(assignments.id, id))
          .limit(1);

        return result[0] || null;
      }
    } catch (error) {
      console.error('❌ Error fetching assignment by ID:', error);
      throw new Error('Failed to fetch assignment');
    }
  }

  async getAssignmentsByTeacher(teacherId: string): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: assignments.id,
          courseId: assignments.courseId,
          title: assignments.title,
          description: assignments.description,
          dueDate: assignments.dueDate,
          maxPoints: assignments.maxPoints,
          assignmentType: assignments.assignmentType,
          isActive: assignments.isActive,
          createdAt: assignments.createdAt,
          updatedAt: assignments.updatedAt,
          courseTitle: courses.title,
          courseCode: courses.courseCode,
        })
        .from(assignments)
        .innerJoin(courses, eq(assignments.courseId, courses.id))
        .where(eq(courses.teacherId, teacherId))
        .orderBy(desc(assignments.createdAt));

      console.log(`✅ Retrieved ${result.length} assignments for teacher ${teacherId}`);
      return result;
    } catch (error) {
      console.error('❌ Error fetching teacher assignments:', error);
      throw new Error('Failed to fetch teacher assignments');
    }
  }

  // WRITE OPERATIONS

  async createAssignment(data: z.infer<typeof createAssignmentSchema>, userId: string): Promise<any> {
    try {
      // Validate input data
      const validatedData = createAssignmentSchema.parse(data);
      
      // Check permissions
      const permissionCheck = await this.checkCoursePermissions(validatedData.courseId, userId);
      if (!permissionCheck.canUpdate) {
        throw new Error('Permission denied: Cannot create assignments for this course');
      }

      // Pre-creation validation
      await this.validateAssignmentCreation(validatedData);

      // Create assignment with transaction
      const [newAssignment] = await db
        .insert(assignments)
        .values({
          ...validatedData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Log audit trail
      await this.logAssignmentOperation('CREATE', newAssignment.id, userId, null, newAssignment);

      console.log(`✅ Created assignment ${newAssignment.id} for course ${validatedData.courseId}`);
      return newAssignment;
    } catch (error) {
      console.error('❌ Error creating assignment:', error);
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  async updateAssignment(id: number, data: z.infer<typeof updateAssignmentSchema>, userId: string): Promise<any> {
    try {
      // Get existing assignment
      const existingAssignment = await this.getAssignmentById(id, true);
      if (!existingAssignment) {
        throw new Error('Assignment not found');
      }

      // Validate input data
      const validatedData = updateAssignmentSchema.parse(data);
      
      // Check permissions
      const permissionCheck = await this.checkAssignmentPermissions(id, userId);
      if (!permissionCheck.canUpdate) {
        throw new Error('Permission denied: Cannot update this assignment');
      }

      // Pre-update validation
      const validationResult = await this.validateAssignmentUpdate(id, validatedData);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
      }

      // Analyze impact of changes
      const impactAnalysis = await this.analyzeUpdateImpact(id, validatedData);

      // Update assignment with transaction
      const [updatedAssignment] = await db
        .update(assignments)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(assignments.id, id))
        .returning();

      // Handle side effects (notifications, grade recalculations)
      await this.handleUpdateSideEffects(id, impactAnalysis);

      // Log audit trail
      await this.logAssignmentOperation('UPDATE', id, userId, existingAssignment, updatedAssignment);

      console.log(`✅ Updated assignment ${id} with impact: ${JSON.stringify(impactAnalysis)}`);
      return updatedAssignment;
    } catch (error) {
      console.error('❌ Error updating assignment:', error);
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  async deleteAssignment(id: number, userId: string, softDelete = true): Promise<boolean> {
    try {
      // Get existing assignment
      const existingAssignment = await this.getAssignmentById(id, true);
      if (!existingAssignment) {
        throw new Error('Assignment not found');
      }

      // Check permissions
      const permissionCheck = await this.checkAssignmentPermissions(id, userId);
      if (!permissionCheck.canDelete) {
        throw new Error('Permission denied: Cannot delete this assignment');
      }

      // Pre-deletion validation
      await this.validateAssignmentDeletion(id);

      let success = false;
      if (softDelete) {
        // Soft delete (mark as inactive)
        const [updatedAssignment] = await db
          .update(assignments)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(assignments.id, id))
          .returning();
        success = !!updatedAssignment;
      } else {
        // Hard delete (remove from database)
        const result = await db
          .delete(assignments)
          .where(eq(assignments.id, id));
        success = result.rowCount > 0;
      }

      if (success) {
        // Log audit trail
        await this.logAssignmentOperation('DELETE', id, userId, existingAssignment, null);
        console.log(`✅ ${softDelete ? 'Soft' : 'Hard'} deleted assignment ${id}`);
      }

      return success;
    } catch (error) {
      console.error('❌ Error deleting assignment:', error);
      throw error;
    }
  }

  // VALIDATION METHODS

  private async validateAssignmentCreation(data: any): Promise<void> {
    // Check if course exists and is active
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, data.courseId))
      .limit(1);

    if (!course[0]) {
      throw new Error('Course not found');
    }

    if (!course[0].isActive) {
      throw new Error('Cannot create assignments for inactive courses');
    }

    // Check due date is reasonable (at least 1 day from now)
    const minDueDate = new Date();
    minDueDate.setDate(minDueDate.getDate() + 1);
    
    if (data.dueDate < minDueDate) {
      throw new Error('Due date must be at least 1 day in the future');
    }
  }

  async validateAssignmentUpdate(id: number, data: any): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string }> = [];
    const warnings: Array<{ field: string; message: string }> = [];

    try {
      // Check if assignment has submissions
      const submissionCount = await this.getSubmissionCount(id);
      
      // Validate max points change
      if (data.maxPoints !== undefined && submissionCount > 0) {
        warnings.push({
          field: 'maxPoints',
          message: `Changing max points will require recalculation of ${submissionCount} existing grades`
        });
      }

      // Validate due date change
      if (data.dueDate !== undefined) {
        const currentTime = new Date();
        if (data.dueDate < currentTime) {
          errors.push({
            field: 'dueDate',
            message: 'Due date cannot be in the past'
          });
        }

        if (submissionCount > 0) {
          warnings.push({
            field: 'dueDate',
            message: `Due date change will affect ${submissionCount} existing submissions`
          });
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [{ field: 'general', message: 'Validation check failed' }],
        warnings: []
      };
    }
  }

  private async validateAssignmentDeletion(id: number): Promise<void> {
    // Check for existing submissions
    const submissionCount = await this.getSubmissionCount(id);
    
    if (submissionCount > 0) {
      throw new Error(`Cannot delete assignment with ${submissionCount} existing submissions. Use soft delete instead.`);
    }
  }

  // PERMISSION METHODS

  async checkAssignmentPermissions(assignmentId: number, userId: string): Promise<PermissionResult> {
    try {
      const assignment = await this.getAssignmentById(assignmentId, true);
      if (!assignment) {
        return { canRead: false, canUpdate: false, canDelete: false, reason: 'Assignment not found' };
      }

      return this.checkCoursePermissions(assignment.courseId, userId);
    } catch (error) {
      return { canRead: false, canUpdate: false, canDelete: false, reason: 'Permission check failed' };
    }
  }

  async checkCoursePermissions(courseId: number, userId: string): Promise<PermissionResult> {
    try {
      // Get user role and course info
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!userResult[0]) {
        return { canRead: false, canUpdate: false, canDelete: false, reason: 'User not found' };
      }

      const user = userResult[0];

      // Admin has full access
      if (user.role === 'admin') {
        return { canRead: true, canUpdate: true, canDelete: true };
      }

      // Check if teacher owns the course
      if (user.role === 'teacher') {
        const courseResult = await db
          .select()
          .from(courses)
          .where(eq(courses.id, courseId))
          .limit(1);

        if (!courseResult[0]) {
          return { canRead: false, canUpdate: false, canDelete: false, reason: 'Course not found' };
        }

        const isOwner = courseResult[0].teacherId === userId;
        return {
          canRead: isOwner,
          canUpdate: isOwner,
          canDelete: isOwner,
          reason: isOwner ? undefined : 'Not course owner'
        };
      }

      // Students can only read assignments from enrolled courses
      if (user.role === 'student') {
        const enrollmentResult = await db
          .select()
          .from(enrollments)
          .where(and(
            eq(enrollments.studentId, userId),
            eq(enrollments.courseId, courseId),
            eq(enrollments.isActive, true)
          ))
          .limit(1);

        const isEnrolled = enrollmentResult.length > 0;
        return {
          canRead: isEnrolled,
          canUpdate: false,
          canDelete: false,
          reason: isEnrolled ? undefined : 'Not enrolled in course'
        };
      }

      return { canRead: false, canUpdate: false, canDelete: false, reason: 'Invalid role' };
    } catch (error) {
      console.error('Error checking course permissions:', error);
      return { canRead: false, canUpdate: false, canDelete: false, reason: 'Permission check failed' };
    }
  }

  // UTILITY METHODS

  private async getSubmissionCount(assignmentId: number): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(submissions)
        .where(eq(submissions.assignmentId, assignmentId));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting submission count:', error);
      return 0;
    }
  }

  private async analyzeUpdateImpact(id: number, data: any): Promise<AssignmentImpactAnalysis> {
    const submissionCount = await this.getSubmissionCount(id);
    
    // Get enrolled student count
    const assignment = await this.getAssignmentById(id, true);
    const enrollmentResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .where(and(
        eq(enrollments.courseId, assignment?.courseId || 0),
        eq(enrollments.isActive, true)
      ));
    
    const studentsAffected = enrollmentResult[0]?.count || 0;

    return {
      submissionCount,
      studentsAffected,
      gradeRecalculationRequired: !!(data.maxPoints && submissionCount > 0),
      notificationRequired: !!(data.dueDate || data.title) && studentsAffected > 0,
    };
  }

  private async handleUpdateSideEffects(assignmentId: number, impact: AssignmentImpactAnalysis): Promise<void> {
    // This would trigger notifications, grade recalculations, etc.
    if (impact.notificationRequired) {
      console.log(`📧 Would send notifications to ${impact.studentsAffected} students`);
    }
    
    if (impact.gradeRecalculationRequired) {
      console.log(`🔢 Would recalculate ${impact.submissionCount} grades`);
    }
  }

  private async logAssignmentOperation(
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    assignmentId: number,
    userId: string,
    oldValues: any,
    newValues: any
  ): Promise<void> {
    // Audit logging implementation
    console.log(`📝 Audit: ${operation} assignment ${assignmentId} by user ${userId}`, {
      oldValues: operation === 'CREATE' ? null : oldValues,
      newValues: operation === 'DELETE' ? null : newValues,
      timestamp: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const assignmentService = new AssignmentCRUDService();