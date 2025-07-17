import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SimpleDropdown, SimpleDropdownItem, SimpleDropdownSeparator } from "@/components/ui/simple-dropdown";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCourseSchema } from "@shared/schema";
import { z } from "zod";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useDataFallback } from "@/hooks/useDataFallback";
import { DataFallbackAlert } from "@/components/DataFallbackAlert";
import { hasPermission } from "@/lib/roleUtils";
import { 
  BookOpen, 
  Users, 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Copy,
  Settings,
  Eye,
  Download,
  Upload,
  Link,
  BarChart3,
  FileText,
  Bell,
  Shield,
  Clipboard,
  Archive,
  Clock,
  GraduationCap
} from "lucide-react";
import { format } from "date-fns";
import { safeFormat, isValidDate } from "@/lib/dateUtils";
import TestSelect from "@/components/TestSelect";
import { SimpleSelect, SimpleSelectItem } from "@/components/ui/simple-select";

export default function Courses() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [codeValidation, setCodeValidation] = useState<{ isValid: boolean; message: string }>({ isValid: true, message: "" });
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<any>(null);
  const queryClient = useQueryClient();
  const { isUsingFallback, failedEndpoints, showAlert, reportFailure, clearFailures } = useDataFallback();
  const [, setLocation] = useLocation();

  const form = useForm({
    resolver: zodResolver(insertCourseSchema.extend({
      teacherId: z.string().min(1, "Teacher ID is required"),
    })),
    defaultValues: {
      title: "",
      description: "",
      courseCode: "",
      semester: "Fall",
      year: new Date().getFullYear(),
      termType: "semester",
      startDate: null,
      endDate: null,
      visibility: "private",
      gradingScheme: "letter",
      teacherId: user?.id || "", // Add teacherId to default values
    },
  });

  const editForm = useForm({
    resolver: zodResolver(insertCourseSchema.extend({
      teacherId: z.string().min(1, "Teacher ID is required"),
    })),
    defaultValues: {
      title: "",
      description: "",
      courseCode: "",
      semester: "Fall",
      year: new Date().getFullYear(),
      termType: "semester",
      startDate: null,
      endDate: null,
      visibility: "private",
      gradingScheme: "letter",
      teacherId: user?.id || "",
    },
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery<any[]>({
    queryKey: ["/api/courses"],
    enabled: !!user,
    queryFn: async (): Promise<any[]> => {
      try {
        const result = await apiRequest("GET", "/api/courses");
        return Array.isArray(result) ? result : [];
      } catch (error) {
        reportFailure("/api/courses", error);
        return [];
      }
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/courses", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Course created successfully",
      });
      setIsCreateOpen(false);
      form.reset();
      setCodeValidation({ isValid: true, message: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes("duplicate") || errorMsg.includes("unique")) {
        setCodeValidation({ isValid: false, message: "Course code already exists" });
      } else {
        toast({
          title: "Error",
          description: "Failed to create course",
          variant: "destructive",
        });
      }
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PUT", `/api/courses/${id}`, data);
    },
    onSuccess: (result) => {
      const warnings = result.validation?.warnings || [];
      const cascadeInfo = result.cascadeResult?.updatedRecords || {};
      
      let description = "Course updated successfully";
      if (cascadeInfo.assignments > 0 || cascadeInfo.calendarEvents > 0) {
        description += `. Updated ${cascadeInfo.assignments} assignments and ${cascadeInfo.calendarEvents} calendar events.`;
      }
      
      toast({
        title: "Success",
        description,
      });
      
      if (warnings.length > 0) {
        setTimeout(() => {
          toast({
            title: "Important Notes",
            description: warnings.join(" "),
            variant: "default",
          });
        }, 1000);
      }
      
      setIsEditOpen(false);
      setEditingCourse(null);
      editForm.reset();
      setShowValidationDialog(false);
      setPendingUpdate(null);
      setValidationWarnings([]);
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
      });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/courses/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
      setIsDeleteOpen(false);
      setDeletingCourse(null);
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      });
    },
  });

  const enrollCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      return await apiRequest("POST", `/api/courses/${courseId}/enroll`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Successfully enrolled in course",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to enroll in course",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Course code validation and suggestion
  const validateCourseCode = (code: string) => {
    if (!code || code.trim() === "") {
      setCodeValidation({ isValid: true, message: "" });
      return;
    }
    
    const existingCourse = courses.find((course: any) => 
      course.courseCode.toLowerCase() === code.toLowerCase()
    );
    
    if (existingCourse) {
      setCodeValidation({ isValid: false, message: "Course code already exists" });
    } else {
      setCodeValidation({ isValid: true, message: "Course code is available" });
    }
  };

  const suggestCourseCode = (title: string) => {
    if (!title) return "";
    
    const words = title.split(" ");
    let suggestion = "";
    
    if (words.length >= 2) {
      // Use first letters of first two words + random number
      suggestion = words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase() + " " + Math.floor(Math.random() * 900 + 100);
    } else {
      // Use first 3 letters + random number
      suggestion = words[0].substring(0, 3).toUpperCase() + " " + Math.floor(Math.random() * 900 + 100);
    }
    
    // Check if suggested code exists
    const existingCourse = courses.find((course: any) => 
      course.courseCode.toLowerCase() === suggestion.toLowerCase()
    );
    
    if (existingCourse) {
      // Try with different number
      suggestion = suggestion.split(" ")[0] + " " + Math.floor(Math.random() * 900 + 100);
    }
    
    return suggestion;
  };

  const onSubmit = (data: any) => {
    console.log("Form submission reached!", data);
    console.log("Form validation state:", JSON.stringify(form.formState.errors, null, 2));
    console.log("Code validation state:", codeValidation);
    
    // Clean up the data and ensure proper field values
    const courseData = {
      ...data,
      teacherId: user?.id, // Add the current user's ID as teacherId
      // Ensure dates are properly handled
      startDate: data.termType === "term" ? data.startDate : null,
      endDate: data.termType === "term" ? data.endDate : null,
    };
    
    console.log("Final course data with teacherId:", courseData);
    createCourseMutation.mutate(courseData);
  };

  const onEditSubmit = async (data: any) => {
    if (editingCourse) {
      // Clean up the data and ensure proper field values
      const courseData = {
        ...data,
        teacherId: user?.id, // Keep the current teacher
        // Ensure dates are properly handled
        startDate: data.termType === "term" ? data.startDate : null,
        endDate: data.termType === "term" ? data.endDate : null,
      };
      
      // First validate the update
      try {
        const validationResult = await apiRequest("POST", `/api/courses/${editingCourse.id}/validate-update`, courseData);
        
        if (validationResult.validation.warnings.length > 0) {
          setValidationWarnings(validationResult.validation.warnings);
          setPendingUpdate({ id: editingCourse.id, data: courseData });
          setShowValidationDialog(true);
          return;
        }
        
        // If no warnings, proceed with update
        updateCourseMutation.mutate({ id: editingCourse.id, data: courseData });
      } catch (error) {
        console.error("Validation error:", error);
        // Fall back to direct update if validation fails
        updateCourseMutation.mutate({ id: editingCourse.id, data: courseData });
      }
    }
  };

  const handleEditCourse = (course: any) => {
    setEditingCourse(course);
    editForm.reset({
      title: course.title,
      description: course.description,
      courseCode: course.courseCode,
      semester: course.semester,
      year: course.year,
      termType: course.termType || "semester",
      startDate: course.startDate ? new Date(course.startDate) : null,
      endDate: course.endDate ? new Date(course.endDate) : null,
      visibility: course.visibility || "private",
      gradingScheme: course.gradingScheme || "letter",
      teacherId: course.teacherId || user?.id,
    });
    setIsEditOpen(true);
  };

  const handleDeleteCourse = (course: any) => {
    setDeletingCourse(course);
    setIsDeleteOpen(true);
  };

  const confirmDeleteCourse = () => {
    if (deletingCourse) {
      deleteCourseMutation.mutate(deletingCourse.id);
    }
  };

  const handleEnrollCourse = (courseId: number) => {
    enrollCourseMutation.mutate(courseId);
  };

  const handleViewCourse = (courseId: number) => {
    setLocation(`/courses/${courseId}`);
  };



  const filteredCourses = Array.isArray(courses) ? courses.filter((course: any) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.courseCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = selectedSemester === "all" || course.semester === selectedSemester;
    return matchesSearch && matchesSemester;
  }) : [];

  // Use real database data; only show sample data if database retrieval fails
  const displayCourses = filteredCourses;

  return (
    <div className="flex h-screen overflow-hidden lms-background">
      <Navigation />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="lms-surface border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {user?.role === "teacher" ? "My Courses" : "Enrolled Courses"}
              </h1>
              <p className="text-gray-600 mt-1">
                {user?.role === "teacher" 
                  ? "Manage your teaching courses and materials"
                  : "View your enrolled courses and assignments"}
              </p>
            </div>
            {hasPermission(user?.role || "student", "canCreateCourses") && (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Course
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Introduction to Computer Science" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="courseCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course Code</FormLabel>
                            <div className="flex space-x-2">
                              <FormControl>
                                <Input 
                                  placeholder="CS 101" 
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(e);
                                    validateCourseCode(e.target.value);
                                  }}
                                />
                              </FormControl>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  const suggestion = suggestCourseCode(form.getValues("title"));
                                  if (suggestion) {
                                    form.setValue("courseCode", suggestion);
                                    validateCourseCode(suggestion);
                                  }
                                }}
                              >
                                Suggest
                              </Button>
                            </div>
                            {codeValidation.message && (
                              <p className={`text-sm ${codeValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                                {codeValidation.isValid ? (
                                  <CheckCircle className="w-4 h-4 inline mr-1" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 inline mr-1" />
                                )}
                                {codeValidation.message}
                              </p>
                            )}
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Course description..." {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="termType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Term Type</FormLabel>
                            <FormControl>
                              <SimpleSelect 
                                value={field.value} 
                                onValueChange={(value) => { 
                                  console.log('Term type changed:', value); 
                                  field.onChange(value);
                                  // Clear date fields when switching to semester mode
                                  if (value === "semester") {
                                    form.setValue("startDate", undefined);
                                    form.setValue("endDate", undefined);
                                  }
                                }}
                                placeholder="Select term type"
                              >
                                <SimpleSelectItem value="semester">Semester</SimpleSelectItem>
                                <SimpleSelectItem value="term">Term</SimpleSelectItem>
                              </SimpleSelect>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {form.watch("termType") === "semester" ? (
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="semester"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Semester</FormLabel>
                                <FormControl>
                                  <SimpleSelect 
                                    value={field.value} 
                                    onValueChange={field.onChange}
                                    placeholder="Select semester"
                                  >
                                    <SimpleSelectItem value="Spring">Spring</SimpleSelectItem>
                                    <SimpleSelectItem value="Summer">Summer</SimpleSelectItem>
                                    <SimpleSelectItem value="Fall">Fall</SimpleSelectItem>
                                    <SimpleSelectItem value="Winter">Winter</SimpleSelectItem>
                                  </SimpleSelect>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="year"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Year</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Date</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                      >
                                        {field.value && isValidDate(field.value) ? safeFormat(field.value, "PPP") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 z-50 popover-content" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value && isValidDate(field.value) ? new Date(field.value) : undefined}
                                      onSelect={(date) => {
                                        field.onChange(date);
                                        // Close popover after selection
                                        const popover = document.querySelector('[data-state="open"]');
                                        if (popover) {
                                          const closeButton = popover.querySelector('[data-testid="close-button"]');
                                          if (closeButton) (closeButton as HTMLElement).click();
                                        }
                                      }}
                                      disabled={(date) => date < new Date()}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Date</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                      >
                                        {field.value && isValidDate(field.value) ? safeFormat(field.value, "PPP") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 z-50 popover-content" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value && isValidDate(field.value) ? new Date(field.value) : undefined}
                                      onSelect={(date) => {
                                        field.onChange(date);
                                        // Close popover after selection
                                        const popover = document.querySelector('[data-state="open"]');
                                        if (popover) {
                                          const closeButton = popover.querySelector('[data-testid="close-button"]');
                                          if (closeButton) (closeButton as HTMLElement).click();
                                        }
                                      }}
                                      disabled={(date) => {
                                        const startDate = form.watch("startDate");
                                        return date < new Date() || (startDate && isValidDate(startDate) ? date < new Date(startDate) : false);
                                      }}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="visibility"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Visibility</FormLabel>
                              <FormControl>
                                <SimpleSelect 
                                  value={field.value} 
                                  onValueChange={field.onChange}
                                  placeholder="Select visibility"
                                >
                                  <SimpleSelectItem value="private">Private (Enrolled only)</SimpleSelectItem>
                                  <SimpleSelectItem value="institution">Institution (All users)</SimpleSelectItem>
                                </SimpleSelect>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="gradingScheme"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Grading Scheme</FormLabel>
                              <FormControl>
                                <SimpleSelect 
                                  value={field.value} 
                                  onValueChange={field.onChange}
                                  placeholder="Select grading scheme"
                                >
                                  <SimpleSelectItem value="letter">Letter Grade (A-F)</SimpleSelectItem>
                                  <SimpleSelectItem value="percentage">Percentage (0-100%)</SimpleSelectItem>
                                  <SimpleSelectItem value="points">Points Based</SimpleSelectItem>
                                </SimpleSelect>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createCourseMutation.isPending || (codeValidation.message !== "" && !codeValidation.isValid)}
                          onClick={(e) => {
                            console.log("Button clicked!");
                            console.log("Mutation pending:", createCourseMutation.isPending);
                            console.log("Code validation:", codeValidation);
                            console.log("Form valid:", form.formState.isValid);
                            console.log("Form errors:", JSON.stringify(form.formState.errors, null, 2));
                            console.log("Form values:", JSON.stringify(form.getValues(), null, 2));
                            
                            // Force form submission if validation passes
                            if (form.formState.isValid && codeValidation.isValid) {
                              console.log("Manually triggering form submission...");
                              form.handleSubmit(onSubmit)();
                            }
                          }}
                        >
                          {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </header>

        {/* Edit Course Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Introduction to Computer Science" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="courseCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="CS 101" 
                          {...field} 
                          disabled 
                          className="bg-gray-50 cursor-not-allowed"
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">
                        Course code cannot be changed after creation to maintain data integrity
                      </p>
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Course description..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="termType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Term Type</FormLabel>
                      <FormControl>
                        <SimpleSelect 
                          value={field.value} 
                          onValueChange={(value) => { 
                            field.onChange(value);
                            // Clear date fields when switching to semester mode
                            if (value === "semester") {
                              editForm.setValue("startDate", undefined);
                              editForm.setValue("endDate", undefined);
                            }
                          }}
                          placeholder="Select term type"
                        >
                          <SimpleSelectItem value="semester">Semester</SimpleSelectItem>
                          <SimpleSelectItem value="term">Term</SimpleSelectItem>
                        </SimpleSelect>
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {editForm.watch("termType") === "semester" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="semester"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Semester</FormLabel>
                          <FormControl>
                            <SimpleSelect 
                              value={field.value} 
                              onValueChange={field.onChange}
                              placeholder="Select semester"
                            >
                              <SimpleSelectItem value="Spring">Spring</SimpleSelectItem>
                              <SimpleSelectItem value="Summer">Summer</SimpleSelectItem>
                              <SimpleSelectItem value="Fall">Fall</SimpleSelectItem>
                              <SimpleSelectItem value="Winter">Winter</SimpleSelectItem>
                            </SimpleSelect>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                >
                                  {field.value && isValidDate(field.value) ? safeFormat(field.value, "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 z-50 popover-content" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value && isValidDate(field.value) ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date)}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                >
                                  {field.value && isValidDate(field.value) ? safeFormat(field.value, "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 z-50 popover-content" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value && isValidDate(field.value) ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date)}
                                disabled={(date) => {
                                  const startDate = editForm.watch("startDate");
                                  return date < new Date() || (startDate && isValidDate(startDate) ? date < new Date(startDate) : false);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visibility</FormLabel>
                        <FormControl>
                          <SimpleSelect 
                            value={field.value} 
                            onValueChange={field.onChange}
                            placeholder="Select visibility"
                          >
                            <SimpleSelectItem value="private">Private (Enrolled only)</SimpleSelectItem>
                            <SimpleSelectItem value="institution">Institution (All users)</SimpleSelectItem>
                          </SimpleSelect>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="gradingScheme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grading Scheme</FormLabel>
                        <FormControl>
                          <SimpleSelect 
                            value={field.value} 
                            onValueChange={field.onChange}
                            placeholder="Select grading scheme"
                          >
                            <SimpleSelectItem value="letter">Letter Grade (A-F)</SimpleSelectItem>
                            <SimpleSelectItem value="percentage">Percentage (0-100%)</SimpleSelectItem>
                            <SimpleSelectItem value="points">Points Based</SimpleSelectItem>
                          </SimpleSelect>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateCourseMutation.isPending}>
                    {updateCourseMutation.isPending ? "Updating..." : "Update Course"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>



        {/* Delete Course Dialog */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the course "{deletingCourse?.title}" 
                and all associated data including assignments, submissions, and enrollments.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteCourse}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteCourseMutation.isPending}
              >
                {deleteCourseMutation.isPending ? "Deleting..." : "Delete Course"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Data Fallback Alert */}
          <DataFallbackAlert 
            isVisible={showAlert} 
            failedEndpoints={failedEndpoints}
            onDismiss={clearFailures}
          />
          
          {/* Search and Filter */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                <SelectItem value="Spring">Spring</SelectItem>
                <SelectItem value="Summer">Summer</SelectItem>
                <SelectItem value="Fall">Fall</SelectItem>
                <SelectItem value="Winter">Winter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Courses Grid */}
          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-64 rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayCourses.map((course: any) => (
                <Card key={course.id} className="course-card hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <p className="text-sm text-gray-600">
                            {course.courseCode} • {course.semester} {course.year}
                          </p>
                        </div>
                      </div>
                      {user?.role === "teacher" && (
                        <SimpleDropdown
                          trigger={
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          }
                          align="end"
                        >
                          {/* Course Management */}
                          <SimpleDropdownItem onClick={() => handleEditCourse(course)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Course
                          </SimpleDropdownItem>
                          <SimpleDropdownItem onClick={() => setLocation(`/courses/${course.id}/settings`)}>
                            <Settings className="w-4 h-4 mr-2" />
                            Configure Settings
                          </SimpleDropdownItem>
                          <SimpleDropdownItem onClick={() => setLocation(`/courses/${course.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Course
                          </SimpleDropdownItem>
                          
                          <SimpleDropdownSeparator />
                          
                          {/* User Management */}
                          <SimpleDropdownItem onClick={() => toast({ title: "Feature Coming Soon", description: "Student management will be available soon" })}>
                            <Users className="w-4 h-4 mr-2" />
                            Manage Students
                          </SimpleDropdownItem>
                          <SimpleDropdownItem onClick={() => toast({ title: "Feature Coming Soon", description: "Instructor management will be available soon" })}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Instructors
                          </SimpleDropdownItem>
                          <SimpleDropdownItem onClick={() => toast({ title: "Feature Coming Soon", description: "Grade management will be available soon" })}>
                            <GraduationCap className="w-4 h-4 mr-2" />
                            Manage Grades
                          </SimpleDropdownItem>
                          
                          <SimpleDropdownSeparator />
                          
                          {/* Content & Analytics */}
                          <SimpleDropdownItem onClick={() => toast({ title: "Feature Coming Soon", description: "Course analytics will be available soon" })}>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View Analytics
                          </SimpleDropdownItem>
                          <SimpleDropdownItem onClick={() => toast({ title: "Feature Coming Soon", description: "Content management will be available soon" })}>
                            <FileText className="w-4 h-4 mr-2" />
                            Course Materials
                          </SimpleDropdownItem>
                          <SimpleDropdownItem onClick={() => toast({ title: "Feature Coming Soon", description: "Announcement management will be available soon" })}>
                            <Bell className="w-4 h-4 mr-2" />
                            Send Announcement
                          </SimpleDropdownItem>
                          
                          <SimpleDropdownSeparator />
                          
                          {/* Export & Share */}
                          <SimpleDropdownItem onClick={() => toast({ title: "Feature Coming Soon", description: "Export functionality will be available soon" })}>
                            <Download className="w-4 h-4 mr-2" />
                            Export Data
                          </SimpleDropdownItem>
                          <SimpleDropdownItem onClick={() => {
                            const shareUrl = `${window.location.origin}/courses/${course.id}`;
                            navigator.clipboard.writeText(shareUrl);
                            toast({ title: "Link Copied", description: "Course link copied to clipboard" });
                          }}>
                            <Link className="w-4 h-4 mr-2" />
                            Share Course Link
                          </SimpleDropdownItem>
                          <SimpleDropdownItem onClick={() => navigator.clipboard.writeText(course.courseCode)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Course Code
                          </SimpleDropdownItem>
                          
                          <SimpleDropdownSeparator />
                          
                          {/* Course Status */}
                          <SimpleDropdownItem onClick={() => toast({ title: "Feature Coming Soon", description: "Archive functionality will be available soon" })}>
                            <Archive className="w-4 h-4 mr-2" />
                            Archive Course
                          </SimpleDropdownItem>
                          <SimpleDropdownItem onClick={() => toast({ title: "Feature Coming Soon", description: "Duplicate functionality will be available soon" })}>
                            <Clipboard className="w-4 h-4 mr-2" />
                            Duplicate Course
                          </SimpleDropdownItem>
                          
                          <SimpleDropdownSeparator />
                          
                          {/* Dangerous Actions */}
                          <SimpleDropdownItem onClick={() => handleDeleteCourse(course)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Course
                          </SimpleDropdownItem>
                        </SimpleDropdown>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{course.enrolledCount || 0} students</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{course.assignmentCount || 0} assignments</span>
                      </div>
                    </div>

                    {course.nextDeadline && (
                      <div className="mb-4">
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          Next: {course.nextDeadline}
                        </Badge>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1" onClick={() => handleViewCourse(course.id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Course
                      </Button>
                      {user?.role === "teacher" && (
                        <Button size="sm" variant="outline" onClick={() => handleEditCourse(course)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {user?.role === "student" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEnrollCourse(course.id)}
                          disabled={enrollCourseMutation.isPending}
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {displayCourses.length === 0 && !coursesLoading && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600 mb-4">
                {user?.role === "teacher" 
                  ? "Create your first course to get started"
                  : "You're not enrolled in any courses yet"}
              </p>
              {user?.role === "teacher" && (
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
              )}
            </div>
          )}
        </main>

        {/* Validation Warning Dialog */}
        <AlertDialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Course Update Warnings
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                The following warnings were identified for this course update:
                <div className="mt-3 space-y-1">
                  {validationWarnings.map((warning, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-yellow-800">{warning}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm">
                  Do you want to proceed with these changes? Related assignments and events will be automatically updated.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowValidationDialog(false);
                setPendingUpdate(null);
                setValidationWarnings([]);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                if (pendingUpdate) {
                  updateCourseMutation.mutate(pendingUpdate);
                }
              }}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Proceed with Update
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
