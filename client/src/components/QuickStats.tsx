import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Variable, BadgePercent, TrendingUp } from "lucide-react";

export default function QuickStats() {
  const { user } = useAuth();

  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
    enabled: !!user,
  });

  // Mock data for demo purposes
  const stats = {
    courses: courses.length,
    assignments: user?.role === "teacher" ? 25 : 12,
    grade: user?.role === "teacher" ? "4.2" : "85.4%",
    attendance: user?.role === "teacher" ? "92%" : "94%",
  };

  const statsConfig = [
    {
      title: user?.role === "teacher" ? "Teaching Courses" : "Enrolled Courses",
      value: stats.courses,
      icon: BookOpen,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: user?.role === "teacher" ? "Total Assignments" : "Pending Assignments",
      value: stats.assignments,
      icon: Variable,
      color: "bg-orange-100 text-orange-600",
    },
    {
      title: user?.role === "teacher" ? "Avg Rating" : "Average BadgePercent",
      value: stats.grade,
      icon: BadgePercent,
      color: "bg-green-100 text-green-600",
    },
    {
      title: user?.role === "teacher" ? "Class Attendance" : "Attendance Rate",
      value: stats.attendance,
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statsConfig.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="lms-surface shadow-sm border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center mr-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.title}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
