import WindowsEmoji from '../WindowsEmoji';
import OverlayScrollPane from '../OverlayScrollPane';
import { layoutOverlappingTimelineItems } from '../../utils/timelineLayout';
import type { TaskRange, TaskVisualHelpers } from './types';

type DayTimelineProps = TaskVisualHelpers & {
  currentDate: Date;
  dayTaskRanges: TaskRange[];
};

const DayTimeline = ({
  currentDate,
  dayTaskRanges,
  formatTaskRange,
  resolveTaskIcon,
  taskPillClasses,
  taskPillStyle,
}: DayTimelineProps) => {
  const currentDayStart = new Date(currentDate);
  currentDayStart.setHours(0, 0, 0, 0);
  const currentDayEnd = new Date(currentDate);
  currentDayEnd.setHours(23, 59, 59, 999);
  const timelineTaskRanges = dayTaskRanges
    .filter((range) => range.start <= currentDayEnd && range.end >= currentDayStart)
    .map((range) => ({
      ...range,
      start: range.start < currentDayStart ? currentDayStart : range.start,
      end: range.end > currentDayEnd ? currentDayEnd : range.end,
    }));
  const timedTaskLayouts = layoutOverlappingTimelineItems(timelineTaskRanges);
  const rowHeight = 32;
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
      <div key={hour} className="flex h-8 border-b border-gray-100">
        <div className="w-14 border-r border-gray-100 px-2 py-1 text-[11px] leading-tight text-gray-500">{timeString}</div>
        <div className="flex-1 cursor-pointer p-1 hover:bg-gray-50" />
      </div>
    );
  }

  return (
    <div className="flex h-[18rem] min-h-0 flex-col overflow-hidden rounded-md bg-white transition-all duration-200">
      <OverlayScrollPane className="pr-2">
        <div className="relative">
          {timeSlots}
          <div className="pointer-events-none absolute left-14 right-2 top-0">
            {timedTaskLayouts.map(({ item: range, column, columnCount, startMinute, durationMinutes }) => {
              const columnWidth = 100 / columnCount;
              const horizontalGapOffset = (column * columnGap) / columnCount;
              const horizontalGapWidth = ((columnCount - 1) * columnGap) / columnCount;
              const isCompactTask = durationMinutes < 45;

              return (
                <div
                  key={range.task.id}
                  className={`absolute min-w-0 overflow-hidden rounded-md border-l-4 px-1.5 py-0.5 text-[11px] leading-none ${taskPillClasses(range.task)}`}
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
                    <WindowsEmoji emoji={resolveTaskIcon(range.task)} size={10} />
                    <span className="truncate">{range.task.title}</span>
                  </div>
                  {!isCompactTask && (
                    <div className="truncate text-[10px] leading-tight opacity-75">{formatTaskRange(range)}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </OverlayScrollPane>
    </div>
  );
};

export default DayTimeline;
