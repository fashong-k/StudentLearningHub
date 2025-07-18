import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCheck, UserX, Search, Filter, Users, TrendingUp, BookOpen, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import ProtectedRoute from "@/components/ProtectedRoute";
import { safeFormat, safeFormatDistanceToNow } from "@/lib/dateUtils";

interface Student {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  role: string;
  createdAt: string;
  enrolledCourses: number;
  completedAssignments: number;
  averageGrade: number;
  lastActivity?: string;
  status: string;
}

interface StudentStats {
  totalStudents: number;
  activeStudents: number;
  averageGPA: number;
  totalEnrollments: number;
}

export default function Students() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const { data: students, isLoading: studentsLoading, error: studentsError } = useQuery<Student[]>({
    queryKey: ['/api/students'],
    enabled: !!user && (user.role === 'teacher' || user.role === 'admin'),
  });

  const { data: stats, isLoading: statsLoading } = useQuery<StudentStats>({
    queryKey: ['/api/students/stats'],
    enabled: !!user && (user.role === 'teacher' || user.role === 'admin'),
  });

  const filteredStudents = students?.filter(student => {
    const matchesSearch = (
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return `${a.lastName}, ${a.firstName}`.localeCompare(`${b.lastName}, ${b.firstName}`);
      case "grade":
        return b.averageGrade - a.averageGrade;
      case "activity":
        if (!a.lastActivity && !b.lastActivity) return 0;
        if (!a.lastActivity) return 1;
        if (!b.lastActivity) return -1;
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      case "enrollment":
        return b.enrolledCourses - a.enrolledCourses;
      default:
        return 0;
    }
  });

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "bg-green-100 text-green-800";
    if (grade >= 80) return "bg-blue-100 text-blue-800";
    if (grade >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <ProtectedRoute route="/students">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Management</h1>
          <p className="text-gray-600">
            {user?.role === 'admin' 
              ? "Manage all students in the system" 
              : "Manage students enrolled in your courses"}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Skeleton className="h-6 w-12" /> : stats?.totalStudents || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Skeleton className="h-6 w-12" /> : stats?.activeStudents || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average GPA</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Skeleton className="h-6 w-12" /> : (stats?.averageGPA || 0).toFixed(1)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Skeleton className="h-6 w-12" /> : stats?.totalEnrollments || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search students by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="grade">Grade (High to Low)</SelectItem>
              <SelectItem value="activity">Recent Activity</SelectItem>
              <SelectItem value="enrollment">Enrolled Courses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Students List */}
        <div className="space-y-4">
          {studentsLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : studentsError ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-red-600">
                  <UserX className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-semibold">Failed to load students</p>
                  <p className="text-sm text-gray-600">Please try again later</p>
                </div>
              </CardContent>
            </Card>
          ) : sortedStudents.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-semibold">No students found</p>
                  <p className="text-sm">Try adjusting your search or filter criteria</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            sortedStudents.map((student) => (
              <Card key={student.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-lg">
                          {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {student.firstName} {student.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{student.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getStatusColor(student.status)}>
                            {student.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Member since {safeFormat(student.createdAt, "MMM yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{student.enrolledCourses}</div>
                          <div className="text-xs text-gray-500">Courses</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{student.completedAssignments}</div>
                          <div className="text-xs text-gray-500">Assignments</div>
                        </div>
                        <div className="text-center">
                          <Badge className={getGradeColor(student.averageGrade)}>
                            {student.averageGrade.toFixed(1)}%
                          </Badge>
                          <div className="text-xs text-gray-500">Avg Grade</div>
                        </div>
                      </div>
                      {student.lastActivity && (
                        <div className="text-xs text-gray-500 mt-2 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Last active {safeFormatDistanceToNow(student.lastActivity)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Results Summary */}
        {!studentsLoading && !studentsError && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {sortedStudents.length} of {students?.length || 0} students
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}