import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useDataFallback } from "@/hooks/useDataFallback";
import { DataFallbackAlert } from "@/components/DataFallbackAlert";
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  BarChart3, 
  Search, 
  Download,
  FileText,
  Calendar,
  Target,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

export default function Grades() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("current");
  const { isUsingFallback, failedEndpoints, showAlert, reportFailure, clearFailures } = useDataFallback();

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

  // Fetch grades from database
  const { data: grades = [], isLoading: gradesLoading } = useQuery<any[]>({
    queryKey: ["/api/grades"],
    enabled: !!user,
    queryFn: async (): Promise<any[]> => {
      try {
        const result = await apiRequest("/api/grades", "GET");
        return Array.isArray(result) ? result : [];
      } catch (error) {
        reportFailure("/api/grades", error);
        return [];
      }
    },
  });

  // Use real grades data; fallback to sample data only if retrieval fails
  const sampleGrades = grades.length === 0 ? [
    {
      id: 1,
      courseCode: "CS 101",
      courseName: "Introduction to Computer Science",
      assignmentName: "Problem Set 3: Sorting Algorithms",
      assignmentType: "homework",
      grade: 88,
      maxPoints: 100,
      percentage: 88,
      submittedAt: new Date("2025-03-14"),
      gradedAt: new Date("2025-03-16"),
      feedback: "Good implementation of algorithms. Consider optimizing the quicksort partition function.",
      weight: 15,
      letterGrade: "B+"
    },
    {
      id: 2,
      courseCode: "MATH 201",
      courseName: "Calculus I",
      assignmentName: "Integration Quiz",
      assignmentType: "quiz",
      grade: 45,
      maxPoints: 50,
      percentage: 90,
      submittedAt: new Date("2025-03-12"),
      gradedAt: new Date("2025-03-13"),
      feedback: "Excellent work on integration by parts. Minor error in partial fractions problem.",
      weight: 10,
      letterGrade: "A-"
    },
    {
      id: 3,
      courseCode: "CS 101",
      courseName: "Introduction to Computer Science",
      assignmentName: "Lab Exercise: Binary Trees",
      assignmentType: "lab",
      grade: 70,
      maxPoints: 75,
      percentage: 93.3,
      submittedAt: new Date("2025-03-10"),
      gradedAt: new Date("2025-03-11"),
      feedback: "Correct implementation but submitted late. Consider time management for future assignments.",
      weight: 10,
      letterGrade: "A-"
    },
    {
      id: 4,
      courseCode: "PSYC 101",
      courseName: "Introduction to Psychology",
      assignmentName: "Chapter 3 Quiz",
      assignmentType: "quiz",
      grade: 18,
      maxPoints: 20,
      percentage: 90,
      submittedAt: new Date("2025-03-05"),
      gradedAt: new Date("2025-03-06"),
      feedback: "Strong understanding of cognitive concepts. Review attention mechanisms.",
      weight: 8,
      letterGrade: "A-"
    },
    {
      id: 5,
      courseCode: "MATH 201",
      courseName: "Calculus I",
      assignmentName: "Homework 4: Derivatives",
      assignmentType: "homework",
      grade: 42,
      maxPoints: 50,
      percentage: 84,
      submittedAt: new Date("2025-02-28"),
      gradedAt: new Date("2025-03-02"),
      feedback: "Good grasp of chain rule. Practice more with implicit differentiation.",
      weight: 12,
      letterGrade: "B"
    }
  ] : grades;

  // Sample course summaries
  const courseSummaries = [
    {
      courseCode: "CS 101",
      courseName: "Introduction to Computer Science",
      currentGrade: 87.5,
      letterGrade: "B+",
      completedAssignments: 8,
      totalAssignments: 12,
      trend: "up",
      targetGrade: 90,
      creditHours: 4
    },
    {
      courseCode: "MATH 201",
      courseName: "Calculus I",
      currentGrade: 91.2,
      letterGrade: "A-",
      completedAssignments: 10,
      totalAssignments: 15,
      trend: "up",
      targetGrade: 92,
      creditHours: 4
    },
    {
      courseCode: "PSYC 101",
      courseName: "Introduction to Psychology",
      currentGrade: 89.8,
      letterGrade: "B+",
      completedAssignments: 6,
      totalAssignments: 10,
      trend: "stable",
      targetGrade: 88,
      creditHours: 3
    }
  ];

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-blue-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getLetterGrade = (percentage: number) => {
    if (percentage >= 93) return "A";
    if (percentage >= 90) return "A-";
    if (percentage >= 87) return "B+";
    if (percentage >= 83) return "B";
    if (percentage >= 80) return "B-";
    if (percentage >= 77) return "C+";
    if (percentage >= 73) return "C";
    if (percentage >= 70) return "C-";
    if (percentage >= 67) return "D+";
    if (percentage >= 60) return "D";
    return "F";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <BarChart3 className="w-4 h-4 text-blue-600" />;
    }
  };

  const filteredGrades = sampleGrades.filter(grade => {
    const matchesSearch = grade.assignmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grade.courseCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === "all" || grade.courseCode === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  const overallGPA = (courseSummaries.reduce((sum, course) => {
    const gradePoints = getGradePoints(course.currentGrade);
    return sum + (gradePoints * course.creditHours);
  }, 0) / courseSummaries.reduce((sum, course) => sum + course.creditHours, 0)).toFixed(2);

  function getGradePoints(percentage: number) {
    if (percentage >= 93) return 4.0;
    if (percentage >= 90) return 3.7;
    if (percentage >= 87) return 3.3;
    if (percentage >= 83) return 3.0;
    if (percentage >= 80) return 2.7;
    if (percentage >= 77) return 2.3;
    if (percentage >= 73) return 2.0;
    if (percentage >= 70) return 1.7;
    if (percentage >= 67) return 1.3;
    if (percentage >= 60) return 1.0;
    return 0.0;
  }

  return (
    <div className="flex h-screen overflow-hidden lms-background">
      <Navigation />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="lms-surface border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {user?.role === "teacher" ? "Grade Management" : "My Grades"}
              </h1>
              <p className="text-gray-600 mt-1">
                {user?.role === "teacher" 
                  ? "View and manage student grades across all courses"
                  : "Track your academic progress and performance"}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              {user?.role === "teacher" && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              )}
            </div>
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
          
          {/* Student Overview */}
          {user?.role === "student" && (
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <Award className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-800">{overallGPA}</div>
                        <div className="text-sm text-gray-600">Overall GPA</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-800">
                          {courseSummaries.reduce((sum, course) => sum + course.completedAssignments, 0)}
                        </div>
                        <div className="text-sm text-gray-600">Completed</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-800">
                          {courseSummaries.reduce((sum, course) => sum + (course.totalAssignments - course.completedAssignments), 0)}
                        </div>
                        <div className="text-sm text-gray-600">Remaining</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                        <Target className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-800">
                          {Math.round(courseSummaries.reduce((sum, course) => sum + course.currentGrade, 0) / courseSummaries.length)}%
                        </div>
                        <div className="text-sm text-gray-600">Average</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Course Summaries */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Course Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courseSummaries.map((course) => (
                      <div key={course.courseCode} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="font-medium text-gray-900">{course.courseName}</h4>
                            <p className="text-sm text-gray-600">{course.courseCode} • {course.creditHours} credits</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-sm text-gray-600">Progress</div>
                            <div className="font-medium">{course.completedAssignments}/{course.totalAssignments}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-600">Current Grade</div>
                            <div className={`font-bold ${getGradeColor(course.currentGrade)}`}>
                              {course.currentGrade.toFixed(1)}% ({course.letterGrade})
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-600">Target</div>
                            <div className="font-medium">{course.targetGrade}%</div>
                          </div>
                          <div className="flex items-center">
                            {getTrendIcon(course.trend)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
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
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Current Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Semester</SelectItem>
                <SelectItem value="fall2024">Fall 2024</SelectItem>
                <SelectItem value="spring2024">Spring 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grades Table */}
          <Card>
            <CardHeader>
              <CardTitle>Individual Grades</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Graded</TableHead>
                    <TableHead>Feedback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{grade.assignmentName}</div>
                          <div className="text-sm text-gray-500">Weight: {grade.weight}%</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{grade.courseCode}</div>
                          <div className="text-sm text-gray-500">{grade.courseName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {grade.assignmentType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {grade.grade}/{grade.maxPoints}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-bold ${getGradeColor(grade.percentage)}`}>
                          {grade.percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">({grade.letterGrade})</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(grade.submittedAt, "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(grade.gradedAt, "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-600 truncate" title={grade.feedback}>
                            {grade.feedback}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredGrades.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No grades found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? "Try adjusting your search terms" : "No grades available for the selected filters"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
