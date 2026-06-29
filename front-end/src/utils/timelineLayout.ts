export type TimelineRange = {
  start: Date;
  end: Date;
};

export type TimelineLayoutItem<T extends TimelineRange> = {
  item: T;
  column: number;
  columnCount: number;
  startMinute: number;
  durationMinutes: number;
};

const getMinuteOfDay = (date: Date) => date.getHours() * 60 + date.getMinutes();

const getVisualBounds = (range: TimelineRange, minDurationMinutes: number) => {
  const startMinute = getMinuteOfDay(range.start);
  const durationMinutes = Math.max(
    minDurationMinutes,
    (range.end.getTime() - range.start.getTime()) / 60000
  );

  return {
    startMinute,
    endMinute: startMinute + durationMinutes,
    durationMinutes,
  };
};

export const layoutOverlappingTimelineItems = <T extends TimelineRange>(
  items: T[],
  minDurationMinutes = 30
): TimelineLayoutItem<T>[] => {
  const sortedItems = items
    .map((item) => ({ item, ...getVisualBounds(item, minDurationMinutes) }))
    .sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute);

  const layouts: TimelineLayoutItem<T>[] = [];

  for (let index = 0; index < sortedItems.length;) {
    const group = [sortedItems[index]];
    let groupEndMinute = sortedItems[index].endMinute;
    index += 1;

    while (index < sortedItems.length && sortedItems[index].startMinute < groupEndMinute) {
      group.push(sortedItems[index]);
      groupEndMinute = Math.max(groupEndMinute, sortedItems[index].endMinute);
      index += 1;
    }

    const columnEndMinutes: number[] = [];
    const groupLayouts = group.map((entry) => {
      const availableColumn = columnEndMinutes.findIndex((endMinute) => endMinute <= entry.startMinute);
      const column = availableColumn === -1 ? columnEndMinutes.length : availableColumn;
      columnEndMinutes[column] = entry.endMinute;

      return {
        item: entry.item,
        column,
        columnCount: 1,
        startMinute: entry.startMinute,
        durationMinutes: entry.durationMinutes,
      };
    });

    const columnCount = Math.max(1, columnEndMinutes.length);
    groupLayouts.forEach((layout) => {
      layouts.push({ ...layout, columnCount });
    });
  }

  return layouts;
};
