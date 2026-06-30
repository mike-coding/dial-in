import { useLayoutEffect, useRef, useState } from 'react';
import WindowsEmoji from '../WindowsEmoji';
import type { TaskRange, TaskVisualHelpers } from './types';

type MonthCalendarProps = Omit<TaskVisualHelpers, 'formatTaskRange' | 'taskPillClasses'> & {
  currentDate: Date;
  getTasksForDate: (date: Date) => TaskRange[];
  isMobile?: boolean;
  isSelectedDate?: (date: Date) => boolean;
  openDate?: (date: Date) => void;
  selectDate?: (date: Date) => void;
  toDateKey: (date: Date) => string;
};

type MonthTaskStripProps = Pick<TaskVisualHelpers, 'resolveTaskIcon' | 'taskPillStyle'> & {
  tasks: TaskRange[];
  toDateKey: (date: Date) => string;
  day: Date;
  isMobile?: boolean;
};

const MonthTaskStrip = ({ day, isMobile = false, resolveTaskIcon, taskPillStyle, tasks, toDateKey }: MonthTaskStripProps) => {
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
  }, [isMobile, tasks.length]);

  if (tasks.length === 0) {
    return null;
  }

  const capacity = tileCapacity ?? tasks.length;
  const visibleTaskLimit = tasks.length > capacity ? Math.max(0, capacity - 1) : capacity;
  const visibleTasks = tasks.slice(0, visibleTaskLimit);
  const hiddenTaskCount = tasks.length - visibleTasks.length;
  const stripClasses = isMobile
    ? 'pointer-events-none mx-0.5 mt-0.5 flex min-w-0 flex-nowrap content-start gap-0.5 overflow-hidden'
    : 'pointer-events-none m-2 flex min-w-0 flex-nowrap content-start gap-1 overflow-hidden';
  const tileClasses = isMobile
    ? 'flex h-4 w-4 min-w-4 items-center justify-center rounded-sm border-l-2 text-[9px] leading-none'
    : 'flex h-6 w-6 min-w-6 items-center justify-center rounded-sm border-l-2 text-[10px] leading-none';
  const overflowTileClasses = isMobile
    ? 'flex h-4 w-4 min-w-4 items-center justify-center rounded-sm bg-gray-200 text-[8px] font-bold leading-none text-gray-500'
    : 'flex h-6 w-6 min-w-6 items-center justify-center rounded-sm bg-gray-200 text-[10px] font-bold leading-none text-gray-500';
  const emojiSize = isMobile ? 8 : 11;

  return (
    <div ref={stripRef} className={stripClasses}>
      {visibleTasks.map((range) => (
        <div
          key={`${range.task.id}-${toDateKey(day)}`}
          data-month-task-tile
          className={tileClasses}
          style={taskPillStyle(range.task)}
          title={range.task.title}
        >
          <WindowsEmoji emoji={resolveTaskIcon(range.task)} size={emojiSize} />
        </div>
      ))}
      {hiddenTaskCount > 0 && (
        <div
          data-month-task-tile
          className={overflowTileClasses}
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
  isMobile = false,
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
      const dayCellClasses = isMobile
        ? 'flex min-h-[2.75rem] min-w-0 flex-col rounded-xs p-0.5 transition-all duration-200'
        : 'grid min-h-[3.25rem] grid-cols-[1.25rem_minmax(0,1fr)] gap-1 rounded-xs p-1 transition-all duration-200';
      const dayNumberClasses = isMobile
        ? 'flex h-4 items-center justify-start pl-1 text-xs leading-none'
        : 'flex items-start justify-center pt-0.5 text-sm leading-tight';

      weekDays.push(
        <div
          key={toDateKey(day)}
          onClick={selectDate ? () => selectDate(day) : undefined}
          onDoubleClick={openDate ? () => openDate(day) : undefined}
          style={{ gridColumn: `${dayIndex + 1}`, gridRow: '1 / -1' }}
          className={`
            ${dayCellClasses}
            ${isSelectable ? 'cursor-pointer' : ''}
            ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
            ${isToday ? 'bg-blue-50' : isSelectable ? 'bg-white' : 'hover:bg-gray-50'}
            ${isSelected ? 'ring-2 ring-slate-600 ring-inset bg-slate-50' : ''}
          `}
        >
          <div
            className={`${dayNumberClasses} ${
              isToday ? 'font-semibold text-blue-700' : ''
            } ${isSelected ? 'font-semibold text-slate-900' : ''}`}
          >
            {day.getDate()}
          </div>
          <MonthTaskStrip
            day={day}
            isMobile={isMobile}
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
        className={isMobile ? 'grid min-h-[2.75rem] grid-cols-7 gap-1' : 'grid min-h-[3.25rem] grid-cols-7 gap-1'}
      >
        {weekDays}
      </div>
    );

    currentIterDate.setDate(currentIterDate.getDate() + 7);
  }

  return (
    <div className={`flex flex-col rounded-md bg-white transition-all duration-200 ${isMobile ? 'p-1' : 'p-2'}`}>
      <div className={`mb-1 grid shrink-0 grid-cols-7 gap-1 ${isMobile ? 'text-[11px]' : ''}`}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className={`flex items-center justify-center font-medium text-gray-500 ${isMobile ? 'h-5 text-[11px]' : 'h-6 text-xs'}`}>
            {day}
          </div>
        ))}
      </div>
      <div className="grid gap-1">{weeks}</div>
    </div>
  );
};

export default MonthCalendar;
