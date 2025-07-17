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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { SimpleSelect, SimpleSelectItem } from "@/components/ui/simple-select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCourseSchema } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  BookOpen, 
  Calendar as CalendarIcon, 
  Settings, 
  Eye, 
  Users, 
  Plus, 
  ArrowLeft,
  Save,
  X
} from "lucide-react";
import { format } from "date-fns";

interface CourseSettingsProps {
  courseId: string;
}

export default function CourseSettings({ courseId }: CourseSettingsProps) {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Fetch course data
  const { data: course, isLoading } = useQuery({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId,
  });

  const form = useForm({
    resolver: zodResolver(insertCourseSchema),
    defaultValues: {
      title: "",
      description: "",
      courseCode: "",
      semester: "Fall",
      year: new Date().getFullYear(),
      termType: "semester",
      startDate: undefined,
      endDate: undefined,
      visibility: "private",
      gradingScheme: "letter",
      maxEnrollment: 50,
      allowLateSubmissions: true,
      syllabusUrl: "",
    },
  });

  // Update form when course data is loaded
  useEffect(() => {
    if (course) {
      form.reset({
        title: course.title || "",
        description: course.description || "",
        courseCode: course.courseCode || "",
        semester: course.semester || "Fall",
        year: course.year || new Date().getFullYear(),
        termType: course.termType || "semester",
        startDate: course.startDate ? new Date(course.startDate) : undefined,
        endDate: course.endDate ? new Date(course.endDate) : undefined,
        visibility: course.visibility || "private",
        gradingScheme: course.gradingScheme || "letter",
        maxEnrollment: course.maxEnrollment || 50,
        allowLateSubmissions: course.allowLateSubmissions ?? true,
        syllabusUrl: course.syllabusUrl || "",
      });
    }
  }, [course, form]);

  const updateCourseMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/courses/${courseId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Course Updated",
        description: "Course settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setLocation("/courses");
    },
    onError: (error) => {
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
        description: "Failed to update course settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    updateCourseMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation("/courses");
  };

  // Authentication checks
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-red-600">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">You must be logged in to access course settings.</p>
              <Button onClick={() => setLocation("/login")}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Check if user is teacher or admin
  const userRole = user?.role;
  const isTeacher = userRole === "teacher";
  const isAdmin = userRole === "admin";

  if (!isTeacher && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-orange-600">Access Restricted</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Only teachers and administrators can access course settings.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Your role: <span className="font-semibold capitalize">{userRole}</span>
              </p>
              <Button onClick={() => setLocation("/courses")}>
                Return to Courses
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If teacher, check if they own the course (after course data is loaded)
  if (course && isTeacher && course.teacherId !== user?.id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-orange-600">Course Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                You can only configure settings for courses you teach.
              </p>
              <Button onClick={() => setLocation("/courses")}>
                Return to Courses
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
            <Button onClick={() => setLocation("/courses")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleCancel}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Courses
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Course Settings</h1>
                <p className="text-gray-600">{course.title} • {course.courseCode}</p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter course title" />
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
                          <FormControl>
                            <Input {...field} placeholder="e.g., CS101" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Enter course description" rows={3} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Term and Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    Term and Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="termType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Term Type</FormLabel>
                          <FormControl>
                            <SimpleSelect
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Select term type"
                            >
                              <SimpleSelectItem value="semester">Semester</SimpleSelectItem>
                              <SimpleSelectItem value="quarter">Quarter</SimpleSelectItem>
                              <SimpleSelectItem value="trimester">Trimester</SimpleSelectItem>
                              <SimpleSelectItem value="custom">Custom</SimpleSelectItem>
                            </SimpleSelect>
                          </FormControl>
                        </FormItem>
                      )}
                    />
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
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              placeholder="2024" 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? format(field.value, "PPP") : "Pick a date"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 z-50">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
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
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? format(field.value, "PPP") : "Pick a date"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 z-50">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Grading and Visibility */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Grading and Visibility
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <SimpleSelectItem value="letter">Letter Grade (A, B, C, D, F)</SimpleSelectItem>
                              <SimpleSelectItem value="percentage">Percentage (0-100%)</SimpleSelectItem>
                              <SimpleSelectItem value="points">Points</SimpleSelectItem>
                              <SimpleSelectItem value="pass_fail">Pass/Fail</SimpleSelectItem>
                            </SimpleSelect>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="visibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Visibility</FormLabel>
                          <FormControl>
                            <SimpleSelect
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Select visibility"
                            >
                              <SimpleSelectItem value="private">Private (Enrolled users only)</SimpleSelectItem>
                              <SimpleSelectItem value="institution">Institution (All logged-in users)</SimpleSelectItem>
                              <SimpleSelectItem value="public">Public (Anyone with link)</SimpleSelectItem>
                            </SimpleSelect>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Enrollment and Policies */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Enrollment and Policies
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="maxEnrollment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Enrollment</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              placeholder="50" 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="syllabusUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Syllabus URL (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://example.com/syllabus.pdf" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name="allowLateSubmissions"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="w-4 h-4"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Allow late submissions with penalty
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCourseMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {updateCourseMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
  );
}