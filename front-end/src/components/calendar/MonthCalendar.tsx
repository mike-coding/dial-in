import { useLayoutEffect, useRef, useState } from 'react';
import WindowsEmoji from '../WindowsEmoji';
import type { TaskRange, TaskVisualHelpers } from './types';

type MonthCalendarProps = Omit<TaskVisualHelpers, 'formatTaskRange' | 'taskPillClasses'> & {
  currentDate: Date;
  getTasksForDate: (date: Date) => TaskRange[];
  isSelectedDate?: (date: Date) => boolean;
  openDate?: (date: Date) => void;
  selectDate?: (date: Date) => void;
  toDateKey: (date: Date) => string;
};

type MonthTaskStripProps = Pick<TaskVisualHelpers, 'resolveTaskIcon' | 'taskPillStyle'> & {
  tasks: TaskRange[];
  toDateKey: (date: Date) => string;
  day: Date;
};

const MonthTaskStrip = ({ day, resolveTaskIcon, taskPillStyle, tasks, toDateKey }: MonthTaskStripProps) => {
  const stripRef = useRef<HTMLDivElement>(null);
  const [tileCapacity, setTileCapacity] = useState<number | null>(null);

  useLayoutEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    const updateCapacity = () => {
      const tile = strip.querySelector<HTMLElement>('[data-month-task-tile]');
      if (!tile) {
        setTileCapacity(null);
        return;
      }

      const styles = window.getComputedStyle(strip);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0;
      const tileWidth = tile.offsetWidth;
      if (tileWidth <= 0) return;

      const nextCapacity = Math.max(1, Math.floor((strip.clientWidth + gap) / (tileWidth + gap)));
      setTileCapacity((currentCapacity) => (currentCapacity === nextCapacity ? currentCapacity : nextCapacity));
    };

    updateCapacity();
    const resizeObserver = new ResizeObserver(updateCapacity);
    resizeObserver.observe(strip);

    return () => resizeObserver.disconnect();
  }, [tasks.length]);

  if (tasks.length === 0) {
    return null;
  }

  const capacity = tileCapacity ?? tasks.length;
  const visibleTaskLimit = tasks.length > capacity ? Math.max(0, capacity - 1) : capacity;
  const visibleTasks = tasks.slice(0, visibleTaskLimit);
  const hiddenTaskCount = tasks.length - visibleTasks.length;

  return (
    <div ref={stripRef} className="pointer-events-none m-2 flex min-w-0 flex-nowrap content-start gap-1 overflow-hidden">
      {visibleTasks.map((range) => (
        <div
          key={`${range.task.id}-${toDateKey(day)}`}
          data-month-task-tile
          className="flex h-6 w-6 min-w-6 items-center justify-center rounded-sm border-l-2 text-[10px] leading-none"
          style={taskPillStyle(range.task)}
          title={range.task.title}
        >
          <WindowsEmoji emoji={resolveTaskIcon(range.task)} size={11} />
        </div>
      ))}
      {hiddenTaskCount > 0 && (
        <div
          data-month-task-tile
          className="flex h-6 w-6 min-w-6 items-center justify-center rounded-sm bg-gray-200 text-[10px] font-bold leading-none text-gray-500"
        >
          +{hiddenTaskCount}
        </div>
      )}
    </div>
  );
};

const MonthCalendar = ({
  currentDate,
  getTasksForDate,
  isSelectedDate,
  openDate,
  resolveTaskIcon,
  selectDate,
  taskPillStyle,
  toDateKey,
}: MonthCalendarProps) => {
  const today = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
  const isSelectable = Boolean(selectDate || openDate);
  const weeks = [];
  const currentIterDate = new Date(startDate);

  for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
    const weekStart = new Date(currentIterDate);
    const weekDays = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + dayIndex);

      const isCurrentMonth = day.getMonth() === currentDate.getMonth();
      const isToday = day.toDateString() === today.toDateString();
      const isSelected = Boolean(isSelectedDate?.(day));
      const dayTasks = getTasksForDate(day);

      weekDays.push(
        <div
          key={toDateKey(day)}
          onClick={selectDate ? () => selectDate(day) : undefined}
          onDoubleClick={openDate ? () => openDate(day) : undefined}
          style={{ gridColumn: `${dayIndex + 1}`, gridRow: '1 / -1' }}
          className={`
            grid min-h-[3.25rem] grid-cols-[1.25rem_minmax(0,1fr)] gap-1 rounded-xs p-1 transition-all duration-200
            ${isSelectable ? 'cursor-pointer' : ''}
            ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
            ${isToday ? 'bg-blue-50' : isSelectable ? 'bg-white' : 'hover:bg-gray-50'}
            ${isSelected ? 'ring-2 ring-slate-600 ring-inset bg-slate-50' : ''}
          `}
        >
          <div
            className={`flex items-start justify-center pt-0.5 text-sm leading-tight ${
              isToday ? 'font-semibold text-blue-700' : ''
            } ${isSelected ? 'font-semibold text-slate-900' : ''}`}
          >
            {day.getDate()}
          </div>
          <MonthTaskStrip
            day={day}
            resolveTaskIcon={resolveTaskIcon}
            taskPillStyle={taskPillStyle}
            tasks={dayTasks}
            toDateKey={toDateKey}
          />
        </div>
      );
    }

    weeks.push(
      <div
        key={weekIndex}
        className="grid min-h-[3.25rem] grid-cols-7 gap-1"
      >
        {weekDays}
      </div>
    );

    currentIterDate.setDate(currentIterDate.getDate() + 7);
  }

  return (
    <div className="flex flex-col rounded-md bg-gray-200 p-2 transition-all duration-200">
      <div className="mb-1 grid shrink-0 grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="flex h-6 items-center justify-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      <div className="grid gap-1">{weeks}</div>
    </div>
  );
};

export default MonthCalendar;
