import { useEffect, useRef, useState } from 'react';
import { Calendar } from 'lucide-react';

interface CustomDatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  min?: string;
  disabled?: boolean;
}

export const CustomDatePicker = ({ 
  value = '', 
  onChange, 
  placeholder = 'Select date', 
  min,
  disabled = false 
}: CustomDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedDate(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return '';
    }
  };

  const handleDateSelect = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    onChange?.(dateStr);
    setIsOpen(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isDateDisabled = (date: Date): boolean => {
    if (!min) return false;
    const minDate = new Date(min);
    return date < minDate;
  };

  const isSelectedDate = (date: Date): boolean => {
    if (!selectedDate) return false;
    return date.toISOString().split('T')[0] === selectedDate;
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={`
          flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md 
          bg-white cursor-pointer hover:border-gray-400 transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`text-sm ${selectedDate ? 'text-gray-900' : 'text-gray-500'}`}>
          {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
        </span>
        <Calendar className="w-4 h-4 text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[280px]">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            >
              ‹
            </button>
            <span className="font-medium text-gray-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            >
              ›
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 p-3 pb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 p-3 pt-0">
            {getDaysInMonth(currentDate).map((date, index) => {
              if (!date) {
                return <div key={index} className="p-2"></div>;
              }

              const isDisabled = isDateDisabled(date);
              const isSelected = isSelectedDate(date);
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => !isDisabled && handleDateSelect(date)}
                  disabled={isDisabled}
                  className={`
                    p-2 text-sm rounded hover:bg-gray-100 transition-colors
                    ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                    ${isToday && !isSelected ? 'bg-blue-50 text-blue-600' : ''}
                    ${isDisabled ? 'text-gray-300 cursor-not-allowed hover:bg-transparent' : ''}
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};