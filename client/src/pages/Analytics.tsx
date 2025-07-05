import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
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

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
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

  // Sample analytics data
  const performanceData = [
    { month: "Jan", avgGrade: 85, submissions: 120, attendance: 92 },
    { month: "Feb", avgGrade: 87, submissions: 135, attendance: 89 },
    { month: "Mar", avgGrade: 91, submissions: 142, attendance: 94 },
    { month: "Apr", avgGrade: 89, submissions: 128, attendance: 91 },
    { month: "May", avgGrade: 93, submissions: 155, attendance: 96 }
  ];

  const courseComparisonData = [
    { course: "CS 101", avgGrade: 87.5, students: 45, assignments: 12 },
    { course: "MATH 201", avgGrade: 91.2, students: 32, assignments: 15 },
    { course: "PSYC 101", avgGrade: 89.8, students: 67, assignments: 10 }
  ];

  const gradeDistributionData = [
    { grade: "A", count: 28, percentage: 35 },
    { grade: "B", count: 32, percentage: 40 },
    { grade: "C", count: 15, percentage: 19 },
    { grade: "D", count: 4, percentage: 5 },
    { grade: "F", count: 1, percentage: 1 }
  ];

  const assignmentProgressData = [
    { week: "Week 1", submitted: 95, pending: 5, late: 0 },
    { week: "Week 2", submitted: 88, pending: 8, late: 4 },
    { week: "Week 3", submitted: 92, pending: 6, late: 2 },
    { week: "Week 4", submitted: 85, pending: 10, late: 5 },
    { week: "Week 5", submitted: 90, pending: 7, late: 3 }
  ];

  const engagementData = [
    { day: "Mon", logins: 245, messages: 89, submissions: 67 },
    { day: "Tue", logins: 289, messages: 102, submissions: 73 },
    { day: "Wed", logins: 267, messages: 95, submissions: 81 },
    { day: "Thu", logins: 298, messages: 118, submissions: 59 },
    { day: "Fri", logins: 201, messages: 76, submissions: 45 },
    { day: "Sat", logins: 89, messages: 23, submissions: 12 },
    { day: "Sun", logins: 67, messages: 18, submissions: 8 }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const kpiData = [
    {
      title: "Average Grade",
      value: "89.5%",
      change: "+2.3%",
      trend: "up",
      icon: Award,
      color: "bg-green-100 text-green-600"
    },
    {
      title: "Active Students",
      value: "144",
      change: "+8",
      trend: "up",
      icon: Users,
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Assignment Completion",
      value: "92%",
      change: "-1.2%",
      trend: "down",
      icon: Target,
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      title: "Course Engagement",
      value: "87%",
      change: "+5.4%",
      trend: "up",
      icon: Activity,
      color: "bg-purple-100 text-purple-600"
    }
  ];

  const recentInsights = [
    {
      type: "improvement",
      title: "Grade Improvement Detected",
      description: "CS 101 students show 12% improvement in recent assignments",
      time: "2 hours ago"
    },
    {
      type: "warning",
      title: "Low Submission Rate",
      description: "MATH 201 assignment has 67% submission rate, below threshold",
      time: "1 day ago"
    },
    {
      type: "success",
      title: "High Engagement",
      description: "PSYC 101 discussion forum shows 95% student participation",
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
                    {courseComparisonData.map((course) => (
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