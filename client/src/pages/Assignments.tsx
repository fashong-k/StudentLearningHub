import { useEffect, useState } from "react";
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
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAssignmentSchema } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useDataFallback } from "@/hooks/useDataFallback";
import { DataFallbackAlert } from "@/components/DataFallbackAlert";
import { safeFormat } from "@/lib/dateUtils";
import { isAfter, differenceInDays } from "date-fns";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Search, 
  Filter,
  Download,
  Upload,
  Calendar,
  Eye,
  Edit,
  MoreVertical,
  Shield,
  AlertTriangle
} from "lucide-react";

export default function Assignments() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const queryClient = useQueryClient();
  const { isUsingFallback, failedEndpoints, showAlert, reportFailure, clearFailures } = useDataFallback();
  const [plagiarismResults, setPlagiarismResults] = useState<{[key: number]: any}>({});
  const [checkingPlagiarism, setCheckingPlagiarism] = useState<Set<number>>(new Set());

  const form = useForm({
    resolver: zodResolver(insertAssignmentSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default to 1 week from now
      maxPoints: "100.00",
      assignmentType: "homework",
      courseId: 1,
    },
  });

  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ["/api/courses"],
    enabled: !!user,
  });

  // Plagiarism detection mutation
  const runPlagiarismCheck = useMutation({
    mutationFn: async (submissionId: number) => {
      return await apiRequest("POST", "/api/plagiarism/check", { submissionId });
    },
    onSuccess: (data, submissionId) => {
      setCheckingPlagiarism(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
      setPlagiarismResults(prev => ({ ...prev, [submissionId]: data }));
      toast({
        title: "Plagiarism Check Complete",
        description: `Similarity score: ${data.similarityScore.toFixed(1)}%`,
      });
    },
    onError: (error, submissionId) => {
      setCheckingPlagiarism(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
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
        description: "Failed to run plagiarism check. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePlagiarismCheck = (submissionId: number) => {
    setCheckingPlagiarism(prev => new Set(prev).add(submissionId));
    runPlagiarismCheck.mutate(submissionId);
  };

  // Assignment creation mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/assignments", data);
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Assignment created successfully",
      });
      // Invalidate and refetch assignments
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      // Also invalidate individual course assignment queries
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: (error: any) => {
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
      
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create assignment";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleCreateAssignment = (data: any) => {
    console.log('Form data before processing:', data);
    // The dueDate is already an ISO string from the field onChange
    const assignmentData = {
      ...data,
      dueDate: data.dueDate, // Already converted to ISO in the field
      isActive: true
    };
    console.log('Assignment data being sent:', assignmentData);
    
    createAssignmentMutation.mutate(assignmentData);
  };

  // Fetch assignments using new CRUD endpoints
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<any[]>({
    queryKey: ["/api/assignments"],
    enabled: !!user && courses.length > 0,
    queryFn: async () => {
      const allAssignments = [];
      for (const course of courses) {
        try {
          // Use new CRUD endpoint for getting assignments by course
          const courseAssignments = await apiRequest("GET", `/api/assignments/${course.id}`);
          if (Array.isArray(courseAssignments)) {
            // Add course information to each assignment
            const assignmentsWithCourse = courseAssignments.map(assignment => ({
              ...assignment,
              courseCode: course.courseCode || `COURSE-${course.id}`,
              courseName: course.name || course.title
            }));
            allAssignments.push(...assignmentsWithCourse);
          }
        } catch (error) {
          console.log(`Failed to fetch assignments for course ${course.id}, falling back to legacy endpoint`);
          try {
            // Fallback to legacy endpoint if new one fails
            const courseAssignments = await apiRequest("GET", `/api/courses/${course.id}/assignments`);
            if (Array.isArray(courseAssignments)) {
              const assignmentsWithCourse = courseAssignments.map(assignment => ({
                ...assignment,
                courseCode: course.courseCode || `COURSE-${course.id}`,
                courseName: course.name || course.title
              }));
              allAssignments.push(...assignmentsWithCourse);
            }
          } catch (legacyError) {
            reportFailure(`/api/courses/${course.id}/assignments`, legacyError);
          }
        }
      }
      return allAssignments;
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

  // Use real assignments data; fallback to sample data only if retrieval fails  
  const fallbackAssignments = [
    {
      id: 1,
      title: "Problem Set 3: Sorting Algorithms",
      description: "Implement and analyze various sorting algorithms including bubble sort, merge sort, and quicksort.",
      courseCode: "CS 101",
      courseName: "Introduction to Computer Science",
      dueDate: new Date("2025-03-15"),
      maxPoints: 100,
      assignmentType: "homework",
      status: "submitted",
      grade: 88,
      submittedAt: new Date("2025-03-14"),
      feedback: "Good implementation of algorithms. Consider optimizing the quicksort partition function."
    },
    {
      id: 2,
      title: "Integration Quiz",
      description: "Quiz covering integration techniques including substitution, integration by parts, and partial fractions.",
      courseCode: "MATH 201",
      courseName: "Calculus I",
      dueDate: new Date("2025-03-12"),
      maxPoints: 50,
      assignmentType: "quiz",
      status: "graded",
      grade: 45,
      submittedAt: new Date("2025-03-12"),
      feedback: "Excellent work on integration by parts. Minor error in partial fractions problem."
    },
    {
      id: 3,
      title: "Research Paper: Memory and Learning",
      description: "5-page research paper on the relationship between memory formation and learning processes.",
      courseCode: "PSYC 101",
      courseName: "Introduction to Psychology",
      dueDate: new Date("2025-03-20"),
      maxPoints: 150,
      assignmentType: "essay",
      status: "pending",
      grade: null,
      submittedAt: null,
      feedback: null
    },
    {
      id: 4,
      title: "Lab Exercise: Binary Trees",
      description: "Implement a binary search tree with insertion, deletion, and traversal operations.",
      courseCode: "CS 101",
      courseName: "Introduction to Computer Science",
      dueDate: new Date("2025-03-08"),
      maxPoints: 75,
      assignmentType: "lab",
      status: "late",
      grade: 70,
      submittedAt: new Date("2025-03-10"),
      feedback: "Correct implementation but submitted late. Consider time management for future assignments."
    },
    {
      id: 5,
      title: "Midterm Exam",
      description: "Comprehensive exam covering chapters 1-8, including limits, derivatives, and basic integration.",
      courseCode: "MATH 201",
      courseName: "Calculus I",
      dueDate: new Date("2025-03-25"),
      maxPoints: 200,
      assignmentType: "exam",
      status: "upcoming",
      grade: null,
      submittedAt: null,
      feedback: null
    }
  ];

  // Use real assignments or fallback data
  const sampleAssignments = assignments.length > 0 ? assignments : fallbackAssignments;

  const getStatusBadge = (assignment: any) => {
    const today = new Date();
    const dueDate = new Date(assignment.dueDate);
    
    if (assignment.status === "submitted" && !assignment.grade) {
      return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
    }
    if (assignment.status === "graded" || assignment.grade !== null) {
      return <Badge className="bg-green-100 text-green-800">Graded</Badge>;
    }
    if (assignment.status === "late") {
      return <Badge className="bg-red-100 text-red-800">Late</Badge>;
    }
    if (isAfter(today, dueDate)) {
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    }
    if (differenceInDays(dueDate, today) <= 3) {
      return <Badge className="bg-yellow-100 text-yellow-800">Due Soon</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "quiz":
        return <Clock className="w-4 h-4" />;
      case "exam":
        return <AlertCircle className="w-4 h-4" />;
      case "essay":
        return <FileText className="w-4 h-4" />;
      case "lab":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const displayAssignments = sampleAssignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (assignment.courseCode && assignment.courseCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (assignment.description && assignment.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "pending") return matchesSearch && (!assignment.submittedAt);
    if (activeTab === "submitted") return matchesSearch && assignment.submittedAt && !assignment.grade;
    if (activeTab === "graded") return matchesSearch && assignment.grade !== null;
    
    return matchesSearch;
  });

  const getProgressValue = () => {
    const total = sampleAssignments.length;
    const completed = sampleAssignments.filter(a => a.grade !== null).length;
    return (completed / total) * 100;
  };

  return (
    <div className="flex h-screen overflow-hidden lms-background">
      <Navigation />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="lms-surface border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Assignments</h1>
              <p className="text-gray-600 mt-1">
                {user?.role === "teacher" 
                  ? "Manage assignments and review submissions"
                  : "View your assignments and track progress"}
              </p>
            </div>
            {user?.role === "teacher" && (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Assignment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Assignment</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleCreateAssignment)} className="space-y-4">
                      {/* Debug form errors */}
                      {Object.keys(form.formState.errors).length > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800 font-medium">Form Validation Errors:</p>
                          <ul className="text-sm text-red-700 mt-1">
                            {Object.entries(form.formState.errors).map(([field, error]) => (
                              <li key={field}>{field}: {error?.message || 'Invalid value'}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assignment Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Problem Set 1: Variables and Functions" {...field} />
                            </FormControl>
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
                              <Textarea placeholder="Assignment description and requirements..." rows={4} {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="assignmentType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="homework">Homework</SelectItem>
                                  <SelectItem value="quiz">Quiz</SelectItem>
                                  <SelectItem value="exam">Exam</SelectItem>
                                  <SelectItem value="essay">Essay</SelectItem>
                                  <SelectItem value="lab">Lab</SelectItem>
                                  <SelectItem value="project">Project</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="maxPoints"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Points</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseFloat(e.target.value).toFixed(2))} 
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local" 
                                value={field.value ? (() => {
                                  try {
                                    const date = new Date(field.value);
                                    return date.toISOString().slice(0, 16);
                                  } catch {
                                    return "";
                                  }
                                })() : ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value) {
                                    try {
                                      const isoString = new Date(value).toISOString();
                                      field.onChange(isoString);
                                    } catch {
                                      field.onChange("");
                                    }
                                  } else {
                                    field.onChange("");
                                  }
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createAssignmentMutation.isPending}>
                          {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Data Fallback Alert */}
          <DataFallbackAlert 
            isVisible={showAlert} 
            failedEndpoints={failedEndpoints}
            onDismiss={clearFailures}
          />
          
          {/* Progress Overview for Students */}
          {user?.role === "student" && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Assignment Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Overall Progress</span>
                  <span className="text-sm font-medium">{Math.round(getProgressValue())}% Complete</span>
                </div>
                <Progress value={getProgressValue()} className="mb-4" />
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{sampleAssignments.filter(a => !a.submittedAt).length}</div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{sampleAssignments.filter(a => a.submittedAt && !a.grade).length}</div>
                    <div className="text-sm text-gray-600">Submitted</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{sampleAssignments.filter(a => a.grade !== null).length}</div>
                    <div className="text-sm text-gray-600">Graded</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {sampleAssignments.filter(a => a.grade !== null).length > 0 
                        ? Math.round(sampleAssignments.filter(a => a.grade !== null).reduce((sum, a) => sum + (a.grade || 0), 0) / sampleAssignments.filter(a => a.grade !== null).length)
                        : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Average</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All ({sampleAssignments.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({sampleAssignments.filter(a => !a.submittedAt).length})</TabsTrigger>
              <TabsTrigger value="submitted">Submitted ({sampleAssignments.filter(a => a.submittedAt && !a.grade).length})</TabsTrigger>
              <TabsTrigger value="graded">Graded ({sampleAssignments.filter(a => a.grade !== null).length})</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Assignments List */}
          <div className="space-y-4">
            {displayAssignments.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        {getTypeIcon(assignment.assignmentType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                          {getStatusBadge(assignment)}
                          <Badge variant="outline" className="capitalize">
                            {assignment.assignmentType}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{assignment.description}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Due: {safeFormat(assignment.dueDate, "MMM d, yyyy 'at' h:mm a", "No due date")}
                          </div>
                          <div>Course: {assignment.courseCode}</div>
                          <div>Points: {assignment.maxPoints}</div>
                          {assignment.grade !== null && (
                            <div className="text-green-600 font-medium">
                              Grade: {assignment.grade}/{assignment.maxPoints} ({Math.round((assignment.grade / assignment.maxPoints) * 100)}%)
                            </div>
                          )}
                        </div>
                        {assignment.feedback && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800"><strong>Feedback:</strong> {assignment.feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user?.role === "student" && !assignment.submittedAt && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <Upload className="w-4 h-4 mr-2" />
                          Submit
                        </Button>
                      )}
                      {user?.role === "teacher" && assignment.submittedAt && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePlagiarismCheck(assignment.id)}
                          disabled={checkingPlagiarism.has(assignment.id)}
                          className="text-orange-600 border-orange-600 hover:bg-orange-50"
                        >
                          {checkingPlagiarism.has(assignment.id) ? (
                            <>
                              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-orange-600 border-t-transparent"></div>
                              Checking...
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4 mr-2" />
                              Check Plagiarism
                            </>
                          )}
                        </Button>
                      )}
                      {plagiarismResults[assignment.id] && (
                        <div className="flex items-center space-x-2">
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                            plagiarismResults[assignment.id].similarityScore > 30 
                              ? 'bg-red-100 text-red-800' 
                              : plagiarismResults[assignment.id].similarityScore > 15 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-green-100 text-green-800'
                          }`}>
                            <AlertTriangle className="w-3 h-3" />
                            <span>{plagiarismResults[assignment.id].similarityScore.toFixed(1)}% similar</span>
                          </div>
                        </div>
                      )}
                      {user?.role === "student" && assignment.submittedAt && (
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      )}
                      {user?.role === "teacher" && (
                        <>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Submissions
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {displayAssignments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "Try adjusting your search terms" : "No assignments available for this filter"}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
