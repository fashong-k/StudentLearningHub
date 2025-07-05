import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UpcomingDeadlines() {
  // Mock deadline data
  const deadlines = [
    {
      id: 1,
      title: "Integration Quiz",
      courseCode: "MATH 201",
      dueDate: "March 12",
      priority: "high",
    },
    {
      id: 2,
      title: "Problem Set 3",
      courseCode: "CS 50",
      dueDate: "March 15",
      priority: "medium",
    },
    {
      id: 3,
      title: "Research Paper",
      courseCode: "PSYC 101",
      dueDate: "March 20",
      priority: "low",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-orange-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="lms-surface shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-gray-800">
          Upcoming Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {deadlines.map((deadline) => (
          <div key={deadline.id} className="flex items-center">
            <div className={`w-2 h-2 ${getPriorityColor(deadline.priority)} rounded-full mr-3`}></div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">{deadline.title}</div>
              <div className="text-xs text-gray-600">
                {deadline.courseCode} • Due {deadline.dueDate}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
