import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { safeFormat, safeFormatDistanceToNow } from "@/lib/dateUtils";
import { 
  Book, 
  Users, 
  Calendar, 
  Clock, 
  FileText, 
  MessageSquare,
  Edit,
  Trash2,
  Plus,
  ArrowLeft,
  UserPlus,
  UserMinus,
  BookOpen,
  GraduationCap,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Link, useParams, useLocation } from "wouter";
import Navigation from "@/components/Navigation";

export default function CourseView() {
  const { courseId } = useParams<{ courseId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { can } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Fetch course details
  const { data: course = {}, isLoading: courseLoading, error: courseError } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
    retry: false,
  });

  // Debug logging
  console.log('CourseView Debug:', {
    courseId,
    course,
    courseLoading,
    courseError,
    queryKey: [`/api/courses/${courseId}`]
  });

  // Fetch course assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: [`/api/assignments/${courseId}`],
    enabled: !!courseId,
    retry: false,
  });

  // Fetch course announcements
  const { data: announcements = [], isLoading: announcementsLoading } = useQuery({
    queryKey: [`/api/announcements/${courseId}`],
    enabled: !!courseId,
    retry: false,
  });

  // Fetch course enrollments (for teachers)
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery({
    queryKey: [`/api/enrollments/${courseId}`],
    enabled: !!courseId && can('canCreateCourses'),
    retry: false,
  });

  // Debug logging for all data
  console.log('CourseView Data Debug:', {
    courseId,
    course,
    assignments: assignments?.length || 0,
    announcements: announcements?.length || 0,
    enrollments: enrollments?.length || 0,
    assignmentsLoading,
    announcementsLoading,
    enrollmentsLoading
  });

  // Check if current user is enrolled (for students)
  useEffect(() => {
    if (user?.role === "student" && course) {
      // Check enrollment status
      const checkEnrollment = async () => {
        try {
          const userCourses = await apiRequest("GET", "/api/courses");
          const enrolled = userCourses.some((c: any) => c.id === parseInt(courseId!));
          setIsEnrolled(enrolled);
        } catch (error) {
          console.log("Error checking enrollment:", error);
        }
      };
      checkEnrollment();
    }
  }, [user, course, courseId]);

  // Enroll/unenroll mutations
  const enrollMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/courses/${courseId}/enroll`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Successfully enrolled in course" });
      setIsEnrolled(true);
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
      } else {
        toast({
          title: "Error",
          description: "Failed to enroll in course",
          variant: "destructive",
        });
      }
    },
  });

  const unenrollMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/courses/${courseId}/enroll`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Successfully unenrolled from course" });
      setIsEnrolled(false);
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
      } else {
        toast({
          title: "Error",
          description: "Failed to unenroll from course",
          variant: "destructive",
        });
      }
    },
  });

  if (courseLoading) {
    return (
      <div className="flex h-screen overflow-hidden lms-background">
        <Navigation />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex h-screen overflow-hidden lms-background">
        <Navigation />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
              <p className="text-gray-600 mb-6">The course you're looking for doesn't exist.</p>
              <Link href="/courses">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Courses
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden lms-background">
      <Navigation />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/courses">
            <Button variant="outline" size="sm" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{(course as any).title || 'Course Title'}</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {user?.role === "student" && (
            <Button
              onClick={() => isEnrolled ? unenrollMutation.mutate() : enrollMutation.mutate()}
              disabled={enrollMutation.isPending || unenrollMutation.isPending}
              variant={isEnrolled ? "outline" : "default"}
            >
              {isEnrolled ? (
                <>
                  <UserMinus className="w-4 h-4 mr-2" />
                  Unenroll
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Enroll
                </>
              )}
            </Button>
          )}
          
          {can('canCreateCourses') && (course as any).teacherId === user?.id && (
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit Course
            </Button>
          )}
        </div>
      </div>

      {/* Course Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Course Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-600 mb-4">
                {(course as any).description || 
                 `A comprehensive ${(course as any).courseCode || 'course'} covering fundamental concepts and practical applications.`}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{(course as any).semester} {(course as any).year}</span>
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{(course as any).teacher ? `${(course as any).teacher.firstName} ${(course as any).teacher.lastName}` : 'Unknown Teacher'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">{Array.isArray(assignments) ? assignments.length : 0}</div>
                  <div className="text-sm text-gray-600">Assignments</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-green-600">{Array.isArray(enrollments) ? enrollments.length : 0}</div>
                  <div className="text-sm text-gray-600">Students</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-purple-600">{Array.isArray(announcements) ? announcements.length : 0}</div>
                  <div className="text-sm text-gray-600">Announcements</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <Badge variant="outline" className="text-xs">
                    {(course as any).isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="assignments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
        </TabsList>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Assignments</h2>
            {can('canCreateCourses') && (course as any).teacherId === user?.id && (
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Assignment
              </Button>
            )}
          </div>
          
          {Array.isArray(assignments) && assignments.length > 0 ? (
            <div className="grid gap-4">
              {assignments.map((assignment: any) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <Badge variant={new Date(assignment.dueDate) < new Date() ? "destructive" : "default"}>
                        {new Date(assignment.dueDate) < new Date() ? "Overdue" : "Active"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{assignment.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        Due: {safeFormat(assignment.dueDate, "MMM d, yyyy 'at' h:mm a")}
                      </div>
                      <div className="text-sm font-medium">
                        {assignment.totalPoints} points
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No assignments yet</p>
            </div>
          )}
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Announcements</h2>
            {can('canCreateCourses') && (course as any).teacherId === user?.id && (
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Announcement
              </Button>
            )}
          </div>
          
          {Array.isArray(announcements) && announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement: any) => (
                <Card key={announcement.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      <span className="text-sm text-gray-500">
                        {safeFormatDistanceToNow(announcement.createdAt)} ago
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{announcement.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No announcements yet</p>
            </div>
          )}
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Enrolled Students</h2>
            <span className="text-sm text-gray-500">{Array.isArray(enrollments) ? enrollments.length : 0} students</span>
          </div>
          
          {Array.isArray(enrollments) && enrollments.length > 0 ? (
            <div className="grid gap-4">
              {enrollments.map((enrollment: any) => (
                <Card key={enrollment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {enrollment.student ? 
                              `${enrollment.student.firstName?.[0] || ''}${enrollment.student.lastName?.[0] || ''}` :
                              'ST'
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {enrollment.student ? 
                              `${enrollment.student.firstName || ''} ${enrollment.student.lastName || ''}` :
                              'Unknown Student'
                            }
                          </p>
                          <p className="text-sm text-gray-600">
                            {enrollment.student?.email || 'No email'}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        Enrolled {safeFormatDistanceToNow(enrollment.enrolledAt)} ago
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No students enrolled yet</p>
            </div>
          )}
        </TabsContent>

        {/* Discussions Tab */}
        <TabsContent value="discussions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Discussions</h2>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Discussion
            </Button>
          </div>
          
          <div className="text-center py-8">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Discussion feature coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  );
}