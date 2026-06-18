import { Rule as RuleType } from "../../hooks/types";
import { FrequencyCode, OccurrenceCode, RuleDraft, RuleSegment } from "./types";

export const weekdayOptions = [
  { value: 1, label: "Sun" },
  { value: 2, label: "Mon" },
  { value: 3, label: "Tue" },
  { value: 4, label: "Wed" },
  { value: 5, label: "Thu" },
  { value: 6, label: "Fri" },
  { value: 7, label: "Sat" },
];

export const monthOptions = [
  { value: 1, label: "Jan" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Apr" },
  { value: 5, label: "May" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Aug" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Oct" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dec" },
];

export const occurrenceOptions: Array<{ value: OccurrenceCode; label: string }> = [
  { value: "1", label: "1st" },
  { value: "2", label: "2nd" },
  { value: "3", label: "3rd" },
  { value: "4", label: "4th" },
  { value: "L", label: "Last" },
];

export const frequencyOptions: Array<{ value: FrequencyCode; label: string }> = [
  { value: "d", label: "Daily" },
  { value: "w", label: "Weekly" },
  { value: "m", label: "Monthly" },
  { value: "mw", label: "Nth weekday" },
  { value: "y", label: "Yearly" },
];

const weekdaySummaryLabelMap: Record<number, string> = {
  1: "Sunday",
  2: "Monday",
  3: "Tuesday",
  4: "Wednesday",
  5: "Thursday",
  6: "Friday",
  7: "Saturday",
};

const monthLabelMap: Record<number, string> = {
  1: "Jan",
  2: "Feb",
  3: "Mar",
  4: "Apr",
  5: "May",
  6: "Jun",
  7: "Jul",
  8: "Aug",
  9: "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dec",
};

const occurrenceLabelMap: Record<string, string> = {
  "1": "1st",
  "2": "2nd",
  "3": "3rd",
  "4": "4th",
  L: "Last",
};

export const nextId = () => Date.now() + Math.floor(Math.random() * 1000);

export const createEmptySegment = (frequency: FrequencyCode = "d"): RuleSegment => ({
  id: nextId(),
  frequency,
  dailyInterval: "1",
  weeklyDays: [2],
  monthlyDates: [1],
  monthlyWeekdays: [{ id: nextId(), occurrence: "1", weekday: 2 }],
  yearlyDates: [{ id: nextId(), month: 1, date: "1" }],
  hasMonthFilter: false,
  months: [],
  hasTime: false,
  time: "09:00",
});

export const createEmptyDraft = (): RuleDraft => ({
  name: "",
  icon: "",
  description: "",
  categoryId: "",
  isActive: true,
  segments: [createEmptySegment()],
});

export const sortNumbers = (values: number[]) => [...new Set(values)].sort((left, right) => left - right);

const formatList = (values: string[]): string => {
  if (values.length === 0) {
    return "";
  }

  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
};

const formatOrdinal = (value: string | number): string => {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue)) {
    return String(value);
  }

  const mod100 = numberValue % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${numberValue}th`;
  }

  const mod10 = numberValue % 10;
  if (mod10 === 1) {
    return `${numberValue}st`;
  }
  if (mod10 === 2) {
    return `${numberValue}nd`;
  }
  if (mod10 === 3) {
    return `${numberValue}rd`;
  }

  return `${numberValue}th`;
};

const formatTime = (value: string): string => {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return value;
  }

  const [, hoursText, minutes] = match;
  const hours = Number(hoursText);
  const suffix = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${normalizedHours}:${minutes} ${suffix}`;
};

