import { Task } from "../hooks/types";

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;
const TIME_PATTERN = /^(\d{2}):(\d{2})/;

export const toDateOnlyValue = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const match = value.match(DATE_ONLY_PATTERN);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${parsed.getFullYear()}-${month}-${day}`;
};

export const toTimeOnlyValue = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const match = value.match(TIME_PATTERN);
  return match ? `${match[1]}:${match[2]}` : "";
};

export const combineDateAndTime = (
  dateValue?: string | null,
  timeValue?: string | null,
  options?: { endOfDayWithoutTime?: boolean }
) => {
  const dateOnly = toDateOnlyValue(dateValue);
  if (!dateOnly) {
    return null;
  }

  const [, yearText, monthText, dayText] = dateOnly.match(DATE_ONLY_PATTERN) || [];
  const timeOnly = toTimeOnlyValue(timeValue);
  const [, hourText, minuteText] = timeOnly.match(TIME_PATTERN) || [];
  const hours = hourText ? Number(hourText) : options?.endOfDayWithoutTime ? 23 : 0;
  const minutes = minuteText ? Number(minuteText) : options?.endOfDayWithoutTime ? 59 : 0;
  const seconds = timeOnly ? 0 : options?.endOfDayWithoutTime ? 59 : 0;
  const milliseconds = timeOnly ? 0 : options?.endOfDayWithoutTime ? 999 : 0;

  return new Date(
    Number(yearText),
    Number(monthText) - 1,
    Number(dayText),
    hours,
    minutes,
    seconds,
    milliseconds
  );
};

export const getTaskStart = (task: Task) => combineDateAndTime(task.due_date, task.due_time);

export const getTaskEnd = (task: Task) =>
  task.end_date
    ? combineDateAndTime(task.end_date, task.end_time, { endOfDayWithoutTime: true })
    : getTaskStart(task);

export const hasTaskTime = (task: Task) => Boolean(task.due_time || task.end_time);
