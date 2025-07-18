import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { 
  BookOpen, 
  Variable, 
  BadgePercent, 
  CalendarDays, 
  MessageCircle, 
  CircleAlert, 
  ChartScatter, 
  School,
  LayoutDashboard,
  LogOut,
  Users
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const getNavigationItems = (userRole: string) => {
  const baseItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard", roles: ["student", "teacher", "admin"] },
    { path: "/courses", icon: BookOpen, label: "Courses", roles: ["student", "teacher", "admin"] },
    { path: "/assignments", icon: Variable, label: "Assignments", roles: ["student", "teacher", "admin"] },
    { path: "/grades", icon: BadgePercent, label: "Grades", roles: ["student", "teacher", "admin"] },
    { path: "/messages", icon: MessageCircle, label: "Messages", roles: ["student", "teacher", "admin"] },
    { path: "/announcements", icon: CircleAlert, label: "Announcements", roles: ["student", "teacher", "admin"] },
    { path: "/students", icon: Users, label: "Manage Students", roles: ["teacher", "admin"] },
    { path: "/analytics", icon: ChartScatter, label: "Analytics", roles: ["teacher", "admin"] },
  ];

  // Filter items based on user role
  return baseItems.filter(item => item.roles.includes(userRole));
};

export default function Navigation() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await fetch('/api/local/logout', {
        method: 'POST',
        credentials: 'include',
      });
      // Force refresh to clear all state and redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: still redirect to login page
      window.location.href = '/login';
    }
  };

  return (
    <div className="w-64 lms-surface shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 lms-primary rounded-lg flex items-center justify-center mr-3">
            <School className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-800">EduPortal</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {getNavigationItems(user?.role || "student").map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={cn(
                "w-full flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors",
                isActive && "bg-blue-50 text-blue-700"
              )}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <Avatar className="w-10 h-10 mr-3">
            <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
            <AvatarFallback>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-800">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {user?.role || "Student"}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="p-1 hover:bg-red-50 hover:text-red-600"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
