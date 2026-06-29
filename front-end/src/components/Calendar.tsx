import React, { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import { useTasks } from '../hooks/useTasks';
import { useRules } from '../hooks/useRules';
import { useUser, useUserData } from '../hooks/AppContext';
import { Task as TaskType } from '../hooks/types';
import DayTimeline from './calendar/DayTimeline';
import MonthCalendar from './calendar/MonthCalendar';
import SevenDayCalendar from './calendar/SevenDayCalendar';
import type { CalendarTaskSpan, PackedCalendarTaskSpan, TaskRange } from './calendar/types';
import {
  getColoredSurfaceStyle,
  resolveTaskColor as resolveTaskDisplayColor,
  resolveTaskIcon as resolveTaskDisplayIcon,
} from '../utils/presentationResolver';
import { getTaskEnd, getTaskStart } from '../utils/taskSchedule';

interface CalendarProps {
  isMobile?: boolean;
}

type ViewMode = 'month' | 'week' | 'day';
const VIEW_MODES: ViewMode[] = ['month', 'week', 'day'];

const Calendar: React.FC<CalendarProps> = ({ isMobile = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { tasks } = useTasks();
  const { rules } = useRules();
  const { categories } = useCategories();
  const { userData: authUser } = useUser();
  const { userData: preferences, updateUserData } = useUserData();
  const viewMode = VIEW_MODES.includes(preferences?.calendar_view as ViewMode)
    ? (preferences?.calendar_view as ViewMode)
    : 'month';

  const toDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const startOfDay = (date: Date) => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  };

  const endOfDay = (date: Date) => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  };

  const getTaskRange = (task: TaskType): TaskRange | null => {
    if (!task.due_date) {
      return null;
    }

    const start = getTaskStart(task);
    if (!start || Number.isNaN(start.getTime())) {
      return null;
    }

    const parsedEnd = getTaskEnd(task);
    const end = parsedEnd && !Number.isNaN(parsedEnd.getTime()) && parsedEnd >= start ? parsedEnd : start;

    return { task, start, end };
  };

  const scheduledTaskRanges = (tasks || [])
    .map(getTaskRange)
    .filter((range): range is TaskRange => range !== null)
    .sort((a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime());

  const getTasksForDate = (date: Date) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    return scheduledTaskRanges.filter((range) => range.start <= dayEnd && range.end >= dayStart);
  };

  const getTaskSpansForRange = (rangeStartDate: Date, dayCount: number): CalendarTaskSpan[] => {
    const rangeStart = startOfDay(rangeStartDate);
    const rangeEnd = endOfDay(new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + dayCount - 1));

    return scheduledTaskRanges
      .filter((range) => range.start <= rangeEnd && range.end >= rangeStart)
      .map((range) => {
        const spanStart = startOfDay(range.start) < rangeStart ? rangeStart : startOfDay(range.start);
        const spanEnd = endOfDay(range.end) > rangeEnd ? rangeEnd : endOfDay(range.end);

        return {
          ...range,
          startColumn: Math.floor((spanStart.getTime() - rangeStart.getTime()) / 86400000),
          endColumn: Math.floor((spanEnd.getTime() - rangeStart.getTime()) / 86400000),
        };
      });
  };

  const packTaskSpans = (spans: CalendarTaskSpan[]): PackedCalendarTaskSpan[] => {
    const lanes: CalendarTaskSpan[][] = [];

    const sortedSpans = [...spans].sort((a, b) => {
      const aVisibleDays = a.endColumn - a.startColumn;
      const bVisibleDays = b.endColumn - b.startColumn;

      return (
        bVisibleDays - aVisibleDays ||
        a.startColumn - b.startColumn ||
        a.start.getTime() - b.start.getTime() ||
        b.end.getTime() - a.end.getTime()
      );
    });

    return sortedSpans.map((span) => {
      const laneIndex = lanes.findIndex((lane) =>
        lane.every((laneSpan) => span.endColumn < laneSpan.startColumn || span.startColumn > laneSpan.endColumn)
      );
      const nextLane = laneIndex === -1 ? lanes.length : laneIndex;

      if (!lanes[nextLane]) {
        lanes[nextLane] = [];
      }
      lanes[nextLane].push(span);

      return { ...span, lane: nextLane };
    });
  };

  const formatTaskRange = (range: TaskRange) => {
    if (!range.task.end_date && !range.task.due_time) {
      return 'All day';
    }

    if (!range.task.end_date) {
      return range.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }

    const sameDay = toDateKey(range.start) === toDateKey(range.end);
    const hasStartTime = Boolean(range.task.due_time);
    const hasEndTime = Boolean(range.task.end_time);

    if (sameDay && !hasStartTime && !hasEndTime) {
      return 'All day';
    }

    if (sameDay && (hasStartTime || hasEndTime)) {
      const startTime = hasStartTime ? range.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Start';
      const endTime = hasEndTime ? range.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'End';
      return `${startTime} - ${endTime}`;
    }

    return `${range.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${range.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const taskPillClasses = (task: TaskType) =>
    task.is_completed ? 'bg-gray-200 text-gray-500 line-through' : 'bg-blue-100 text-blue-900';

  const resolveTaskIcon = (task: TaskType) => {
    return resolveTaskDisplayIcon(task, rules, categories);
  };

  const resolveTaskColor = (task: TaskType) => {
    return resolveTaskDisplayColor(task, rules, categories);
  };

  const taskPillStyle = (task: TaskType) => {
    const color = resolveTaskColor(task);
    return getColoredSurfaceStyle(color, { muted: task.is_completed });
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

  const cycleViewMode = () => {
    const nextViewMode = VIEW_MODES[(VIEW_MODES.indexOf(viewMode) + 1) % VIEW_MODES.length];

    if (authUser?.id) {
      updateUserData(authUser.id, { calendar_view: nextViewMode });
    }
  };

  const viewModeLabel = viewMode.charAt(0).toUpperCase() + viewMode.slice(1);

  // Format display text based on view mode
  const getDisplayText = () => {
    const options: Intl.DateTimeFormatOptions = {};
    
    switch (viewMode) {
      case 'month':
        options.year = 'numeric';
        options.month = 'long';
        return currentDate.toLocaleDateString('en-US', options);
      case 'week': {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
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

  const renderMonthView = () => (
    <MonthCalendar
      currentDate={currentDate}
      getTasksForDate={getTasksForDate}
      resolveTaskIcon={resolveTaskIcon}
      taskPillStyle={taskPillStyle}
      toDateKey={toDateKey}
    />
  );

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());

    return (
      <SevenDayCalendar
        getTaskSpansForRange={getTaskSpansForRange}
        getTasksForDate={getTasksForDate}
        packTaskSpans={packTaskSpans}
        rangeStart={weekStart}
        resolveTaskIcon={resolveTaskIcon}
        taskPillClasses={taskPillClasses}
        taskPillStyle={taskPillStyle}
        toDateKey={toDateKey}
      />
    );
  };

  const renderDayView = () => (
    <DayTimeline
      currentDate={currentDate}
      dayTaskRanges={getTasksForDate(currentDate)}
      formatTaskRange={formatTaskRange}
      resolveTaskIcon={resolveTaskIcon}
      taskPillClasses={taskPillClasses}
      taskPillStyle={taskPillStyle}
    />
  );

  return (
    <div className={`flex h-full min-h-0 w-full max-w-none flex-1 flex-col ${isMobile ? 'px-2' : ''}`}>
      {/* Header */}
      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <button
          onClick={cycleViewMode}
          aria-label={`Switch calendar view. Current view: ${viewModeLabel}`}
          className="justify-self-start rounded-md bg-white px-2.5 py-1 text-xs font-medium text-gray-800 transition-all duration-200 hover:bg-gray-50 sm:px-3 sm:text-sm"
        >
          {viewModeLabel}
        </button>

        <div className="inline-flex min-w-0 items-center justify-center gap-1 justify-self-center">
          <button
            onClick={navigatePrevious}
            aria-label="Go to previous period"
            className="shrink-0 p-1.5 hover:bg-gray-100 rounded transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="w-32 truncate text-center text-base font-semibold text-gray-900 sm:w-56 sm:text-xl">
            {getDisplayText()}
          </h2>
          
          <button
            onClick={navigateNext}
            aria-label="Go to next period"
            className="shrink-0 p-1.5 hover:bg-gray-100 rounded transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <button
          onClick={goToToday}
          className="justify-self-end rounded-md bg-slate-500 px-2.5 py-1 text-xs font-medium text-white transition-all duration-200 hover:bg-slate-600 sm:px-3 sm:text-sm"
        >
          Today
        </button>
      </div>

      {/* Calendar Content */}
      <div className={viewMode === 'week' ? 'min-h-0' : 'min-h-0 flex-1'}>
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </div>

      {/* Bottom spacing for mobile navigation */}
      {isMobile && <div className="h-16"></div>}
    </div>
  );
};

export default Calendar;