export const encodeSegment = (segment: RuleSegment): string => {
  let encoded = "";

  if (segment.frequency === "d") {
    encoded = `d#${segment.dailyInterval}`;
  }

  if (segment.frequency === "w") {
    encoded = `w#${sortNumbers(segment.weeklyDays).join("")}`;
  }

  if (segment.frequency === "m") {
    encoded = `m#${sortNumbers(segment.monthlyDates).join(",")}`;
  }

  if (segment.frequency === "mw") {
    encoded = `mw#${segment.monthlyWeekdays.map((entry) => `${entry.occurrence}-${entry.weekday}`).join(",")}`;
  }

  if (segment.frequency === "y") {
    encoded = `y#${segment.yearlyDates.map((entry) => `${entry.month}-${entry.date}`).join(",")}`;
  }

  if (segment.hasMonthFilter) {
    encoded += `M#${sortNumbers(segment.months).join(",")}`;
  }

  if (segment.hasTime) {
    encoded += `T#${segment.time}`;
  }

  return encoded;
};

const summarizeSegment = (segmentPattern: string): string => {
  const frequencyMatch = segmentPattern.match(/^(mw|d|w|m|y)#([^MT;]+)/);
  if (!frequencyMatch) {
    return "Custom schedule";
  }

  const [, frequency, rawPattern] = frequencyMatch;
  const monthFilterMatch = segmentPattern.match(/M#([^T;]+)/);
  const timeMatch = segmentPattern.match(/T#(\d{2}:\d{2})/);

  let summary = "Custom schedule";

  if (frequency === "d") {
    summary = rawPattern === "1" ? "Daily" : `Every ${rawPattern} days`;
  }

  if (frequency === "w") {
    const dayLabels = rawPattern
      .split("")
      .map((value) => weekdaySummaryLabelMap[Number(value)])
      .filter(Boolean);
    if (dayLabels.length === 1) {
      summary = `Every ${dayLabels[0]}`;
    } else if (dayLabels.length > 1) {
      summary = `Every ${formatList(dayLabels)}`;
    } else {
      summary = "Weekly";
    }
  }

  if (frequency === "m") {
    const dates = rawPattern.split(",").map((value) => formatOrdinal(value));
    summary = `Monthly on the ${formatList(dates)}`;
  }

  if (frequency === "mw") {
    const values = rawPattern.split(",").map((entry) => {
      const [occurrence, weekday] = entry.split("-");
      const occurrenceLabel = occurrenceLabelMap[occurrence] || occurrence;
      const weekdayLabel = weekdaySummaryLabelMap[Number(weekday)] || weekday;
      return `${occurrenceLabel} ${weekdayLabel}`;
    });
    summary = formatList(values);
  }

  if (frequency === "y") {
    const values = rawPattern.split(",").map((entry) => {
      const [month, date] = entry.split("-");
      const monthLabel = monthLabelMap[Number(month)] || month;
      return `${monthLabel} ${formatOrdinal(date)}`;
    });
    summary = `Every year on ${formatList(values)}`;
  }

  if (monthFilterMatch?.[1]) {
    const monthLabels = monthFilterMatch[1]
      .split(",")
      .map((value) => monthLabelMap[Number(value)])
      .filter(Boolean);
    if (monthLabels.length > 0) {
      summary += ` in ${formatList(monthLabels)}`;
    }
  }

  if (timeMatch?.[1]) {
    summary += ` at ${formatTime(timeMatch[1])}`;
  }

  return summary;
};

export const summarizeRatePattern = (ratePattern: string): string =>
  ratePattern
    .split(";")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => summarizeSegment(segment))
    .join(" • ");

const parseSegmentPattern = (segmentPattern: string): RuleSegment => {
  const trimmedPattern = segmentPattern.trim();
  const frequencyMatch = trimmedPattern.match(/^(mw|d|w|m|y)#([^MT;]+)/);

  if (!frequencyMatch) {
    return createEmptySegment();
  }

  const [, frequency, rawPattern] = frequencyMatch;
  const segment = createEmptySegment(frequency as FrequencyCode);
  const monthFilterMatch = trimmedPattern.match(/M#([^T;]+)/);
  const timeMatch = trimmedPattern.match(/T#(\d{2}:\d{2})/);

  if (frequency === "d") {
    segment.dailyInterval = rawPattern;
  }

  if (frequency === "w") {
    segment.weeklyDays = rawPattern
      .split("")
      .map((value) => Number(value))
      .filter((value) => value >= 1 && value <= 7);
  }

  if (frequency === "m") {
    segment.monthlyDates = rawPattern
      .split(",")
      .map((value) => Number(value))
      .filter((value) => value >= 1 && value <= 31);
  }

  if (frequency === "mw") {
    segment.monthlyWeekdays = rawPattern
      .split(",")
      .map((entry) => {
        const [occurrence, weekday] = entry.split("-");
        return {
          id: nextId(),
          occurrence: (occurrence || "1") as OccurrenceCode,
          weekday: Number(weekday) || 2,
        };
      })
      .filter((entry) => entry.weekday >= 1 && entry.weekday <= 7);
  }

  if (frequency === "y") {
    segment.yearlyDates = rawPattern
      .split(",")
      .map((entry) => {
        const [month, date] = entry.split("-");
        return {
          id: nextId(),
          month: Number(month) || 1,
          date: date || "1",
        };
      })
      .filter((entry) => entry.month >= 1 && entry.month <= 12);
  }

  if (monthFilterMatch?.[1]) {
    segment.hasMonthFilter = true;
    segment.months = monthFilterMatch[1]
      .split(",")
      .map((value) => Number(value))
      .filter((value) => value >= 1 && value <= 12);
  }

  if (timeMatch?.[1]) {
    segment.hasTime = true;
    segment.time = timeMatch[1];
  }

  return segment;
};

const parseRatePattern = (ratePattern: string): RuleSegment[] => {
  const segments = ratePattern
    .split(";")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => parseSegmentPattern(segment));

  return segments.length > 0 ? segments : [createEmptySegment()];
};

export const createDraftFromRule = (rule: RuleType): RuleDraft => ({
  name: rule.name,
  icon: rule.icon || "",
  description: rule.description || "",
  categoryId: rule.category_id ? String(rule.category_id) : "",
  isActive: rule.is_active,
  segments: parseRatePattern(rule.rate_pattern),
});

export const getSegmentError = (segment: RuleSegment): string | null => {
  if (segment.frequency === "d") {
    const interval = Number(segment.dailyInterval);
    if (!Number.isInteger(interval) || interval < 1) {
      return "Daily rules need an interval of at least 1 day.";
    }
  }

  if (segment.frequency === "w" && segment.weeklyDays.length === 0) {
    return "Weekly rules need at least one weekday.";
  }

  if (segment.frequency === "m") {
    if (segment.monthlyDates.length === 0) {
      return "Monthly date rules need at least one date.";
    }
    if (segment.monthlyDates.some((value) => value < 1 || value > 31)) {
      return "Monthly dates must stay between 1 and 31.";
    }
  }

  if (segment.frequency === "mw" && segment.monthlyWeekdays.length === 0) {
    return "Monthly weekday rules need at least one occurrence.";
  }

  if (segment.frequency === "y") {
    if (segment.yearlyDates.length === 0) {
      return "Yearly rules need at least one month-date pair.";
    }
    if (segment.yearlyDates.some((entry) => entry.month < 1 || entry.month > 12)) {
      return "Yearly rules must use months 1 through 12.";
    }
    if (segment.yearlyDates.some((entry) => Number(entry.date) < 1 || Number(entry.date) > 31)) {
      return "Yearly rules must use dates 1 through 31.";
    }
  }

  if (segment.hasMonthFilter && segment.months.length === 0) {
    return "Month filters need at least one month.";
  }

  if (segment.hasTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(segment.time)) {
    return "Time must use HH:MM format.";
  }

  return null;
};

export const getFieldChrome = (isActive: boolean) =>
  isActive
    ? "border-gray-700 bg-gray-700 text-white"
    : "border-white/20 bg-white text-gray-700 hover:bg-gray-50";
