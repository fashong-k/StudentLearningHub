import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const hasEvent = (day: number) => {
    // Mock event data
    const eventDays = [12, 15, 20];
    return eventDays.includes(day);
  };

  const hasDeadline = (day: number) => {
    // Mock deadline data
    const deadlineDays = [12];
    return deadlineDays.includes(day);
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <Card className="lms-surface shadow-sm border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-800">
            Calendar
          </CardTitle>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="text-center mb-4">
          <div className="text-lg font-semibold text-gray-800">
            {getMonthName(currentDate)}
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-xs">
          {weekDays.map((day, index) => (
            <div key={index} className="text-center text-gray-500 py-2 font-medium">
              {day}
            </div>
          ))}
          
          {days.map((day, index) => {
            if (day === null) {
              return <div key={index} className="calendar-day"></div>;
            }
            
            let className = "calendar-day cursor-pointer hover:bg-gray-100";
            
            if (hasDeadline(day)) {
              className += " has-deadline";
            } else if (hasEvent(day)) {
              className += " has-event";
            }
            
            return (
              <div key={index} className={className}>
                {day}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
