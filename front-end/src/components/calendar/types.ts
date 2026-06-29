import type { CSSProperties } from 'react';
import type { Task as TaskType } from '../../hooks/types';

export type TaskRange = {
  task: TaskType;
  start: Date;
  end: Date;
};

export type CalendarTaskSpan = TaskRange & {
  startColumn: number;
  endColumn: number;
};

export type PackedCalendarTaskSpan = CalendarTaskSpan & {
  lane: number;
};

export type TaskVisualHelpers = {
  formatTaskRange: (range: TaskRange) => string;
  resolveTaskIcon: (task: TaskType) => string;
  taskPillClasses: (task: TaskType) => string;
  taskPillStyle: (task: TaskType) => CSSProperties;
};
