import { Category, Rule, Task } from "../hooks/types";
import type { CSSProperties } from "react";

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

export const getTintedColorStyle = (color?: string, alpha = "18"): CSSProperties =>
  color ? { backgroundColor: `${color}${alpha}`, borderColor: `${color}66` } : {};
