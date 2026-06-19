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

interface ColoredSurfaceOptions {
  muted?: boolean;
  includeBorder?: boolean;
  fallbackBackground?: string;
  fallbackTextColor?: string;
}

interface DerivedFieldOptions {
  muted?: boolean;
  selected?: boolean;
}

export interface DerivedFieldStyleTuning {
  targetColor: string;
  textTargetColor: string;
  mutedTextTargetColor: string;
  fallbackBackground: string;
  fallbackSelectedBackground: string;
  fallbackHoverBackground: string;
  fallbackSelectedHoverBackground: string;
  fallbackFocusRing: string;
  borderColor: string;
  cardBackgroundMix: number;
  mutedCardBackgroundMix: number;
  cardTextMix: number;
  mutedCardTextMix: number;
  cardBorderMix: number;
  mutedCardBorderMix: number;
  fieldBackgroundMix: number;
  fieldHoverBackgroundMix: number;
  selectedFieldBackgroundMix: number;
  selectedFieldHoverBackgroundMix: number;
  mutedFieldBackgroundMix: number;
  mutedFieldHoverBackgroundMix: number;
  focusRingMix: number;
}

export const DEFAULT_DERIVED_FIELD_STYLE_TUNING: DerivedFieldStyleTuning = {
  targetColor: "#ffffff",
  textTargetColor: "#111827",
  mutedTextTargetColor: "#6b7280",
  fallbackBackground: "#f3f4f6",
  fallbackSelectedBackground: "#e5e7eb",
  fallbackHoverBackground: "#e5e7eb",
  fallbackSelectedHoverBackground: "#d1d5db",
  fallbackFocusRing: "#d1d5db",
  borderColor: "transparent",
  cardBackgroundMix: 0.78,
  mutedCardBackgroundMix: 0.93,
  cardTextMix: 0.75,
  mutedCardTextMix: 0.55,
  cardBorderMix: 0,
  mutedCardBorderMix: 0.74,
  fieldBackgroundMix: 0.90,
  fieldHoverBackgroundMix: 0.90,
  selectedFieldBackgroundMix: 0.58,
  selectedFieldHoverBackgroundMix: 0.5,
  mutedFieldBackgroundMix: 1.00,
  mutedFieldHoverBackgroundMix: 1.00,
  focusRingMix: 0.52,
};

const getTuningColor = (
  value: string,
  fallback: string
) => normalizeColor(value) || normalizeColor(fallback) || "#ffffff";

export const getDerivedTextColor = (
  color: string,
  muted = false,
  tuning: DerivedFieldStyleTuning = DEFAULT_DERIVED_FIELD_STYLE_TUNING
) =>
  mixColor(
    color,
    muted
      ? getTuningColor(tuning.mutedTextTargetColor, DEFAULT_DERIVED_FIELD_STYLE_TUNING.mutedTextTargetColor)
      : getTuningColor(tuning.textTargetColor, DEFAULT_DERIVED_FIELD_STYLE_TUNING.textTargetColor),
    muted ? tuning.mutedCardTextMix : tuning.cardTextMix
  );

export const getColoredSurfaceStyle = (
  color?: string,
  {
    muted = false,
    includeBorder = true,
    fallbackBackground,
    fallbackTextColor,
  }: ColoredSurfaceOptions = {},
  tuning: DerivedFieldStyleTuning = DEFAULT_DERIVED_FIELD_STYLE_TUNING
): CSSProperties => {
  const targetColor = getTuningColor(tuning.targetColor, DEFAULT_DERIVED_FIELD_STYLE_TUNING.targetColor);

  if (!color) {
    return {
      ...(fallbackBackground ? { backgroundColor: fallbackBackground } : {}),
      ...(fallbackTextColor ? { color: fallbackTextColor } : {}),
      ...(includeBorder ? { borderLeftColor: tuning.borderColor } : {}),
    };
  }

  if (muted) {
    return {
      backgroundColor: mixColor(color, targetColor, tuning.mutedCardBackgroundMix),
      color: getDerivedTextColor(color, true, tuning),
      ...(includeBorder ? { borderLeftColor: mixColor(color, targetColor, tuning.mutedCardBorderMix) } : {}),
    };
  }

  return {
    backgroundColor: mixColor(color, targetColor, tuning.cardBackgroundMix),
    color: getDerivedTextColor(color, false, tuning),
    ...(includeBorder
      ? {
          borderColor: mixColor(color, targetColor, tuning.cardBorderMix),
          borderLeftColor: mixColor(color, targetColor, tuning.cardBorderMix),
        }
      : {}),
  };
};

export const getDerivedFieldStyle = (
  color?: string | null,
  { muted = false, selected = false }: DerivedFieldOptions = {},
  tuning: DerivedFieldStyleTuning = DEFAULT_DERIVED_FIELD_STYLE_TUNING
): CSSVariableProperties => {
  const normalizedColor = normalizeColor(color);
  const targetColor = getTuningColor(tuning.targetColor, DEFAULT_DERIVED_FIELD_STYLE_TUNING.targetColor);

  if (!normalizedColor) {
    return {
      "--derived-field-bg": selected ? tuning.fallbackSelectedBackground : tuning.fallbackBackground,
      "--derived-field-hover-bg": selected ? tuning.fallbackSelectedHoverBackground : tuning.fallbackHoverBackground,
      "--derived-field-focus-bg": selected ? tuning.fallbackSelectedHoverBackground : tuning.fallbackHoverBackground,
      "--derived-field-border": tuning.borderColor,
      "--derived-field-focus-ring": tuning.fallbackFocusRing,
    };
  }

  const backgroundMix = muted
    ? tuning.mutedFieldBackgroundMix
    : selected
      ? tuning.selectedFieldBackgroundMix
      : tuning.fieldBackgroundMix;
  const hoverMix = muted
    ? tuning.mutedFieldHoverBackgroundMix
    : selected
      ? tuning.selectedFieldHoverBackgroundMix
      : tuning.fieldHoverBackgroundMix;
  const fieldBackground = mixColor(normalizedColor, targetColor, backgroundMix);
  const hoverBackground = mixColor(normalizedColor, targetColor, hoverMix);

  return {
    "--derived-field-bg": fieldBackground,
    "--derived-field-hover-bg": hoverBackground,
    "--derived-field-focus-bg": hoverBackground,
    "--derived-field-border": tuning.borderColor,
    "--derived-field-focus-ring": mixColor(normalizedColor, targetColor, tuning.focusRingMix),
  };
};
