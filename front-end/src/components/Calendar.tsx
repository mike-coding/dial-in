import React, { useState } from 'react';
import WindowsEmoji from './WindowsEmoji';
import { useCategories } from '../hooks/useCategories';
import { useTasks } from '../hooks/useTasks';
import { Task as TaskType } from '../hooks/types';

interface CalendarProps {
  isMobile?: boolean;
}

type ViewMode = 'month' | 'week' | 'day';

const Calendar: React.FC<CalendarProps> = ({ isMobile = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const { tasks } = useTasks();
  const { categories } = useCategories();

  const toDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const scheduledTasks = (tasks || []).filter((task) => task.due_date);
  const tasksByDate = scheduledTasks.reduce((acc, task) => {
    const dueDate = new Date(task.due_date as string);
    const key = toDateKey(dueDate);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(task);
    return acc;
  }, {} as Record<string, TaskType[]>);

  const getTasksForDate = (date: Date) => {
    const key = toDateKey(date);
    return tasksByDate[key] || [];
  };

  const resolveTaskIcon = (task: TaskType) => {
    const category = categories.find((entry) => entry.id === task.category_id);
    return category?.icon || '📝';
  };

  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Format display text based on view mode
  const getDisplayText = () => {
    const options: Intl.DateTimeFormatOptions = {};
    
    switch (viewMode) {
      case 'month':
        options.year = 'numeric';
        options.month = 'long';
        return currentDate.toLocaleDateString('en-US', options);
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'day':
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        options.weekday = 'long';
        return currentDate.toLocaleDateString('en-US', options);
      default:
        return '';
    }
  };

  // Render month view
  const renderMonthView = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    const days = [];
    const currentIterDate = new Date(startDate);

    // Generate 6 weeks of days (42 days total)
    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = currentIterDate.getMonth() === currentDate.getMonth();
      const isToday = currentIterDate.toDateString() === today.toDateString();
      
      const dayTasks = getTasksForDate(currentIterDate);

      days.push(
        <div
          key={i}
          className={`
            min-h-24 p-1 text-sm cursor-pointer transition-colors rounded border border-transparent
            ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
            ${isToday ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}
          `}
        >
          <div className={`flex justify-center mb-1 ${isToday ? 'font-semibold text-blue-700' : ''}`}>
            {currentIterDate.getDate()}
          </div>
          <div className="space-y-1">
            {dayTasks.slice(0, 2).map((task) => (
              <div
                key={task.id}
                className={`text-[10px] px-1.5 py-0.5 rounded truncate ${
                  task.is_completed ? 'bg-gray-200 text-gray-500 line-through' : 'bg-blue-100 text-blue-900'
                }`}
                title={task.title}
              >
                <div className="flex items-center gap-1">
                  <WindowsEmoji emoji={resolveTaskIcon(task)} size={11} />
                  <span className="truncate">{task.title}</span>
                </div>
              </div>
            ))}
            {dayTasks.length > 2 && (
              <div className="text-[10px] px-1 text-gray-500">+{dayTasks.length - 2} more</div>
            )}
          </div>
        </div>
      );
      
      currentIterDate.setDate(currentIterDate.getDate() + 1);
    }

    return (
      <div className="bg-white rounded-lg shadow p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const isToday = day.toDateString() === today.toDateString();

      const dayTasks = getTasksForDate(day);

      days.push(
        <div key={i} className="flex-1 min-h-24">
          <div className={`text-center py-2 ${isToday ? 'bg-blue-600 text-white rounded-t' : 'bg-gray-50 rounded-t'}`}>
            <div className="text-xs font-medium">
              {day.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className={`text-lg font-semibold ${isToday ? 'text-white' : 'text-gray-900'}`}>
              {day.getDate()}
            </div>
          </div>
          <div className="bg-white border-x border-b border-gray-200 h-28 p-2 overflow-y-auto">
            {dayTasks.length === 0 ? (
              <div className="text-xs text-gray-400">No tasks</div>
            ) : (
              <div className="space-y-1">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`text-xs px-2 py-1 rounded truncate ${
                      task.is_completed ? 'bg-gray-200 text-gray-500 line-through' : 'bg-blue-100 text-blue-900'
                    }`}
                    title={task.title}
                  >
                    <div className="flex items-center gap-1">
                      <WindowsEmoji emoji={resolveTaskIcon(task)} size={12} />
                      <span className="truncate">{task.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex">
          {days}
        </div>
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const today = new Date();
    const isToday = currentDate.toDateString() === today.toDateString();
    const dayTasks = getTasksForDate(currentDate);

    // Generate hourly time slots
    const timeSlots = [];
    for (let hour = 0; hour < 24; hour++) {
      const time = new Date();
      time.setHours(hour, 0, 0, 0);
      const timeString = time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        hour12: true 
      });

      timeSlots.push(
        <div key={hour} className="flex border-b border-gray-100">
          <div className="w-16 p-2 text-xs text-gray-500 border-r border-gray-100">
            {timeString}
          </div>
          <div className="flex-1 p-2 min-h-12 hover:bg-gray-50 cursor-pointer">
            {/* Placeholder for events */}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow">
        <div className={`p-4 border-b border-gray-200 ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-center">
            <WindowsEmoji emoji="📅" size={24} className="mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            {isToday && (
              <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                Today
              </span>
            )}
          </div>
        </div>
        <div className="p-4 border-b border-gray-100">
          {dayTasks.length === 0 ? (
            <div className="text-sm text-gray-500">No scheduled tasks</div>
          ) : (
            <div className="space-y-2">
              {dayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                    task.is_completed ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-900'
                  }`}
                >
                  <WindowsEmoji emoji={resolveTaskIcon(task)} size={16} />
                  <span className={`text-sm truncate ${task.is_completed ? 'line-through' : ''}`}>{task.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {timeSlots}
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full max-w-4xl ${isMobile ? 'px-2' : ''}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          {/* View Mode Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          
          <button
            onClick={goToToday}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Today
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center">
          <button
            onClick={navigatePrevious}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-xl font-semibold text-gray-900 min-w-48 text-center mx-4">
            {getDisplayText()}
          </h2>
          
          <button
            onClick={navigateNext}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="mb-6">
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <WindowsEmoji emoji="🚧" size={20} className="mr-2" />
          <div>
            <h4 className="font-medium text-blue-900">Calendar Integration Coming Soon</h4>
            <p className="text-sm text-blue-700 mt-1">
              Task integration, event creation, and advanced calendar features are in development.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom spacing for mobile navigation */}
      {isMobile && <div className="h-16"></div>}
    </div>
  );
};

export default Calendar;
