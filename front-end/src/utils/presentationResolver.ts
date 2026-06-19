import { Category, Rule, Task } from "../hooks/types";
import type { CSSProperties } from "react";

type CSSVariableProperties = CSSProperties & Record<`--${string}`, string>;

const normalizeValue = (value?: string | null) => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || undefined;
};

const normalizeColor = (value?: string | null) => {
  const trimmed = normalizeValue(value);
  return trimmed && /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed.toLowerCase() : undefined;
};

const findCategory = (categories: Category[], categoryId?: number | null) =>
  categories.find((category) => category.id === categoryId);

const findParentRule = (task: Task, rules: Rule[]) =>
  task.rule_id ? rules.find((rule) => rule.id === task.rule_id) : undefined;

const findCategoryIcon = (categories: Category[], categoryId?: number | null) =>
  normalizeValue(findCategory(categories, categoryId)?.icon);

const findCategoryColor = (categories: Category[], categoryId?: number | null) =>
  normalizeColor(findCategory(categories, categoryId)?.color);

export const resolveRuleIcon = (
  rule: Rule,
  categories: Category[],
  fallbackIcon = "⚙️"
) => normalizeValue(rule.icon) || findCategoryIcon(categories, rule.category_id) || fallbackIcon;

export const resolveRuleColor = (
  rule: Rule,
  categories: Category[]
) => normalizeColor(rule.color) || findCategoryColor(categories, rule.category_id);

export const resolveTaskIcon = (
  task: Task,
  rules: Rule[],
  categories: Category[],
  fallbackIcon = "📝"
) => {
  const parentRule = findParentRule(task, rules);

  return (
    normalizeValue(task.icon) ||
    normalizeValue(parentRule?.icon) ||
    findCategoryIcon(categories, task.category_id) ||
    findCategoryIcon(categories, parentRule?.category_id) ||
    fallbackIcon
  );
};

export const resolveTaskColor = (
  task: Task,
  rules: Rule[],
  categories: Category[]
) => {
  const parentRule = findParentRule(task, rules);

  return (
    normalizeColor(task.color) ||
    normalizeColor(parentRule?.color) ||
    findCategoryColor(categories, task.category_id) ||
    findCategoryColor(categories, parentRule?.category_id)
  );
};

export const resolveInheritedTaskIcon = (
  task: Task,
  rules: Rule[],
  categories: Category[],
  fallbackIcon = "📝"
) => {
  const parentRule = findParentRule(task, rules);

  return (
    normalizeValue(parentRule?.icon) ||
    findCategoryIcon(categories, task.category_id) ||
    findCategoryIcon(categories, parentRule?.category_id) ||
    fallbackIcon
  );
};

export const resolveInheritedTaskColor = (
  task: Task,
  rules: Rule[],
  categories: Category[]
) => {
  const parentRule = findParentRule(task, rules);

  return (
    normalizeColor(parentRule?.color) ||
    findCategoryColor(categories, task.category_id) ||
    findCategoryColor(categories, parentRule?.category_id)
  );
};

export const mixColor = (color: string, target: string, amount: number) => {
  const clampedAmount = Math.max(0, Math.min(1, amount));
  const readChannel = (source: string, start: number) => parseInt(source.slice(start, start + 2), 16);
  const channels = [1, 3, 5].map((start) => {
    const sourceValue = readChannel(color, start);
    const targetValue = readChannel(target, start);
    return Math.round(sourceValue + (targetValue - sourceValue) * clampedAmount)
      .toString(16)
      .padStart(2, "0");
  });

  return `#${channels.join("")}`;
};

const getRelativeLuminance = (color: string) => {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(color.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

const pickMoreDistinctFill = (referenceColor: string, candidates: string[]) => {
  const referenceLuminance = getRelativeLuminance(referenceColor);

  return candidates.reduce((bestCandidate, candidate) => {
    const bestDelta = Math.abs(getRelativeLuminance(bestCandidate) - referenceLuminance);
    const candidateDelta = Math.abs(getRelativeLuminance(candidate) - referenceLuminance);
    return candidateDelta > bestDelta ? candidate : bestCandidate;
  }, candidates[0]);
};

interface ColoredSurfaceOptions {
  muted?: boolean;
  includeBorder?: boolean;
  fallbackBackground?: string;
  fallbackTextColor?: string;
}

export const getDerivedTextColor = (color: string, muted = false) =>
  muted ? mixColor(color, "#6b7280", 0.55) : mixColor(color, "#111827", 0.45);

export const getColoredSurfaceStyle = (
  color?: string,
  {
    muted = false,
    includeBorder = true,
    fallbackBackground,
    fallbackTextColor,
  }: ColoredSurfaceOptions = {}
): CSSProperties => {
  if (!color) {
    return {
      ...(fallbackBackground ? { backgroundColor: fallbackBackground } : {}),
      ...(fallbackTextColor ? { color: fallbackTextColor } : {}),
      ...(includeBorder ? { borderLeftColor: "transparent" } : {}),
    };
  }

  if (muted) {
    return {
      backgroundColor: mixColor(color, "#ffffff", 0.9),
      color: getDerivedTextColor(color, true),
      ...(includeBorder ? { borderLeftColor: mixColor(color, "#ffffff", 0.35) } : {}),
    };
  }

  return {
    backgroundColor: mixColor(color, "#ffffff", 0.82),
    color: getDerivedTextColor(color),
    ...(includeBorder
      ? {
          borderColor: mixColor(color, "#ffffff", 0.45),
          borderLeftColor: color,
        }
      : {}),
  };
};

interface DerivedFieldOptions {
  muted?: boolean;
  selected?: boolean;
}

export const getDerivedFieldStyle = (
  color?: string | null,
  { muted = false, selected = false }: DerivedFieldOptions = {}
): CSSVariableProperties => {
  const normalizedColor = normalizeColor(color);

  if (!normalizedColor) {
    return {
      "--derived-field-bg": selected ? "#e5e7eb" : "#f3f4f6",
      "--derived-field-hover-bg": selected ? "#d1d5db" : "#e5e7eb",
      "--derived-field-focus-bg": selected ? "#d1d5db" : "#e5e7eb",
      "--derived-field-border": "transparent",
      "--derived-field-focus-ring": "#d1d5db",
    };
  }

  const surfaceColor = mixColor(normalizedColor, "#ffffff", muted ? 0.9 : 0.82);
  const fieldBackground = pickMoreDistinctFill(surfaceColor, [
    mixColor(normalizedColor, "#ffffff", muted ? 0.98 : 0.95),
    mixColor(normalizedColor, "#ffffff", muted ? 0.74 : selected ? 0.58 : 0.64),
  ]);
  const hoverBackground = pickMoreDistinctFill(fieldBackground, [
    mixColor(normalizedColor, "#ffffff", muted ? 0.94 : 0.9),
    mixColor(normalizedColor, "#ffffff", muted ? 0.68 : selected ? 0.5 : 0.56),
  ]);

  return {
    "--derived-field-bg": fieldBackground,
    "--derived-field-hover-bg": hoverBackground,
    "--derived-field-focus-bg": hoverBackground,
    "--derived-field-border": "transparent",
    "--derived-field-focus-ring": mixColor(normalizedColor, "#ffffff", 0.52),
  };
};
