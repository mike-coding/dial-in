import React, { useEffect, useRef, useState } from 'react';
import WindowsEmoji from './WindowsEmoji';
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

interface PlannerCalendarProps {
  currentDate: Date;
  isMobile?: boolean;
  selectedDate: Date | null;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date | null>>;
}

type PlannerPeriod = 'day' | 'week' | 'month' | 'upcoming';
type ViewMode = 'month' | 'week' | 'day' | 'upcoming';
const PLANNER_PERIODS: PlannerPeriod[] = ['month', 'week', 'day', 'upcoming'];
const PLANNER_PERIOD_LABELS: Record<PlannerPeriod, 'Day' | 'Week' | 'Month' | 'Upcoming'> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  upcoming: 'Upcoming',
};

const PLANNER_PERIOD_VIEW_MODES: Record<PlannerPeriod, ViewMode> = {
  day: 'day',
  week: 'week',
  month: 'month',
  upcoming: 'upcoming',
};

const PlannerCalendar: React.FC<PlannerCalendarProps> = ({
  currentDate,
  isMobile = false,
  selectedDate,
  setCurrentDate,
  setSelectedDate,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { tasks } = useTasks();
  const { rules } = useRules();
  const { categories } = useCategories();
  const { userData: authUser } = useUser();
  const { userData: preferences, updateUserData } = useUserData();
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const plannerPeriod = preferences?.time_period === 'today'
    ? 'day'
    : PLANNER_PERIODS.includes(preferences?.time_period as PlannerPeriod)
      ? (preferences?.time_period as PlannerPeriod)
      : 'day';
  const dateFilter = PLANNER_PERIOD_LABELS[plannerPeriod];
  const viewMode = PLANNER_PERIOD_VIEW_MODES[plannerPeriod];
  const showUndated = preferences?.show_undated;
  const showUncategorized = preferences?.show_uncategorized;
  const showOverdue = preferences?.show_overdue;
  const categoryFilter = preferences?.show_categories || [];

  const updatePreference = (updates: {
    time_period?: PlannerPeriod;
    show_undated?: boolean;
    show_uncategorized?: boolean;
    show_overdue?: boolean;
    show_categories?: number[];
  }) => {
    if (authUser?.id) {
      updateUserData(authUser.id, updates);
    }
  };

  const toggleCategoryFilter = (categoryId: number) => {
    const newCategoryFilter = categoryFilter.includes(categoryId)
      ? categoryFilter.filter(id => id !== categoryId)
      : [...categoryFilter, categoryId];

    updatePreference({ show_categories: newCategoryFilter });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isFilterOpen]);

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

  const isSelectedDate = (date: Date) => selectedDate !== null && toDateKey(date) === toDateKey(selectedDate);

  const selectDate = (date: Date) => {
    const normalizedDate = startOfDay(date);
    setSelectedDate((currentSelectedDate) =>
      currentSelectedDate !== null && toDateKey(currentSelectedDate) === toDateKey(normalizedDate)
        ? null
        : normalizedDate
    );
  };

  const openDate = (date: Date) => {
    const normalizedDate = startOfDay(date);
    setSelectedDate(normalizedDate);
    setCurrentDate(normalizedDate);
    updatePreference({ time_period: 'day' });
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

  const taskPassesCalendarFilters = (task: TaskType, taskStart: Date) => {
    const now = new Date();
    const today = startOfDay(now);
    const taskDateOnly = startOfDay(taskStart);
    const isOverdue = Boolean(
      !task.is_completed &&
      (task.due_time ? taskStart < now : taskDateOnly < today)
    );

    if (isOverdue && !showOverdue) return false;

    if (categories && categories.length > 0) {
      if (categoryFilter.length > 0) {
        const hasMatchingCategory = task.category_id && categoryFilter.includes(task.category_id);
        const isUncategorizedAndShown = !task.category_id && showUncategorized;

        if (!hasMatchingCategory && !isUncategorizedAndShown) {
          return false;
        }
      } else {
        if (task.category_id) return false;
        if (!task.category_id && !showUncategorized) return false;
      }
    } else if (!task.category_id && !showUncategorized) {
      return false;
    }

    return true;
  };

  const scheduledTaskRanges = (tasks || [])
    .map(getTaskRange)
    .filter((range): range is TaskRange => range !== null)
    .filter((range) => taskPassesCalendarFilters(range.task, range.start))
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
      case 'upcoming':
        newDate.setDate(newDate.getDate() - 7);
        break;
    }
    setSelectedDate(null);
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
      case 'upcoming':
        newDate.setDate(newDate.getDate() + 7);
        break;
    }
    setSelectedDate(null);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(null);
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
      case 'upcoming':
        const upcomingStart = new Date(currentDate);
        const upcomingEnd = new Date(upcomingStart);
        upcomingEnd.setDate(upcomingStart.getDate() + 6);
        return `${upcomingStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${upcomingEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      default:
        return '';
    }
  };

  const renderMonthView = () => (
    <MonthCalendar
      currentDate={currentDate}
      getTasksForDate={getTasksForDate}
      isSelectedDate={isSelectedDate}
      openDate={openDate}
      resolveTaskIcon={resolveTaskIcon}
      selectDate={selectDate}
      taskPillStyle={taskPillStyle}
      toDateKey={toDateKey}
    />
  );

  const renderSevenDayView = (rangeStart: Date) => (
    <SevenDayCalendar
      getTaskSpansForRange={getTaskSpansForRange}
      getTasksForDate={getTasksForDate}
      isSelectedDate={isSelectedDate}
      openDate={openDate}
      packTaskSpans={packTaskSpans}
      rangeStart={rangeStart}
      resolveTaskIcon={resolveTaskIcon}
      selectDate={selectDate}
      taskPillClasses={taskPillClasses}
      taskPillStyle={taskPillStyle}
      toDateKey={toDateKey}
    />
  );

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    return renderSevenDayView(weekStart);
  };

  const renderUpcomingView = () => renderSevenDayView(startOfDay(currentDate));

  const renderDayView = () => (
    <DayTimeline
      currentDate={currentDate}
      dayTaskRanges={getTasksForDate(currentDate)}
      formatTaskRange={formatTaskRange}
      resolveTaskIcon={resolveTaskIcon}
      taskPillClasses={taskPillClasses}
      taskPillStyle={taskPillStyle}
      toDateKey={toDateKey}
    />
  );

  return (
    <div className={`flex h-full min-h-0 w-full max-w-none flex-1 flex-col ${isMobile ? 'px-2' : ''}`}>
      {/* Header */}
      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="relative justify-self-start" ref={filterDropdownRef}>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-gray-800 transition-all duration-200 hover:bg-gray-50 sm:px-3 sm:text-sm"
          >
            <span>{dateFilter}</span>
            <svg className={`h-4 w-4 text-gray-400 transition-transform ${isFilterOpen ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isFilterOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-md bg-white p-4 shadow-lg">
              <div className="mb-4">
                <h3 className="mb-2 text-sm font-medium text-gray-700">Time Period</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {PLANNER_PERIODS.map((period) => (
                    <label key={period} className="flex cursor-pointer items-center rounded p-1 hover:bg-gray-50">
                      <input
                        type="radio"
                        name="plannerDateFilter"
                        checked={plannerPeriod === period}
                        onChange={() => {
                          updatePreference({ time_period: period });
                          setSelectedDate(null);
                          setCurrentDate(new Date());
                        }}
                        className="mr-2"
                      />
                      <span className="text-gray-900">{PLANNER_PERIOD_LABELS[period]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {categories && categories.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-medium text-gray-700">Projects</h3>
                  <div className="max-h-32 space-y-1 overflow-y-auto">
                    {categories.map(category => (
                      <label key={category.id} className="flex cursor-pointer items-center rounded p-1 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={categoryFilter.includes(category.id)}
                          onChange={() => toggleCategoryFilter(category.id)}
                          className="mr-2"
                        />
                        <WindowsEmoji emoji={category.icon || '📁'} size={18} className="mr-1" />
                        <span className="text-gray-900">{category.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-700">Show</h3>
                <div className="space-y-1">
                  <label className="flex cursor-pointer items-center rounded p-1 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={showUndated}
                      onChange={(event) => updatePreference({ show_undated: event.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-gray-900">Undated</span>
                  </label>
                  <label className="flex cursor-pointer items-center rounded p-1 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={showUncategorized}
                      onChange={(event) => updatePreference({ show_uncategorized: event.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-gray-900">Uncategorized</span>
                  </label>
                  <label className="flex cursor-pointer items-center rounded p-1 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={showOverdue}
                      onChange={(event) => updatePreference({ show_overdue: event.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-gray-900">Overdue</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

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
      <div className={viewMode === 'week' || viewMode === 'upcoming' ? 'min-h-0' : 'min-h-0 flex-1'}>
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'upcoming' && renderUpcomingView()}
        {viewMode === 'day' && renderDayView()}
      </div>

      {/* Bottom spacing for mobile navigation */}
      {isMobile && <div className="h-16"></div>}
    </div>
  );
};

export default PlannerCalendar;
