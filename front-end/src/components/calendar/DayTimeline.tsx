import WindowsEmoji from '../WindowsEmoji';
import { hasTaskTime } from '../../utils/taskSchedule';
import { layoutOverlappingTimelineItems } from '../../utils/timelineLayout';
import type { TaskRange, TaskVisualHelpers } from './types';

type DayTimelineProps = TaskVisualHelpers & {
  currentDate: Date;
  dayTaskRanges: TaskRange[];
  toDateKey: (date: Date) => string;
};

const DayTimeline = ({
  currentDate,
  dayTaskRanges,
  formatTaskRange,
  resolveTaskIcon,
  taskPillClasses,
  taskPillStyle,
  toDateKey,
}: DayTimelineProps) => {
  const timedTaskRanges = dayTaskRanges.filter((range) => {
    const startsToday = toDateKey(range.start) === toDateKey(currentDate);
    const endsToday = toDateKey(range.end) === toDateKey(currentDate);
    const isTimedRange =
      hasTaskTime(range.task) &&
      range.task.due_time &&
      range.task.end_date &&
      range.task.end_time &&
      startsToday &&
      endsToday &&
      range.end > range.start;
    const isDueDateBlip = !range.task.end_date && startsToday && endsToday;

    return isTimedRange || isDueDateBlip;
  });
  const timedTaskLayouts = layoutOverlappingTimelineItems(timedTaskRanges);
  const rowHeight = 48;
  const columnGap = 4;
  const timeSlots = [];

  for (let hour = 0; hour < 24; hour++) {
    const time = new Date();
    time.setHours(hour, 0, 0, 0);
    const timeString = time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true,
    });

    timeSlots.push(
      <div key={hour} className="flex h-12 border-b border-gray-100">
        <div className="w-16 p-2 text-xs text-gray-500 border-r border-gray-100">{timeString}</div>
        <div className="flex-1 p-2 hover:bg-gray-50 cursor-pointer" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[32rem] flex-col rounded-md bg-white transition-all duration-200">
      <div className="shrink-0 p-4">
        {dayTaskRanges.length === 0 ? (
          <div className="text-sm text-gray-500">No scheduled tasks</div>
        ) : (
          <div className="space-y-2">
            {dayTaskRanges.map((range) => (
              <div
                key={range.task.id}
                className={`flex items-center gap-2 rounded-md border-l-4 px-3 py-2 ${
                  range.task.is_completed ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-900'
                }`}
                style={taskPillStyle(range.task)}
              >
                <WindowsEmoji emoji={resolveTaskIcon(range.task)} size={16} />
                <span className={`min-w-0 flex-1 truncate text-sm ${range.task.is_completed ? 'line-through' : ''}`}>
                  {range.task.title}
                </span>
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
            {timedTaskLayouts.map(({ item: range, column, columnCount, startMinute, durationMinutes }) => {
              const columnWidth = 100 / columnCount;
              const horizontalGapOffset = (column * columnGap) / columnCount;
              const horizontalGapWidth = ((columnCount - 1) * columnGap) / columnCount;

              return (
                <div
                  key={range.task.id}
                  className={`absolute min-w-0 rounded-md border-l-4 px-2 py-1 text-xs ${taskPillClasses(range.task)}`}
                  style={{
                    left: `calc(${column * columnWidth}% + ${horizontalGapOffset}px)`,
                    width: `calc(${columnWidth}% - ${horizontalGapWidth}px)`,
                    top: (startMinute / 60) * rowHeight,
                    height: (durationMinutes / 60) * rowHeight,
                    ...taskPillStyle(range.task),
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

export default DayTimeline;
