export type FrequencyCode = "d" | "w" | "m" | "mw" | "y";
export type OccurrenceCode = "1" | "2" | "3" | "4" | "L";

export interface MonthlyWeekdayEntry {
  id: number;
  occurrence: OccurrenceCode;
  weekday: number;
}

export interface YearlyDateEntry {
  id: number;
  month: number;
  date: string;
}

export interface RuleSegment {
  id: number;
  frequency: FrequencyCode;
  dailyInterval: string;
  weeklyDays: number[];
  monthlyDates: number[];
  monthlyWeekdays: MonthlyWeekdayEntry[];
  yearlyDates: YearlyDateEntry[];
  hasMonthFilter: boolean;
  months: number[];
  hasTime: boolean;
  time: string;
}

export interface RuleDraft {
  name: string;
  description: string;
  categoryId: string;
  isActive: boolean;
  segments: RuleSegment[];
}
