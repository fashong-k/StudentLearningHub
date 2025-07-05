import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CheckCircle, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AnnouncementsList() {
  const { user } = useAuth();

  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
    enabled: !!user,
  });

  // Mock announcements for demo
  const mockAnnouncements = [
    {
      id: 1,
      title: "Midterm Exam Schedule",
      courseCode: "CS 50",
      author: "Prof. David Malan",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      type: "exam",
    },
    {
      id: 2,
      title: "Assignment Extension",
      courseCode: "MATH 201",
      author: "Prof. Sarah Johnson",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      type: "assignment",
    },
    {
      id: 3,
      title: "Office Hours Change",
      courseCode: "PSYC 101",
      author: "Prof. Michael Chen",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      type: "schedule",
    },
  ];

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case "exam":
        return Bell;
      case "assignment":
        return CheckCircle;
      case "schedule":
        return Calendar;
      default:
        return Bell;
    }
  };

  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case "exam":
        return "bg-blue-100 text-blue-600";
      case "assignment":
        return "bg-green-100 text-green-600";
      case "schedule":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <Card className="lms-surface shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-gray-800">
          Recent Announcements
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {mockAnnouncements.map((announcement) => {
          const Icon = getAnnouncementIcon(announcement.type);
          const colorClass = getAnnouncementColor(announcement.type);
          
          return (
            <div key={announcement.id} className="pb-4 border-b border-gray-100 last:border-b-0">
              <div className="flex items-start">
                <div className={`w-8 h-8 ${colorClass} rounded-lg flex items-center justify-center mr-3 mt-1`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">
                    {announcement.title}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {announcement.courseCode} • {announcement.author}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(announcement.createdAt, { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
