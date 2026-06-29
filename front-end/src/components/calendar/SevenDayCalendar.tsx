import WindowsEmoji from '../WindowsEmoji';
import type { CalendarTaskSpan, PackedCalendarTaskSpan, TaskRange, TaskVisualHelpers } from './types';

type SevenDayCalendarProps = Omit<TaskVisualHelpers, 'formatTaskRange'> & {
  getTaskSpansForRange: (rangeStartDate: Date, dayCount: number) => CalendarTaskSpan[];
  getTasksForDate: (date: Date) => TaskRange[];
  isSelectedDate?: (date: Date) => boolean;
  openDate?: (date: Date) => void;
  packTaskSpans: (spans: CalendarTaskSpan[]) => PackedCalendarTaskSpan[];
  rangeStart: Date;
  selectDate?: (date: Date) => void;
  toDateKey: (date: Date) => string;
};

const SevenDayCalendar = ({
  getTaskSpansForRange,
  getTasksForDate,
  isSelectedDate,
  openDate,
  packTaskSpans,
  rangeStart,
  resolveTaskIcon,
  selectDate,
  taskPillClasses,
  taskPillStyle,
  toDateKey,
}: SevenDayCalendarProps) => {
  const today = new Date();
  const spans = packTaskSpans(getTaskSpansForRange(rangeStart, 7));
  const laneCount = Math.max(1, ...spans.map((span) => span.lane + 1));
  const gridTemplateRows = `4.5rem repeat(${laneCount}, minmax(1.75rem, auto)) minmax(0, 1fr)`;
  const days = Array.from({ length: 7 }, (_, dayIndex) => {
    const day = new Date(rangeStart);
    day.setDate(rangeStart.getDate() + dayIndex);
    return day;
  });
  const isSelectable = Boolean(selectDate || openDate);

  return (
    <div className="h-[16rem] overflow-y-auto rounded-md bg-white p-0.5 transition-all duration-200">
      <div className="grid min-h-full grid-cols-7 gap-0.5" style={{ gridTemplateRows }}>
        {days.map((day, dayIndex) => {
          const isToday = day.toDateString() === today.toDateString();
          const isSelected = Boolean(isSelectedDate?.(day));
          const hasTasks = getTasksForDate(day).length > 0;

          return (
            <div
              key={toDateKey(day)}
              onClick={selectDate ? () => selectDate(day) : undefined}
              onDoubleClick={openDate ? () => openDate(day) : undefined}
              style={{ gridColumn: `${dayIndex + 1}`, gridRow: '1 / -1', gridTemplateRows }}
              className={`grid min-h-0 min-w-0 rounded-md p-1 transition-colors duration-200 ${
                isSelectable ? 'cursor-pointer' : 'hover:bg-gray-50'
              } ${isToday ? 'bg-blue-50' : 'bg-white'} ${isSelected ? 'ring-2 ring-slate-600 ring-inset bg-slate-50' : ''}`}
            >
              <div
                className={`flex flex-col items-center justify-center text-center ${isToday ? 'text-blue-700' : 'text-gray-900'}`}
                style={{ gridRow: '1' }}
              >
                <div className="text-xs font-medium">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-base font-semibold leading-tight">{day.getDate()}</div>
              </div>

              {!hasTasks && (
                <div className="min-w-0 text-xs text-gray-400" style={{ gridRow: `${laneCount + 2}` }}>
                  No tasks
                </div>
              )}
            </div>
          );
        })}

        {spans.map((span) => (
          <div
            key={`${span.task.id}-${span.startColumn}-${span.endColumn}`}
            className={`pointer-events-none z-20 min-w-0 rounded border-l-4 px-1.5 py-0.5 text-[11px] ${taskPillClasses(span.task)}`}
            style={{
              gridColumn: `${span.startColumn + 1} / ${span.endColumn + 2}`,
              gridRow: span.lane + 2,
              ...taskPillStyle(span.task),
            }}
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

export default SevenDayCalendar;
