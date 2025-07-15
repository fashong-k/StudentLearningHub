import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bell, Mail, Settings, Plus, BookOpen } from "lucide-react";
import CourseCard from "./CourseCard";
import QuickStats from "./QuickStats";
import AnnouncementsList from "./AnnouncementsList";
import CalendarWidget from "./CalendarWidget";
import UpcomingDeadlines from "./UpcomingDeadlines";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ["/api/courses"],
    enabled: !!user,
  });

  const getCurrentSemester = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    if (month >= 0 && month <= 4) {
      return `Spring ${year}`;
    } else if (month >= 5 && month <= 7) {
      return `Summer ${year}`;
    } else {
      return `Fall ${year}`;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="lms-surface border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center flex-1">
          <h1 className="text-2xl font-bold text-gray-800 mr-6">Dashboard</h1>
          <div className="relative max-w-md">
            <Input
              type="text"
              placeholder="Search courses, assignments, or people..."
              className="w-full pl-10 pr-4 py-2"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Bell className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-800" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
          <div className="relative">
            <Mail className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-800" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
          <Settings className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-800" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Welcome back, {user?.firstName}!
              </h2>
              <p className="text-blue-100">
                {user?.role === "teacher" 
                  ? "You have new student submissions to review."
                  : "You have assignments due this week and upcoming exams."}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-75">Current Semester</div>
              <div className="text-lg font-semibold">{getCurrentSemester()}</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <QuickStats />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Courses */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-800">
                    {user?.role === "teacher" ? "Teaching Courses" : "Enrolled Courses"}
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {courses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No courses available</p>
                  </div>
                ) : (
                  courses.slice(0, 3).map((course: any) => (
                    <CourseCard key={course.id} course={course} />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            <UpcomingDeadlines />
            <AnnouncementsList />
            <CalendarWidget />
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 border-dashed hover:border-blue-500 hover:bg-blue-50"
              >
                <Plus className="w-6 h-6 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">
                  {user?.role === "teacher" ? "Create Course" : "Submit Assignment"}
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 border-dashed hover:border-blue-500 hover:bg-blue-50"
              >
                <Mail className="w-6 h-6 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">
                  Send Message
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 border-dashed hover:border-blue-500 hover:bg-blue-50"
              >
                <Bell className="w-6 h-6 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">
                  View Notifications
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 border-dashed hover:border-blue-500 hover:bg-blue-50"
              >
                <BookOpen className="w-6 h-6 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">
                  Access Resources
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Floating Action Button */}
      <Button className="fab">
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}
