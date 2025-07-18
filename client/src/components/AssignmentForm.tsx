import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, Loader2, AlertTriangle } from "lucide-react";
import { useAssignmentCRUD, AssignmentFormData, ValidationResult } from "@/hooks/useAssignmentCRUD";
import { useState, useEffect } from "react";

// Props interface
interface AssignmentFormProps {
  courseId: number;
  assignmentId?: number; // For editing existing assignments
  initialData?: Partial<AssignmentFormData>;
  onSuccess?: (assignment: any) => void;
  onCancel?: () => void;
}

export default function AssignmentForm({ 
  courseId, 
  assignmentId, 
  initialData, 
  onSuccess, 
  onCancel 
}: AssignmentFormProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showValidationWarnings, setShowValidationWarnings] = useState(false);
  
  const {
    assignmentFormSchema,
    createAssignment,
    updateAssignment,
    validateAssignmentUpdate,
    useAssignment,
    isCreating,
    isUpdating,
    isValidating
  } = useAssignmentCRUD();

  // Form setup with validation
  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      courseId,
      title: "",
      description: "",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      maxPoints: 100,
      assignmentType: "homework",
      isActive: true,
      ...initialData,
    },
  });

  // Load existing assignment data if editing
  const { data: existingAssignment, isLoading: loadingAssignment } = useAssignment(assignmentId || 0);

  // Populate form with existing data when editing
  useEffect(() => {
    if (existingAssignment && assignmentId) {
      form.reset({
        courseId: existingAssignment.courseId,
        title: existingAssignment.title,
        description: existingAssignment.description || "",
        dueDate: new Date(existingAssignment.dueDate),
        maxPoints: parseFloat(existingAssignment.maxPoints) || 100,
        assignmentType: existingAssignment.assignmentType || "homework",
        isActive: existingAssignment.isActive ?? true,
      });
    }
  }, [existingAssignment, assignmentId, form]);

  // Validate changes before submission (for updates)
  const handleValidateChanges = async () => {
    if (!assignmentId) return;
    
    const formData = form.getValues();
    const result = await validateAssignmentUpdate.mutateAsync({
      assignmentId,
      data: formData
    });
    
    if (result.success) {
      setValidationResult(result.data);
      setShowValidationWarnings(result.data.warnings.length > 0);
    }
  };

  // Form submission handler
  const onSubmit = async (data: AssignmentFormData) => {
    try {
      if (assignmentId) {
        // Update existing assignment
        await updateAssignment.mutateAsync({
          assignmentId,
          data
        });
      } else {
        // Create new assignment
        await createAssignment.mutateAsync(data);
      }
      
      // Call success callback if provided
      onSuccess?.(data);
    } catch (error) {
      console.error('Form submission error:', error);
      // Error is handled by the mutation's onError callback
    }
  };

  const isSubmitting = isCreating || isUpdating;
  const isEdit = !!assignmentId;

  if (loadingAssignment && isEdit) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading assignment data...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEdit ? 'Edit Assignment' : 'Create New Assignment'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Validation warnings */}
        {showValidationWarnings && validationResult && validationResult.warnings.length > 0 && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Please review these warnings:</div>
              <ul className="list-disc list-inside space-y-1">
                {validationResult.warnings.map((warning, index) => (
                  <li key={index} className="text-sm">
                    <strong>{warning.field}:</strong> {warning.message}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignment Title *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter assignment title" 
                      {...field} 
                      maxLength={255}
                    />
                  </FormControl>
                  <FormDescription>
                    Choose a clear, descriptive title for the assignment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter assignment description and instructions"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide detailed instructions and requirements for students
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Due Date Field */}
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date *</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local"
                        {...field}
                        value={field.value ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      When students must submit their work
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Max Points Field */}
              <FormField
                control={form.control}
                name="maxPoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Points *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1"
                        max="1000"
                        placeholder="100"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Total points possible for this assignment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assignment Type Field */}
              <FormField
                control={form.control}
                name="assignmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="homework">Homework</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="lab">Lab</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Categorize the type of assignment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Active Status Field */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Assignment</FormLabel>
                      <FormDescription>
                        Students can see and submit to active assignments
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Validation Button for Updates */}
            {isEdit && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleValidateChanges}
                  disabled={isValidating}
                >
                  {isValidating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Validate Changes
                </Button>
                {validationResult && (
                  <span className={`text-sm ${validationResult.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {validationResult.isValid ? '✓ Valid' : '✗ Has issues'}
                  </span>
                )}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center gap-4 pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isEdit ? 'Update Assignment' : 'Create Assignment'}
              </Button>
              
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}