import React, { useState } from 'react';
import WindowsEmoji from './WindowsEmoji';
import { useCategories } from '../hooks/useCategories';
import { useTasks } from '../hooks/useTasks';
import { useRules } from '../hooks/useRules';
import { useUser, useUserData } from '../hooks/AppContext';
import { Task as TaskType } from '../hooks/types';
import { resolveTaskIcon as resolveTaskDisplayIcon } from '../utils/iconResolver';
import { getTaskEnd, getTaskStart, hasTaskTime } from '../utils/taskSchedule';

interface CalendarProps {
  isMobile?: boolean;
}

type ViewMode = 'month' | 'week' | 'day';
const VIEW_MODES: ViewMode[] = ['month', 'week', 'day'];

type TaskRange = {
  task: TaskType;
  start: Date;
  end: Date;
};

type CalendarTaskSpan = TaskRange & {
  startColumn: number;
  endColumn: number;
};

type PackedCalendarTaskSpan = CalendarTaskSpan & {
  lane: number;
};

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

    const weeks = [];
    const currentIterDate = new Date(startDate);

    // Generate 6 weeks of days (42 days total)
    for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
      const weekStart = new Date(currentIterDate);
      const weekDays = [];
      const weekSpans = packTaskSpans(getTaskSpansForRange(weekStart, 7));
      const visibleWeekSpans = weekSpans.filter((span) => span.lane < 3);
      const hiddenWeekSpans = weekSpans.filter((span) => span.lane >= 3);

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + dayIndex);

        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        const isToday = day.toDateString() === today.toDateString();
        const hiddenDayCount = hiddenWeekSpans.filter(
          (span) => span.startColumn <= dayIndex && span.endColumn >= dayIndex
        ).length;

        weekDays.push(
          <div
            key={toDateKey(day)}
            style={{ gridColumn: `${dayIndex + 1}`, gridRow: '1 / -1' }}
            className={`
              rounded transition-all duration-200
              ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
              ${isToday ? 'bg-blue-50' : 'hover:bg-gray-50'}
            `}
          />
        );

        weekDays.push(
          <div
            key={`${toDateKey(day)}-label`}
            style={{ gridColumn: `${dayIndex + 1}`, gridRow: '1' }}
            className={`z-10 flex items-center justify-center text-sm ${isToday ? 'font-semibold text-blue-700' : ''}`}
          >
            {day.getDate()}
          </div>
        );

        if (hiddenDayCount > 0) {
          weekDays.push(
            <div
              key={`${toDateKey(day)}-more`}
              style={{ gridColumn: `${dayIndex + 1}`, gridRow: '5' }}
              className="z-10 min-w-0 px-1 text-[10px] text-gray-500"
            >
              +{hiddenDayCount} more
            </div>
          );
        }
      }

      weeks.push(
        <div
          key={weekIndex}
          className="grid min-h-0 grid-cols-7 gap-x-1 gap-y-1"
          style={{ gridTemplateRows: '1.5rem repeat(3, minmax(1rem, auto)) minmax(0, 1fr)' }}
        >
          {weekDays}
          {visibleWeekSpans.map((span) => (
            <div
              key={`${span.task.id}-${span.startColumn}-${span.endColumn}`}
              className={`z-20 min-w-0 rounded px-1.5 py-0.5 text-[10px] ${taskPillClasses(span.task)}`}
              style={{ gridColumn: `${span.startColumn + 1} / ${span.endColumn + 2}`, gridRow: span.lane + 2 }}
              title={span.task.title}
            >
              <div className="flex min-w-0 items-center gap-1">
                <WindowsEmoji emoji={resolveTaskIcon(span.task)} size={11} />
                <span className="truncate">{span.task.title}</span>
              </div>
            </div>
          ))}
        </div>
      );

      currentIterDate.setDate(currentIterDate.getDate() + 7);
    }

    return (
      <div className="flex h-full min-h-[32rem] flex-col rounded-md bg-white p-3 transition-all duration-200">
        {/* Day headers */}
        <div className="mb-2 grid shrink-0 grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        {/* Calendar grid */}
        <div className="grid min-h-0 flex-1 grid-rows-6 gap-1">
          {weeks}
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    
    const dayCells = [];
    const today = new Date();
    const weekSpans = packTaskSpans(getTaskSpansForRange(weekStart, 7));
    const laneCount = Math.max(1, ...weekSpans.map((span) => span.lane + 1));

    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const isToday = day.toDateString() === today.toDateString();
      const hasTasks = getTasksForDate(day).length > 0;

      dayCells.push(
        <div
          key={`${toDateKey(day)}-background`}
          style={{ gridColumn: `${i + 1}`, gridRow: '1 / -1' }}
          className={`rounded-md transition-all duration-200 ${isToday ? 'bg-blue-50' : 'bg-white'}`}
        />
      );

      dayCells.push(
        <div
          key={`${toDateKey(day)}-header`}
          style={{ gridColumn: `${i + 1}`, gridRow: '1' }}
          className={`z-10 flex flex-col items-center justify-center rounded-t-md py-2 ${isToday ? 'text-blue-700' : 'text-gray-900'}`}
        >
          <div className="text-xs font-medium">
            {day.toLocaleDateString('en-US', { weekday: 'short' })}
          </div>
          <div className="text-lg font-semibold">
            {day.getDate()}
          </div>
        </div>
      );

      dayCells.push(
        <div
          key={`${toDateKey(day)}-body`}
          style={{ gridColumn: `${i + 1}`, gridRow: `${laneCount + 2}` }}
          className="z-10 min-h-0 rounded-b-md p-2 hover:bg-gray-50"
        >
          {!hasTasks && <div className="text-xs text-gray-400">No tasks</div>}
        </div>
      );
    }

    return (
      <div className="h-full min-h-[32rem] rounded-md bg-white p-1 transition-all duration-200">
        <div
          className="grid h-full min-h-0 grid-cols-7 gap-x-1 gap-y-1"
          style={{ gridTemplateRows: `4.5rem repeat(${laneCount}, minmax(1.75rem, auto)) minmax(0, 1fr)` }}
        >
          {dayCells}
          {weekSpans.map((span) => (
            <div
              key={`${span.task.id}-${span.startColumn}-${span.endColumn}`}
              className={`z-20 min-w-0 rounded px-2 py-1 text-xs ${taskPillClasses(span.task)}`}
              style={{ gridColumn: `${span.startColumn + 1} / ${span.endColumn + 2}`, gridRow: span.lane + 2 }}
              title={span.task.title}
            >
              <div className="flex min-w-0 items-center gap-1">
                <WindowsEmoji emoji={resolveTaskIcon(span.task)} size={12} />
                <span className="truncate">{span.task.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const today = new Date();
    const isToday = currentDate.toDateString() === today.toDateString();
    const dayTaskRanges = getTasksForDate(currentDate);
    const timedTaskRanges = dayTaskRanges.filter(
      (range) =>
        hasTaskTime(range.task) &&
        range.task.due_time &&
        range.task.end_date &&
        range.task.end_time &&
        toDateKey(range.start) === toDateKey(currentDate) &&
        toDateKey(range.end) === toDateKey(currentDate) &&
        range.end > range.start
    );
    const rowHeight = 48;

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
      <div className="flex h-full min-h-[32rem] flex-col rounded-md bg-white transition-all duration-200">
        <div className={`shrink-0 p-4 ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
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
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                Today
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 p-4">
          {dayTaskRanges.length === 0 ? (
            <div className="text-sm text-gray-500">No scheduled tasks</div>
          ) : (
            <div className="space-y-2">
              {dayTaskRanges.map((range) => (
                <div
                  key={range.task.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                    range.task.is_completed ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-900'
                  }`}
                >
                  <WindowsEmoji emoji={resolveTaskIcon(range.task)} size={16} />
                  <span className={`min-w-0 flex-1 truncate text-sm ${range.task.is_completed ? 'line-through' : ''}`}>{range.task.title}</span>
                  <span className="shrink-0 text-xs opacity-70">{formatTaskRange(range)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="relative">
            {timeSlots}
            <div className="pointer-events-none absolute left-16 right-2 top-0">
              {timedTaskRanges.map((range, index) => {
                const startMinutes = range.start.getHours() * 60 + range.start.getMinutes();
                const durationMinutes = Math.max(30, (range.end.getTime() - range.start.getTime()) / 60000);

                return (
                  <div
                    key={range.task.id}
                    className={`absolute left-2 right-2 min-w-0 rounded-md px-2 py-1 text-xs ${taskPillClasses(range.task)}`}
                    style={{
                      top: (startMinutes / 60) * rowHeight,
                      height: (durationMinutes / 60) * rowHeight,
                      transform: `translateX(${index % 3 * 6}px)`,
                    }}
                    title={range.task.title}
                  >
                    <div className="flex min-w-0 items-center gap-1">
                      <WindowsEmoji emoji={resolveTaskIcon(range.task)} size={12} />
                      <span className="truncate">{range.task.title}</span>
                    </div>
                    <div className="truncate text-[10px] opacity-75">{formatTaskRange(range)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
      <div className="min-h-0 flex-1">
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
