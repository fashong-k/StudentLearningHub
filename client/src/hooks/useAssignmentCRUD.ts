import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

// Frontend validation schemas (matching backend)
export const assignmentFormSchema = z.object({
  courseId: z.number().positive("Course ID must be positive"),
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().optional(),
  dueDate: z.coerce.date().refine(date => date > new Date(), "Due date must be in the future"),
  maxPoints: z.number().positive("Max points must be positive").max(1000, "Max points cannot exceed 1000"),
  assignmentType: z.enum(["homework", "quiz", "exam", "project", "lab"]).default("homework"),
  isActive: z.boolean().default(true),
});

export type AssignmentFormData = z.infer<typeof assignmentFormSchema>;
export type AssignmentUpdateData = Partial<AssignmentFormData>;

// Standardized response types
interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

interface ValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
}

interface AssignmentFilters {
  isActive?: boolean;
  assignmentType?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

// Custom hook for assignment CRUD operations
export function useAssignmentCRUD() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query for getting assignments by course
  const useAssignments = (courseId: number, filters?: AssignmentFilters) => {
    return useQuery({
      queryKey: [`/api/assignments/${courseId}`, filters],
      enabled: !!courseId,
      retry: false,
    });
  };

  // Query for getting single assignment
  const useAssignment = (assignmentId: number) => {
    return useQuery({
      queryKey: [`/api/assignments/detail/${assignmentId}`],
      enabled: !!assignmentId,
      retry: false,
    });
  };

  // Query for teacher assignments
  const useTeacherAssignments = (teacherId: string) => {
    return useQuery({
      queryKey: [`/api/assignments/teacher/${teacherId}`],
      enabled: !!teacherId,
      retry: false,
    });
  };

  // Create assignment mutation
  const createAssignment = useMutation({
    mutationFn: async (data: AssignmentFormData): Promise<APIResponse<any>> => {
      // Validate data before sending
      const validatedData = assignmentFormSchema.parse(data);
      return await apiRequest('POST', '/api/assignments', validatedData);
    },
    onSuccess: (response, variables) => {
      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Assignment created successfully",
        });
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: [`/api/assignments/${variables.courseId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/assignments/teacher'] });
      } else {
        throw new Error(response.message || 'Failed to create assignment');
      }
    },
    onError: (error: any) => {
      console.error('Assignment creation error:', error);
      
      let errorMessage = 'Failed to create assignment';
      let errorDetails: string[] = [];
      
      if (error.response?.data?.errors) {
        errorDetails = error.response.data.errors.map((err: any) => 
          typeof err === 'string' ? err : `${err.field}: ${err.message}`
        );
        errorMessage = errorDetails.join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update assignment mutation
  const updateAssignment = useMutation({
    mutationFn: async ({ 
      assignmentId, 
      data 
    }: { 
      assignmentId: number; 
      data: AssignmentUpdateData 
    }): Promise<APIResponse<any>> => {
      // Validate data before sending
      const validatedData = assignmentFormSchema.partial().parse(data);
      return await apiRequest('PUT', `/api/assignments/${assignmentId}`, validatedData);
    },
    onSuccess: (response, variables) => {
      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Assignment updated successfully",
        });
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: [`/api/assignments/detail/${variables.assignmentId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
        queryClient.invalidateQueries({ queryKey: ['/api/assignments/teacher'] });
      } else {
        throw new Error(response.message || 'Failed to update assignment');
      }
    },
    onError: (error: any) => {
      console.error('Assignment update error:', error);
      
      let errorMessage = 'Failed to update assignment';
      
      if (error.response?.data?.errors) {
        const errorDetails = error.response.data.errors.map((err: any) => 
          typeof err === 'string' ? err : `${err.field}: ${err.message}`
        );
        errorMessage = errorDetails.join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Delete assignment mutation
  const deleteAssignment = useMutation({
    mutationFn: async ({ 
      assignmentId, 
      hardDelete = false 
    }: { 
      assignmentId: number; 
      hardDelete?: boolean 
    }): Promise<APIResponse<any>> => {
      const url = `/api/assignments/${assignmentId}${hardDelete ? '?hard=true' : ''}`;
      return await apiRequest('DELETE', url);
    },
    onSuccess: (response, variables) => {
      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Assignment deleted successfully",
        });
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
        queryClient.invalidateQueries({ queryKey: ['/api/assignments/teacher'] });
        
        // Remove specific assignment from cache
        queryClient.removeQueries({ queryKey: [`/api/assignments/detail/${variables.assignmentId}`] });
      } else {
        throw new Error(response.message || 'Failed to delete assignment');
      }
    },
    onError: (error: any) => {
      console.error('Assignment deletion error:', error);
      
      let errorMessage = 'Failed to delete assignment';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Validate assignment update mutation
  const validateAssignmentUpdate = useMutation({
    mutationFn: async ({ 
      assignmentId, 
      data 
    }: { 
      assignmentId: number; 
      data: AssignmentUpdateData 
    }): Promise<APIResponse<ValidationResult>> => {
      return await apiRequest('POST', `/api/assignments/${assignmentId}/validate`, data);
    },
    onError: (error: any) => {
      console.error('Assignment validation error:', error);
      
      toast({
        title: "Validation Error",
        description: error.message || "Failed to validate assignment changes",
        variant: "destructive",
      });
    },
  });

  // Utility functions
  const invalidateAssignmentQueries = (courseId?: number) => {
    if (courseId) {
      queryClient.invalidateQueries({ queryKey: [`/api/assignments/${courseId}`] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
    }
    queryClient.invalidateQueries({ queryKey: ['/api/assignments/teacher'] });
  };

  const getAssignmentFromCache = (assignmentId: number) => {
    return queryClient.getQueryData([`/api/assignments/detail/${assignmentId}`]);
  };

  // Form validation helper
  const validateAssignmentForm = (data: any): { isValid: boolean; errors: Record<string, string> } => {
    try {
      assignmentFormSchema.parse(data);
      return { isValid: true, errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          const field = err.path.join('.');
          errors[field] = err.message;
        });
        return { isValid: false, errors };
      }
      return { isValid: false, errors: { general: 'Validation failed' } };
    }
  };

  return {
    // Query hooks
    useAssignments,
    useAssignment,
    useTeacherAssignments,
    
    // Mutation hooks
    createAssignment,
    updateAssignment,
    deleteAssignment,
    validateAssignmentUpdate,
    
    // Utility functions
    invalidateAssignmentQueries,
    getAssignmentFromCache,
    validateAssignmentForm,
    
    // Loading states
    isCreating: createAssignment.isPending,
    isUpdating: updateAssignment.isPending,
    isDeleting: deleteAssignment.isPending,
    isValidating: validateAssignmentUpdate.isPending,
    
    // Schemas for external use
    assignmentFormSchema,
  };
}

// Export helper types
export type { AssignmentFormData, AssignmentUpdateData, ValidationResult, AssignmentFilters };