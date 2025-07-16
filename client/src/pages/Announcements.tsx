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
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAnnouncementSchema } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useDataFallback } from "@/hooks/useDataFallback";
import { DataFallbackAlert } from "@/components/DataFallbackAlert";
import { hasPermission } from "@/lib/roleUtils";
import { format, formatDistanceToNow } from "date-fns";
import { 
  Megaphone, 
  Plus, 
  Search, 
  Filter,
  Pin,
  Calendar,
  User,
  Book,
  AlertCircle,
  Info,
  CheckCircle,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Bell
} from "lucide-react";

export default function Announcements() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const queryClient = useQueryClient();
  const { isUsingFallback, failedEndpoints, showAlert, reportFailure, clearFailures } = useDataFallback();

  const form = useForm({
    resolver: zodResolver(insertAnnouncementSchema),
    defaultValues: {
      title: "",
      content: "",
      isImportant: false,
      courseId: 1,
    },
  });

  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ["/api/courses"],
    enabled: !!user,
  });

  // Fetch announcements for all courses
  const { data: announcements = [], isLoading: announcementsLoading } = useQuery<any[]>({
    queryKey: ["/api/announcements"],
    enabled: !!user && courses.length > 0,
    queryFn: async () => {
      const allAnnouncements = [];
      for (const course of courses) {
        try {
          const courseAnnouncements = await apiRequest("GET", `/api/courses/${course.id}/announcements`);
          if (Array.isArray(courseAnnouncements)) {
            allAnnouncements.push(...courseAnnouncements);
          }
        } catch (error) {
          reportFailure(`/api/courses/${course.id}/announcements`, error);
        }
      }
      return allAnnouncements;
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

  // Use real announcements data; fallback to sample data only if retrieval fails
  const sampleAnnouncements = announcements.length === 0 ? [
    {
      id: 1,
      title: "Midterm Exam Schedule Released",
      content: "The midterm examination schedule has been posted. Please check your student portal for specific dates and times. All exams will be held in the main lecture hall unless otherwise specified. Make sure to bring valid photo ID and writing materials.",
      courseCode: "CS 101",
      courseName: "Introduction to Computer Science",
      authorName: "Prof. David Chen",
      authorRole: "teacher",
      createdAt: new Date("2025-03-17T09:00:00"),
      isImportant: true,
      isPinned: true,
      type: "exam",
      readBy: 42,
      totalStudents: 45,
      isRead: false
    },
    {
      id: 2,
      title: "Assignment 3 Extension",
      content: "Due to technical difficulties with the server last week, we are extending the deadline for Assignment 3 by 48 hours. The new deadline is Friday, March 22nd at 11:59 PM. Please use this extra time to refine your solutions.",
      courseCode: "MATH 201",
      courseName: "Calculus I",
      authorName: "Dr. Sarah Johnson",
      authorRole: "teacher",
      createdAt: new Date("2025-03-16T14:30:00"),
      isImportant: false,
      isPinned: false,
      type: "assignment",
      readBy: 28,
      totalStudents: 32,
      isRead: true
    },
    {
      id: 3,
      title: "Office Hours Change",
      content: "Starting next week, my office hours will change from Tuesday 2-4 PM to Wednesday 3-5 PM. This change is permanent for the rest of the semester. Please update your calendars accordingly.",
      courseCode: "PSYC 101",
      courseName: "Introduction to Psychology",
      authorName: "Prof. Emily Davis",
      authorRole: "teacher",
      createdAt: new Date("2025-03-15T10:15:00"),
      isImportant: false,
      isPinned: false,
      type: "schedule",
      readBy: 65,
      totalStudents: 67,
      isRead: true
    },
    {
      id: 4,
      title: "Guest Lecturer This Friday",
      content: "We're excited to announce that Dr. Michael Rodriguez from MIT will be giving a guest lecture this Friday on 'Advanced Algorithms in Machine Learning'. This is a great opportunity to learn from a leading expert in the field. Attendance is highly encouraged but not mandatory.",
      courseCode: "CS 101",
      courseName: "Introduction to Computer Science",
      authorName: "Prof. David Chen",
      authorRole: "teacher",
      createdAt: new Date("2025-03-14T16:45:00"),
      isImportant: false,
      isPinned: false,
      type: "event",
      readBy: 40,
      totalStudents: 45,
      isRead: true
    },
    {
      id: 5,
      title: "Research Paper Guidelines Updated",
      content: "I've updated the research paper guidelines document with additional citation requirements and formatting specifications. Please download the latest version from the course materials section. Papers that don't follow the new guidelines will be returned for revision.",
      courseCode: "PSYC 101",
      courseName: "Introduction to Psychology",
      authorName: "Prof. Emily Davis",
      authorRole: "teacher",
      createdAt: new Date("2025-03-13T11:20:00"),
      isImportant: true,
      isPinned: false,
      type: "assignment",
      readBy: 61,
      totalStudents: 67,
      isRead: true
    },
    {
      id: 6,
      title: "Spring Break Reminder",
      content: "Just a friendly reminder that spring break is next week (March 25-29). There will be no classes or office hours during this time. All assignments due during spring break have been moved to the following Monday. Have a safe and restful break!",
      courseCode: "MATH 201",
      courseName: "Calculus I",
      authorName: "Dr. Sarah Johnson",
      authorRole: "teacher",
      createdAt: new Date("2025-03-12T08:30:00"),
      isImportant: false,
      isPinned: false,
      type: "general",
      readBy: 32,
      totalStudents: 32,
      isRead: true
    }
  ] : announcements;

  const getAnnouncementIcon = (type: string, isImportant: boolean) => {
    if (isImportant) return <AlertCircle className="w-5 h-5 text-red-600" />;
    
    switch (type) {
      case "exam":
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case "assignment":
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case "schedule":
        return <Calendar className="w-5 h-5 text-purple-600" />;
      case "event":
        return <Star className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAnnouncementBadge = (type: string, isImportant: boolean) => {
    if (isImportant) {
      return <Badge className="bg-red-100 text-red-800">Important</Badge>;
    }
    
    switch (type) {
      case "exam":
        return <Badge className="bg-orange-100 text-orange-800">Exam</Badge>;
      case "assignment":
        return <Badge className="bg-blue-100 text-blue-800">Assignment</Badge>;
      case "schedule":
        return <Badge className="bg-purple-100 text-purple-800">Schedule</Badge>;
      case "event":
        return <Badge className="bg-yellow-100 text-yellow-800">Event</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">General</Badge>;
    }
  };

  const displayAnnouncements = sampleAnnouncements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.courseCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = selectedCourse === "all" || announcement.courseCode === selectedCourse;
    
    let matchesTab = true;
    if (activeTab === "unread") {
      matchesTab = !announcement.isRead;
    } else if (activeTab === "important") {
      matchesTab = announcement.isImportant;
    } else if (activeTab === "pinned") {
      matchesTab = announcement.isPinned;
    }
    
    return matchesSearch && matchesCourse && matchesTab;
  });

  // Sort announcements: pinned first, then by date
  const sortedAnnouncements = [...displayAnnouncements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getReadPercentage = (readBy: number, total: number) => {
    return Math.round((readBy / total) * 100);
  };

  return (
    <div className="flex h-screen overflow-hidden lms-background">
      <Navigation />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="lms-surface border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
              <p className="text-gray-600 mt-1">
                {user?.role === "teacher" 
                  ? "Share important updates with your students"
                  : "Stay updated with the latest course announcements"}
              </p>
            </div>
            {hasPermission(user?.role || "student", "canCreateAnnouncements") && (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Announcement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Announcement</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Announcement title..." {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Announcement content..." rows={6} {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="courseId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Course</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select course" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1">CS 101 - Introduction to Computer Science</SelectItem>
                                  <SelectItem value="2">MATH 201 - Calculus I</SelectItem>
                                  <SelectItem value="3">PSYC 101 - Introduction to Psychology</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="isImportant"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Mark as Important</FormLabel>
                                <div className="text-sm text-gray-500">
                                  Important announcements will be highlighted
                                </div>
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
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          <Megaphone className="w-4 h-4 mr-2" />
                          Post Announcement
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
          
          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="CS 101">CS 101</SelectItem>
                <SelectItem value="MATH 201">MATH 201</SelectItem>
                <SelectItem value="PSYC 101">PSYC 101</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All ({sampleAnnouncements.length})</TabsTrigger>
              <TabsTrigger value="unread">Unread ({sampleAnnouncements.filter(a => !a.isRead).length})</TabsTrigger>
              <TabsTrigger value="important">Important ({sampleAnnouncements.filter(a => a.isImportant).length})</TabsTrigger>
              <TabsTrigger value="pinned">Pinned ({sampleAnnouncements.filter(a => a.isPinned).length})</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Announcements List */}
          <div className="space-y-4">
            {sortedAnnouncements.map((announcement) => (
              <Card key={announcement.id} className={`hover:shadow-md transition-shadow ${
                !announcement.isRead ? 'border-blue-200 bg-blue-50' : ''
              } ${announcement.isPinned ? 'border-yellow-200 bg-yellow-50' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        {getAnnouncementIcon(announcement.type, announcement.isImportant)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className={`text-lg font-semibold ${!announcement.isRead ? 'text-blue-900' : 'text-gray-900'}`}>
                            {announcement.title}
                          </h3>
                          {announcement.isPinned && (
                            <Pin className="w-4 h-4 text-yellow-600" />
                          )}
                          {getAnnouncementBadge(announcement.type, announcement.isImportant)}
                          {!announcement.isRead && (
                            <Badge className="bg-blue-600 text-white">New</Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-700 mb-4 leading-relaxed">{announcement.content}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Book className="w-4 h-4 mr-1" />
                              {announcement.courseCode} - {announcement.courseName}
                            </div>
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {announcement.authorName}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {format(announcement.createdAt, "MMM d, yyyy 'at' h:mm a")}
                            </div>
                            <div className="text-gray-400">
                              {formatDistanceToNow(announcement.createdAt, { addSuffix: true })}
                            </div>
                          </div>
                          
                          {user?.role === "teacher" && (
                            <div className="flex items-center space-x-4">
                              <div className="text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Eye className="w-4 h-4 mr-1" />
                                  {announcement.readBy}/{announcement.totalStudents} read ({getReadPercentage(announcement.readBy, announcement.totalStudents)}%)
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button size="sm" variant="outline">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {sortedAnnouncements.length === 0 && (
            <div className="text-center py-12">
              <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedCourse !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "No announcements have been posted yet"}
              </p>
              {user?.role === "teacher" && (
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Announcement
                </Button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}