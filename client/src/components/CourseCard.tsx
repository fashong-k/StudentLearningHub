import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Code, Calculator, Brain } from "lucide-react";

interface CourseCardProps {
  course: {
    id: number;
    title: string;
    description?: string;
    courseCode?: string;
    semester?: string;
    year?: number;
  };
}

const getCourseIcon = (courseCode: string | undefined) => {
  if (!courseCode) return Code; // Default icon for undefined courseCode
  const code = courseCode.toLowerCase();
  if (code.includes('cs') || code.includes('csc') || code.includes('comp')) {
    return Code;
  } else if (code.includes('math') || code.includes('calc') || code.includes('stat')) {
    return Calculator;
  } else if (code.includes('psyc') || code.includes('psych')) {
    return Brain;
  }
  return Code; // Default icon
};

const getStatusColor = (courseCode: string | undefined) => {
  if (!courseCode) return 'info'; // Default status for undefined courseCode
  // Mock logic for course status
  const hash = courseCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const statuses = ['success', 'warning', 'info'];
  return statuses[hash % statuses.length];
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'success':
      return 'On Track';
    case 'warning':
      return 'Needs Attention';
    case 'info':
      return 'Excellent';
    default:
      return 'Active';
  }
};

export default function CourseCard({ course }: CourseCardProps) {
  const Icon = getCourseIcon(course.courseCode);
  const status = getStatusColor(course.courseCode);
  const statusText = getStatusText(status);

  return (
    <Card className="course-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">{course.title}</h4>
              <p className="text-sm text-gray-600">
                {course.courseCode || 'No Code'} • {course.semester} {course.year}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`status-badge ${status}`}>
              {statusText}
            </Badge>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Next Assignment</div>
            <div className="font-medium">Problem Set 1</div>
          </div>
          <div>
            <div className="text-gray-600">Due Date</div>
            <div className="font-medium text-orange-600">March 15</div>
          </div>
          <div>
            <div className="text-gray-600">Grade</div>
            <div className="font-medium">88.5%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
