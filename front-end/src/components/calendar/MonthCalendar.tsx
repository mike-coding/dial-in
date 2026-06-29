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
      const visibleDayTasks = dayTasks.slice(0, 12);
      const hiddenDayCount = dayTasks.length - visibleDayTasks.length;

      weekDays.push(
        <div
          key={toDateKey(day)}
          onClick={selectDate ? () => selectDate(day) : undefined}
          onDoubleClick={openDate ? () => openDate(day) : undefined}
          style={{ gridColumn: `${dayIndex + 1}`, gridRow: '1 / -1' }}
          className={`
            rounded p-1 transition-all duration-200
            ${isSelectable ? 'cursor-pointer' : ''}
            ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
            ${isToday ? 'bg-blue-50' : isSelectable ? 'bg-white' : 'hover:bg-gray-50'}
            ${isSelected ? 'ring-2 ring-slate-600 ring-inset bg-slate-50' : ''}
          `}
        >
          <div
            className={`flex items-center justify-center text-sm ${
              isToday ? 'font-semibold text-blue-700' : ''
            } ${isSelected ? 'font-semibold text-slate-900' : ''}`}
          >
            {day.getDate()}
          </div>
          <div className="pointer-events-none mt-1 flex flex-wrap content-start gap-0.5 overflow-hidden">
            {visibleDayTasks.map((range) => (
              <div
                key={`${range.task.id}-${toDateKey(day)}`}
                className="flex h-6 w-6 min-w-6 items-center justify-center rounded-sm border-l-2 text-[10px] leading-none"
                style={taskPillStyle(range.task)}
                title={range.task.title}
              >
                <WindowsEmoji emoji={resolveTaskIcon(range.task)} size={11} />
              </div>
            ))}
            {hiddenDayCount > 0 && (
              <div className="flex h-4 min-w-4 items-center justify-center rounded-sm bg-gray-100 px-0.5 text-[10px] leading-none text-gray-500">
                +{hiddenDayCount}
              </div>
            )}
          </div>
        </div>
      );
    }

    weeks.push(
      <div
        key={weekIndex}
        className="grid min-h-0 grid-cols-7 gap-1"
      >
        {weekDays}
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
