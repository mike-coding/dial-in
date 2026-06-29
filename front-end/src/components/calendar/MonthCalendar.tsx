import WindowsEmoji from '../WindowsEmoji';
import type { CalendarTaskSpan, PackedCalendarTaskSpan, TaskVisualHelpers } from './types';

type MonthCalendarProps = Omit<TaskVisualHelpers, 'formatTaskRange'> & {
  currentDate: Date;
  getTaskSpansForRange: (rangeStartDate: Date, dayCount: number) => CalendarTaskSpan[];
  isSelectedDate?: (date: Date) => boolean;
  openDate?: (date: Date) => void;
  packTaskSpans: (spans: CalendarTaskSpan[]) => PackedCalendarTaskSpan[];
  selectDate?: (date: Date) => void;
  toDateKey: (date: Date) => string;
};

const MonthCalendar = ({
  currentDate,
  getTaskSpansForRange,
  isSelectedDate,
  openDate,
  packTaskSpans,
  resolveTaskIcon,
  selectDate,
  taskPillClasses,
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
    const weekSpans = packTaskSpans(getTaskSpansForRange(weekStart, 7));
    const visibleWeekSpans = weekSpans.filter((span) => span.lane < 3);
    const hiddenWeekSpans = weekSpans.filter((span) => span.lane >= 3);

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + dayIndex);

      const isCurrentMonth = day.getMonth() === currentDate.getMonth();
      const isToday = day.toDateString() === today.toDateString();
      const isSelected = Boolean(isSelectedDate?.(day));
      const hiddenDayCount = hiddenWeekSpans.filter(
        (span) => span.startColumn <= dayIndex && span.endColumn >= dayIndex
      ).length;

      weekDays.push(
        <div
          key={toDateKey(day)}
          onClick={selectDate ? () => selectDate(day) : undefined}
          onDoubleClick={openDate ? () => openDate(day) : undefined}
          style={{ gridColumn: `${dayIndex + 1}`, gridRow: '1 / -1' }}
          className={`
            rounded transition-all duration-200
            ${isSelectable ? 'cursor-pointer' : ''}
            ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
            ${isToday ? 'bg-blue-50' : isSelectable ? 'bg-white' : 'hover:bg-gray-50'}
            ${isSelected ? 'ring-2 ring-slate-600 ring-inset bg-slate-50' : ''}
          `}
        />
      );

      weekDays.push(
        <div
          key={`${toDateKey(day)}-label`}
          onClick={selectDate ? () => selectDate(day) : undefined}
          onDoubleClick={openDate ? () => openDate(day) : undefined}
          style={{ gridColumn: `${dayIndex + 1}`, gridRow: '1' }}
          className={`z-10 flex items-center justify-center text-sm ${
            isSelectable ? 'cursor-pointer' : ''
          } ${isToday ? 'font-semibold text-blue-700' : ''} ${isSelected ? 'font-semibold text-slate-900' : ''}`}
        >
          {day.getDate()}
        </div>
      );

      if (hiddenDayCount > 0) {
        weekDays.push(
          <div
            key={`${toDateKey(day)}-more`}
            style={{ gridColumn: `${dayIndex + 1}`, gridRow: '5' }}
            className="pointer-events-none z-10 min-w-0 px-1 text-[10px] text-gray-500"
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
            className={`pointer-events-none z-20 min-w-0 rounded border-l-4 px-1.5 py-0.5 text-[10px] ${taskPillClasses(span.task)}`}
            style={{
              gridColumn: `${span.startColumn + 1} / ${span.endColumn + 2}`,
              gridRow: span.lane + 2,
              ...taskPillStyle(span.task),
            }}
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
      <div className="mb-2 grid shrink-0 grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-rows-6 gap-1">{weeks}</div>
    </div>
  );
};

export default MonthCalendar;
