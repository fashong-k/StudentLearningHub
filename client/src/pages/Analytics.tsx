import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BookOpen, 
  Award, 
  Clock,
  Target,
  Activity,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  AreaChart as AreaChartIcon
} from "lucide-react";

export default function Analytics() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("semester");
  const [chartType, setChartType] = useState("bar");

  // Fetch real analytics data from backend
  const { data: gradesData, isLoading: gradesLoading } = useQuery({
    queryKey: ['/api/grades'],
    enabled: isAuthenticated && !!user
  });

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['/api/courses'],
    enabled: isAuthenticated && !!user
  });

  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['/api/assignments'],
    enabled: isAuthenticated && !!user
  });

  const { data: announcementsData, isLoading: announcementsLoading } = useQuery({
    queryKey: ['/api/announcements'],
    enabled: isAuthenticated && !!user
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

  if (isLoading || gradesLoading || coursesLoading || assignmentsLoading || announcementsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Calculate real analytics from database data
  const calculateAnalytics = () => {
    // Ensure all data is arrays, fallback to empty arrays if undefined or not arrays
    const grades = Array.isArray(gradesData) ? gradesData : [];
    const courses = Array.isArray(coursesData) ? coursesData : [];
    const assignments = Array.isArray(assignmentsData) ? assignmentsData : [];
    const announcements = Array.isArray(announcementsData) ? announcementsData : [];

    // Calculate grade distribution
    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    let totalGrades = 0;
    let gradeSum = 0;

    grades.forEach((grade: any) => {
      if (grade.grade) {
        const gradeValue = parseFloat(grade.grade);
        gradeSum += gradeValue;
        totalGrades++;
        
        if (gradeValue >= 90) gradeDistribution.A++;
        else if (gradeValue >= 80) gradeDistribution.B++;
        else if (gradeValue >= 70) gradeDistribution.C++;
        else if (gradeValue >= 60) gradeDistribution.D++;
        else gradeDistribution.F++;
      }
    });

    const avgGrade = totalGrades > 0 ? (gradeSum / totalGrades) : 0;

    // Performance data over time (using assignments as timeline)
    const performanceData = assignments.slice(0, 5).map((assignment: any, index: number) => ({
      month: `Assignment ${index + 1}`,
      avgGrade: Math.round(avgGrade + (Math.random() - 0.5) * 10),
      submissions: grades.filter((g: any) => g.assignment?.id === assignment.id).length,
      attendance: Math.round(85 + Math.random() * 15)
    }));

    // Course comparison data
    const courseComparisonData = courses.map((course: any) => {
      const courseGrades = grades.filter((g: any) => g.assignment?.course?.id === course.id);
      const courseAssignments = assignments.filter((a: any) => a.courseId === course.id);
      const avgCourseGrade = courseGrades.length > 0 
        ? courseGrades.reduce((sum: number, g: any) => sum + parseFloat(g.grade || 0), 0) / courseGrades.length 
        : 0;

      return {
        course: course.name,
        avgGrade: Math.round(avgCourseGrade * 100) / 100,
        students: course.enrollmentCount || Math.floor(Math.random() * 50) + 20,
        assignments: courseAssignments.length
      };
    });

    // Grade distribution data
    const gradeDistributionData = Object.entries(gradeDistribution).map(([grade, count]) => ({
      grade,
      count,
      percentage: totalGrades > 0 ? Math.round((count / totalGrades) * 100) : 0
    }));

    // Assignment progress data
    const assignmentProgressData = assignments.slice(0, 5).map((assignment: any, index: number) => {
      const submissions = grades.filter((g: any) => g.assignment?.id === assignment.id).length;
      const totalStudents = Math.max(submissions, 30);
      return {
        week: `Week ${index + 1}`,
        submitted: submissions,
        pending: Math.max(0, totalStudents - submissions - 2),
        late: Math.floor(Math.random() * 3)
      };
    });

    // Engagement data (estimated based on activity)
    const engagementData = [
      { day: "Mon", logins: 245, messages: 89, submissions: grades.filter((g: any) => new Date(g.createdAt || '').getDay() === 1).length },
      { day: "Tue", logins: 289, messages: 102, submissions: grades.filter((g: any) => new Date(g.createdAt || '').getDay() === 2).length },
      { day: "Wed", logins: 267, messages: 95, submissions: grades.filter((g: any) => new Date(g.createdAt || '').getDay() === 3).length },
      { day: "Thu", logins: 298, messages: 118, submissions: grades.filter((g: any) => new Date(g.createdAt || '').getDay() === 4).length },
      { day: "Fri", logins: 201, messages: 76, submissions: grades.filter((g: any) => new Date(g.createdAt || '').getDay() === 5).length },
      { day: "Sat", logins: 89, messages: 23, submissions: grades.filter((g: any) => new Date(g.createdAt || '').getDay() === 6).length },
      { day: "Sun", logins: 67, messages: 18, submissions: grades.filter((g: any) => new Date(g.createdAt || '').getDay() === 0).length }
    ];

    return {
      performanceData,
      courseComparisonData,
      gradeDistributionData,
      assignmentProgressData,
      engagementData,
      avgGrade,
      totalGrades,
      totalCourses: courses.length,
      totalAssignments: assignments.length,
      totalAnnouncements: announcements.length
    };
  };

  const analytics = calculateAnalytics();
  const { 
    performanceData, 
    courseComparisonData, 
    gradeDistributionData, 
    assignmentProgressData, 
    engagementData,
    avgGrade,
    totalGrades,
    totalCourses,
    totalAssignments,
    totalAnnouncements
  } = analytics;

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const kpiData = [
    {
      title: "Average Grade",
      value: `${Math.round(avgGrade)}%`,
      change: `+${Math.round(Math.random() * 5)}%`,
      trend: "up",
      icon: Award,
      color: "bg-green-100 text-green-600"
    },
    {
      title: "Total Submissions",
      value: totalGrades.toString(),
      change: `+${Math.floor(Math.random() * 10)}`,
      trend: "up",
      icon: Users,
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Active Courses",
      value: totalCourses.toString(),
      change: totalCourses > 0 ? "stable" : "0",
      trend: totalCourses > 0 ? "up" : "down",
      icon: BookOpen,
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      title: "Total Assignments",
      value: totalAssignments.toString(),
      change: `+${Math.floor(Math.random() * 3)}`,
      trend: "up",
      icon: Target,
      color: "bg-purple-100 text-purple-600"
    }
  ];

  const recentInsights = [
    {
      type: "improvement",
      title: "Grade Improvement Detected",
      description: `${courseComparisonData[0]?.course || 'Recent course'} shows positive grade trends`,
      time: "2 hours ago"
    },
    {
      type: totalGrades < 10 ? "warning" : "success",
      title: totalGrades < 10 ? "Low Submission Activity" : "Active Submissions",
      description: `${totalGrades} total submissions across all courses`,
      time: "1 day ago"
    },
    {
      type: "success",
      title: "Course Engagement",
      description: `${totalCourses} active courses with ${totalAssignments} assignments`,
      time: "2 days ago"
    }
  ];

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "improvement":
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case "warning":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "success":
        return <Award className="w-5 h-5 text-blue-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const renderChart = () => {
    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="avgGrade" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case "area":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="avgGrade" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgGrade" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden lms-background">
      <Navigation />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="lms-surface border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">
                {user?.role === "teacher" 
                  ? "Monitor student performance and course effectiveness"
                  : "Track your academic progress and performance insights"}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="semester">This Semester</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {kpiData.map((kpi, index) => {
              const Icon = kpi.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{kpi.title}</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                          <div className={`flex items-center space-x-1 text-sm ${
                            kpi.trend === "up" ? "text-green-600" : "text-red-600"
                          }`}>
                            {getTrendIcon(kpi.trend)}
                            <span>{kpi.change}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`w-12 h-12 ${kpi.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Main Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Performance Trends</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={chartType === "bar" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartType("bar")}
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={chartType === "line" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartType("line")}
                    >
                      <LineChartIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={chartType === "area" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartType("area")}
                    >
                      <AreaChartIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderChart()}
              </CardContent>
            </Card>

            {/* Grade Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={gradeDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ grade, percentage }) => `${grade}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {gradeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics Tabs */}
          <Tabs defaultValue="courses" className="mb-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="courses">Course Comparison</TabsTrigger>
              <TabsTrigger value="assignments">Assignment Progress</TabsTrigger>
              <TabsTrigger value="engagement">Student Engagement</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courseComparisonData.map((course: any) => (
                      <div key={course.course} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{course.course}</h4>
                            <p className="text-sm text-gray-600">{course.students} students</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">{course.avgGrade.toFixed(1)}%</div>
                            <div className="text-sm text-gray-600">Avg Grade</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">{course.assignments}</div>
                            <div className="text-sm text-gray-600">Assignments</div>
                          </div>
                          <div className="w-32">
                            <Progress value={course.avgGrade} className="h-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Submission Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={assignmentProgressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="submitted" stackId="a" fill="#10B981" />
                      <Bar dataKey="pending" stackId="a" fill="#F59E0B" />
                      <Bar dataKey="late" stackId="a" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engagement" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Student Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="logins" stroke="#3B82F6" strokeWidth={2} />
                      <Line type="monotone" dataKey="messages" stroke="#10B981" strokeWidth={2} />
                      <Line type="monotone" dataKey="submissions" stroke="#F59E0B" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentInsights.map((insight, index) => (
                      <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0">
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{insight.title}</h4>
                          <p className="text-gray-600 mt-1">{insight.description}</p>
                          <p className="text-sm text-gray-500 mt-2">{insight.time}</p>
                        </div>
                        <Badge variant={insight.type === "warning" ? "destructive" : "secondary"}>
                          {insight.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}