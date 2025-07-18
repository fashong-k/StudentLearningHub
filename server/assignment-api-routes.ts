import { Express } from 'express';
import { assignmentService, createAssignmentSchema, updateAssignmentSchema } from './assignment-crud-service';
import { db } from './db-drizzle';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Note: authMiddleware should be imported from the main routes file
export function setupAssignmentRoutes(app: Express, authMiddleware: any) {
  
  // GET /api/assignments/:courseId - Get all assignments for a course
  app.get('/api/assignments/:courseId', authMiddleware, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const userId = req.user?.claims?.sub || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check permissions
      const permissions = await assignmentService.checkCoursePermissions(courseId, userId);
      if (!permissions.canRead) {
        return res.status(403).json({
          success: false,
          message: `Access denied: ${permissions.reason || 'Insufficient permissions'}`
        });
      }

      // Get assignments with optional filters
      const filters = {
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        assignmentType: req.query.assignmentType as string,
        dueDateFrom: req.query.dueDateFrom ? new Date(req.query.dueDateFrom as string) : undefined,
        dueDateTo: req.query.dueDateTo ? new Date(req.query.dueDateTo as string) : undefined,
      };

      const assignments = await assignmentService.getAssignments(courseId, filters);
      
      res.json({
        success: true,
        data: assignments,
        message: `Retrieved ${assignments.length} assignments`
      });
    } catch (error) {
      console.error('Error in GET /api/assignments/:courseId:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch assignments',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  });

  // GET /api/assignments/detail/:id - Get single assignment by ID
  app.get('/api/assignments/detail/:id', authMiddleware, async (req: any, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const userId = req.user?.claims?.sub || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check permissions
      const permissions = await assignmentService.checkAssignmentPermissions(assignmentId, userId);
      if (!permissions.canRead) {
        return res.status(403).json({
          success: false,
          message: `Access denied: ${permissions.reason || 'Insufficient permissions'}`
        });
      }

      const assignment = await assignmentService.getAssignmentById(assignmentId, true);
      
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      res.json({
        success: true,
        data: assignment,
        message: 'Assignment retrieved successfully'
      });
    } catch (error) {
      console.error('Error in GET /api/assignments/detail/:id:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch assignment',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  });

  // POST /api/assignments - Create new assignment
  app.post('/api/assignments', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Validate request body
      const validationResult = createAssignmentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const assignment = await assignmentService.createAssignment(validationResult.data, userId);
      
      res.status(201).json({
        success: true,
        data: assignment,
        message: 'Assignment created successfully'
      });
    } catch (error) {
      console.error('Error in POST /api/assignments:', error);
      
      if (error instanceof Error && error.message.includes('Permission denied')) {
        return res.status(403).json({
          success: false,
          message: error.message,
          errors: [error.message]
        });
      }
      
      if (error instanceof Error && error.message.includes('Validation')) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: [error.message]
        });
      }

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create assignment',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  });

  // PUT /api/assignments/:id - Update assignment
  app.put('/api/assignments/:id', authMiddleware, async (req: any, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const userId = req.user?.claims?.sub || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Validate request body
      const validationResult = updateAssignmentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const assignment = await assignmentService.updateAssignment(assignmentId, validationResult.data, userId);
      
      res.json({
        success: true,
        data: assignment,
        message: 'Assignment updated successfully'
      });
    } catch (error) {
      console.error('Error in PUT /api/assignments/:id:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message,
          errors: [error.message]
        });
      }
      
      if (error instanceof Error && error.message.includes('Permission denied')) {
        return res.status(403).json({
          success: false,
          message: error.message,
          errors: [error.message]
        });
      }
      
      if (error instanceof Error && error.message.includes('Validation')) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: [error.message]
        });
      }

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update assignment',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  });

  // DELETE /api/assignments/:id - Delete assignment (soft delete by default)
  app.delete('/api/assignments/:id', authMiddleware, async (req: any, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const userId = req.user?.claims?.sub || req.user?.id;
      const hardDelete = req.query.hard === 'true';
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const success = await assignmentService.deleteAssignment(assignmentId, userId, !hardDelete);
      
      if (success) {
        res.json({
          success: true,
          data: { deleted: true, type: hardDelete ? 'permanent' : 'soft' },
          message: `Assignment ${hardDelete ? 'permanently deleted' : 'deactivated'} successfully`
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Assignment not found or already deleted'
        });
      }
    } catch (error) {
      console.error('Error in DELETE /api/assignments/:id:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message,
          errors: [error.message]
        });
      }
      
      if (error instanceof Error && error.message.includes('Permission denied')) {
        return res.status(403).json({
          success: false,
          message: error.message,
          errors: [error.message]
        });
      }
      
      if (error instanceof Error && error.message.includes('Cannot delete')) {
        return res.status(409).json({
          success: false,
          message: error.message,
          errors: [error.message]
        });
      }

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete assignment',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  });

  // GET /api/assignments/teacher/:teacherId - Get all assignments for a teacher
  app.get('/api/assignments/teacher/:teacherId', authMiddleware, async (req: any, res) => {
    try {
      const teacherId = req.params.teacherId;
      const userId = req.user?.claims?.sub || req.user?.id;
      
      // Only allow teachers to see their own assignments or admins to see any teacher's assignments
      const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const user = userResult[0];
      
      if (!user || (user.role !== 'admin' && userId !== teacherId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Can only view your own assignments'
        });
      }

      const assignments = await assignmentService.getAssignmentsByTeacher(teacherId);
      
      res.json({
        success: true,
        data: assignments,
        message: `Retrieved ${assignments.length} assignments for teacher`
      });
    } catch (error) {
      console.error('Error in GET /api/assignments/teacher/:teacherId:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch teacher assignments',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  });

  // POST /api/assignments/:id/validate - Validate assignment update
  app.post('/api/assignments/:id/validate', authMiddleware, async (req: any, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const userId = req.user?.claims?.sub || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check permissions
      const permissions = await assignmentService.checkAssignmentPermissions(assignmentId, userId);
      if (!permissions.canUpdate) {
        return res.status(403).json({
          success: false,
          message: `Access denied: ${permissions.reason || 'Insufficient permissions'}`
        });
      }

      // Validate proposed changes
      const validationResult = updateAssignmentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid update data',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const validation = await assignmentService.validateAssignmentUpdate(assignmentId, validationResult.data);
      
      res.json({
        success: true,
        data: validation,
        message: validation.isValid ? 'Validation passed' : 'Validation failed'
      });
    } catch (error) {
      console.error('Error in POST /api/assignments/:id/validate:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Validation check failed',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  });
}

// Export for easy integration
export default setupAssignmentRoutes;