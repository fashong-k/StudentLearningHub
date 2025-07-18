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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Sector,
  AreaChart,
  Area,
  ScatterChart,
  Scatter
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
  AreaChart as AreaChartIcon,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Zap
} from "lucide-react";

export default function Analytics() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("semester");
  const [chartType, setChartType] = useState("bar");
  const [activeTab, setActiveTab] = useState("overview");

  // Determine course filter based on user role and selection
  const courseFilter = selectedCourse === "all" ? undefined : parseInt(selectedCourse);

  // Fetch courses for dropdown
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['/api/courses'],
    enabled: isAuthenticated && !!user
  });

  // Fetch advanced analytics data
  const { data: advancedAnalytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['/api/analytics/advanced', { courseId: courseFilter }],
    enabled: isAuthenticated && !!user && user.role !== 'student'
  });

  const { data: performanceTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['/api/analytics/performance-trends', { courseId: courseFilter }],
    enabled: isAuthenticated && !!user
  });

  const { data: atRiskStudents, isLoading: atRiskLoading } = useQuery({
    queryKey: ['/api/analytics/at-risk-students', { courseId: courseFilter }],
    enabled: isAuthenticated && !!user && user.role !== 'student'
  });

  const { data: engagementMetrics, isLoading: engagementLoading } = useQuery({
    queryKey: ['/api/analytics/engagement', { courseId: courseFilter }],
    enabled: isAuthenticated && !!user && user.role !== 'student'
  });

  const { data: assignmentAnalytics, isLoading: assignmentLoading } = useQuery({
    queryKey: ['/api/analytics/assignments', { courseId: courseFilter }],
    enabled: isAuthenticated && !!user && user.role !== 'student'
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view analytics</h1>
          <Button onClick={() => window.location.href = "/login"}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Student view - limited analytics
  if (user?.role === 'student') {
    return (
      <div className="flex h-screen overflow-hidden lms-background">
        <Navigation />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Performance Analytics</h1>
              <p className="text-gray-600">Track your academic progress and performance trends</p>
            </div>

            {trendsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-32 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <StudentAnalytics 
                performanceTrends={performanceTrends || []} 
                courseFilter={courseFilter}
                courses={coursesData || []}
                onCourseChange={setSelectedCourse}
                selectedCourse={selectedCourse}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Teacher/Admin view - comprehensive analytics
  const isDataLoading = analyticsLoading || trendsLoading || atRiskLoading || engagementLoading || assignmentLoading;

  return (
    <div className="flex h-screen overflow-hidden lms-background">
      <Navigation />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Analytics Dashboard</h1>
                <p className="text-gray-600">Comprehensive insights into student performance and engagement</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => refetchAnalytics()}
                  disabled={isDataLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isDataLoading ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {Array.isArray(coursesData) && coursesData.map((course: any) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.courseCode} - {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isDataLoading ? (
            <AnalyticsLoading />
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="engagement">Engagement</TabsTrigger>
                <TabsTrigger value="at-risk">At Risk</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <OverviewTab 
                  analytics={advancedAnalytics} 
                  engagementMetrics={engagementMetrics || []}
                  chartType={chartType}
                  onChartTypeChange={setChartType}
                />
              </TabsContent>
              
              <TabsContent value="performance">
                <PerformanceTab 
                  performanceTrends={performanceTrends || []} 
                  analytics={advancedAnalytics}
                />
              </TabsContent>
              
              <TabsContent value="engagement">
                <EngagementTab 
                  engagementMetrics={engagementMetrics || []}
                  analytics={advancedAnalytics}
                />
              </TabsContent>
              
              <TabsContent value="at-risk">
                <AtRiskTab 
                  atRiskStudents={atRiskStudents || []}
                  analytics={advancedAnalytics}
                />
              </TabsContent>
              
              <TabsContent value="assignments">
                <AssignmentsTab 
                  assignmentAnalytics={assignmentAnalytics || []}
                  analytics={advancedAnalytics}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}

// Analytics Tab Components
function AnalyticsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StudentAnalytics({ performanceTrends, courseFilter, courses, onCourseChange, selectedCourse }: any) {
  const processedData = performanceTrends.map((trend: any, index: number) => ({
    assignment: trend.assignmentTitle,
    grade: trend.grade,
    course: trend.courseTitle,
    isLate: trend.isLate,
    order: index + 1
  }));

  const avgGrade = processedData.length > 0 
    ? processedData.reduce((sum: number, item: any) => sum + item.grade, 0) / processedData.length 
    : 0;

  const lateCount = processedData.filter((item: any) => item.isLate).length;
  const onTimeCount = processedData.length - lateCount;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-blue-600" />
              Average Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{avgGrade.toFixed(1)}%</div>
            <p className="text-sm text-gray-600">Across all assignments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              On Time Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{onTimeCount}</div>
            <p className="text-sm text-gray-600">Submitted on time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-600" />
              Late Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{lateCount}</div>
            <p className="text-sm text-gray-600">Submitted late</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="order" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="grade" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function OverviewTab({ analytics, engagementMetrics, chartType, onChartTypeChange }: any) {
  if (!analytics) return <div>No analytics data available</div>;

  const gradeDistributionData = [
    { grade: 'A', count: analytics.gradeDistribution.A, color: '#10B981' },
    { grade: 'B', count: analytics.gradeDistribution.B, color: '#3B82F6' },
    { grade: 'C', count: analytics.gradeDistribution.C, color: '#F59E0B' },
    { grade: 'D', count: analytics.gradeDistribution.D, color: '#EF4444' },
    { grade: 'F', count: analytics.gradeDistribution.F, color: '#8B5CF6' }
  ].filter(item => item.count > 0); // Only show grades with actual counts

  const kpiData = [
    {
      title: "Total Students",
      value: analytics.totalStudents,
      icon: Users,
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Average Grade",
      value: `${analytics.averageGrade.toFixed(1)}%`,
      icon: Award,
      color: "bg-green-100 text-green-600"
    },
    {
      title: "Total Submissions",
      value: analytics.totalSubmissions,
      icon: Target,
      color: "bg-purple-100 text-purple-600"
    },
    {
      title: "Late Submissions",
      value: analytics.lateSubmissions,
      icon: Clock,
      color: "bg-orange-100 text-orange-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                </div>
                <div className={`p-3 rounded-full ${kpi.color}`}>
                  <kpi.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  label={({ grade, count }) => `${grade}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  activeIndex={0}
                  activeShape={(props: any) => {
                    const RADIAN = Math.PI / 180;
                    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
                    const sin = Math.sin(-RADIAN * midAngle);
                    const cos = Math.cos(-RADIAN * midAngle);
                    const sx = cx + (outerRadius + 10) * cos;
                    const sy = cy + (outerRadius + 10) * sin;
                    const mx = cx + (outerRadius + 30) * cos;
                    const my = cy + (outerRadius + 30) * sin;
                    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
                    const ey = my;
                    const textAnchor = cos >= 0 ? 'start' : 'end';

                    return (
                      <g>
                        <Sector
                          cx={cx}
                          cy={cy}
                          innerRadius={innerRadius}
                          outerRadius={outerRadius}
                          startAngle={startAngle}
                          endAngle={endAngle}
                          fill={fill}
                        />
                        <Sector
                          cx={cx}
                          cy={cy}
                          startAngle={startAngle}
                          endAngle={endAngle}
                          innerRadius={outerRadius + 6}
                          outerRadius={outerRadius + 10}
                          fill={fill}
                        />
                        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
                        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
                        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">
                          {`${payload.grade}: ${payload.count}`}
                        </text>
                      </g>
                    );
                  }}
                >
                  {gradeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any, props: any) => [
                    `${value} students`, 
                    `Grade ${props.payload.grade}`
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course Engagement Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {engagementMetrics.slice(0, 5).map((course: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{course.courseTitle}</p>
                    <p className="text-sm text-gray-600">{course.enrolledStudents} students</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{course.engagementRate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">engagement</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PerformanceTab({ performanceTrends, analytics }: any) {
  if (!performanceTrends || !analytics) return <div>No performance data available</div>;

  const processedTrends = performanceTrends.map((trend: any, index: number) => ({
    assignment: trend.assignmentTitle.substring(0, 20) + "...",
    grade: trend.grade,
    course: trend.courseTitle,
    order: index + 1
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average Grade</span>
                <span className="font-bold">{analytics.averageGrade.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Submissions</span>
                <span className="font-bold">{analytics.totalSubmissions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Late Submissions</span>
                <span className="font-bold text-orange-600">{analytics.lateSubmissions}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grade Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">A grades</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {analytics.gradeDistribution.A}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">B grades</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {analytics.gradeDistribution.B}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">C grades</span>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  {analytics.gradeDistribution.C}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">D grades</span>
                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                  {analytics.gradeDistribution.D}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">F grades</span>
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  {analytics.gradeDistribution.F}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">
                {analytics.totalSubmissions > 0 ? 
                  (((analytics.gradeDistribution.A + analytics.gradeDistribution.B + analytics.gradeDistribution.C) / analytics.totalSubmissions) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-sm text-gray-600">Students passing (C+ or better)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={processedTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="order" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="grade" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function EngagementTab({ engagementMetrics, analytics }: any) {
  if (!engagementMetrics || !analytics) return <div>No engagement data available</div>;

  const sortedCourses = engagementMetrics.sort((a: any, b: any) => b.engagementRate - a.engagementRate);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{analytics.totalCourses}</div>
            <p className="text-sm text-gray-600">Active courses</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Avg Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {engagementMetrics.length > 0 ? 
                (engagementMetrics.reduce((sum: number, course: any) => sum + course.engagementRate, 0) / engagementMetrics.length).toFixed(1) : 0}%
            </div>
            <p className="text-sm text-gray-600">Across all courses</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Performer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-600">
              {sortedCourses[0]?.courseCode || 'N/A'}
            </div>
            <p className="text-sm text-gray-600">
              {sortedCourses[0]?.engagementRate.toFixed(1)}% engagement
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {engagementMetrics.reduce((sum: number, course: any) => sum + course.totalMessages, 0)}
            </div>
            <p className="text-sm text-gray-600">Course messages</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Engagement Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sortedCourses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="courseCode" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="engagementRate" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function AtRiskTab({ atRiskStudents, analytics }: any) {
  if (!atRiskStudents || !analytics) return <div>No at-risk data available</div>;

  const getRiskLevel = (student: any) => {
    const riskCount = Object.values(student.riskFactors).filter(Boolean).length;
    if (riskCount >= 3) return { level: 'High', color: 'bg-red-100 text-red-800' };
    if (riskCount >= 2) return { level: 'Medium', color: 'bg-orange-100 text-orange-800' };
    return { level: 'Low', color: 'bg-yellow-100 text-yellow-800' };
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              At-Risk Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{atRiskStudents.length}</div>
            <p className="text-sm text-gray-600">Need attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <XCircle className="h-5 w-5 mr-2 text-orange-600" />
              Missing Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{analytics.missingAssignments}</div>
            <p className="text-sm text-gray-600">Total overdue</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-yellow-600" />
              Late Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{analytics.lateSubmissions}</div>
            <p className="text-sm text-gray-600">Total late</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>At-Risk Student Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {atRiskStudents.map((student: any, index: number) => {
              const risk = getRiskLevel(student);
              return (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{student.studentName}</p>
                    <p className="text-sm text-gray-600">{student.email}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm">
                        Grade: <span className="font-bold">{student.averageGrade.toFixed(1)}%</span>
                      </span>
                      <span className="text-sm">
                        Missing: <span className="font-bold">{student.missingAssignments}</span>
                      </span>
                      <span className="text-sm">
                        Late: <span className="font-bold">{student.lateSubmissions}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={risk.color}>{risk.level} Risk</Badge>
                    <div className="text-sm text-gray-600 mt-1">
                      {student.enrolledCourses} courses
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AssignmentsTab({ assignmentAnalytics, analytics }: any) {
  if (!assignmentAnalytics || !analytics) return <div>No assignment data available</div>;

  const sortedAssignments = assignmentAnalytics.sort((a: any, b: any) => b.completionRate - a.completionRate);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{analytics.totalAssignments}</div>
            <p className="text-sm text-gray-600">Across all courses</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Avg Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {assignmentAnalytics.length > 0 ? 
                (assignmentAnalytics.reduce((sum: number, assignment: any) => sum + assignment.completionRate, 0) / assignmentAnalytics.length).toFixed(1) : 0}%
            </div>
            <p className="text-sm text-gray-600">Completion rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Avg Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {assignmentAnalytics.length > 0 ? 
                (assignmentAnalytics.reduce((sum: number, assignment: any) => sum + assignment.averageGrade, 0) / assignmentAnalytics.length).toFixed(1) : 0}%
            </div>
            <p className="text-sm text-gray-600">Average grade</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Late Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {assignmentAnalytics.reduce((sum: number, assignment: any) => sum + assignment.lateSubmissions, 0)}
            </div>
            <p className="text-sm text-gray-600">Total late</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignment Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedAssignments.map((assignment: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{assignment.assignmentTitle}</p>
                  <p className="text-sm text-gray-600">{assignment.courseCode} - {assignment.courseTitle}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm">
                      Avg: <span className="font-bold">{assignment.averageGrade.toFixed(1)}%</span>
                    </span>
                    <span className="text-sm">
                      Range: <span className="font-bold">{assignment.lowestGrade.toFixed(1)}% - {assignment.highestGrade.toFixed(1)}%</span>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{assignment.completionRate.toFixed(1)}%</div>
                  <p className="text-sm text-gray-600">completion rate</p>
                  <div className="text-sm text-gray-600 mt-1">
                    {assignment.totalSubmissions}/{assignment.enrolledStudents} submitted
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}