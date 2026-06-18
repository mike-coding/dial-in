import { Category, Rule, Task } from "../hooks/types";

const normalizeIcon = (value?: string | null) => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || undefined;
};

const findCategoryIcon = (categories: Category[], categoryId?: number | null) =>
  normalizeIcon(categories.find((category) => category.id === categoryId)?.icon);

export const resolveRuleIcon = (
  rule: Rule,
  categories: Category[],
  fallbackIcon = "⚙️"
) => normalizeIcon(rule.icon) || findCategoryIcon(categories, rule.category_id) || fallbackIcon;

export const resolveTaskIcon = (
  task: Task,
  rules: Rule[],
  categories: Category[],
  fallbackIcon = "📝"
) => {
  const parentRule = task.rule_id ? rules.find((rule) => rule.id === task.rule_id) : undefined;

  return (
    normalizeIcon(task.icon) ||
    normalizeIcon(parentRule?.icon) ||
    findCategoryIcon(categories, task.category_id) ||
    findCategoryIcon(categories, parentRule?.category_id) ||
    fallbackIcon
  );
};

export const resolveInheritedTaskIcon = (
  task: Task,
  rules: Rule[],
  categories: Category[],
  fallbackIcon = "📝"
) => {
  const parentRule = task.rule_id ? rules.find((rule) => rule.id === task.rule_id) : undefined;

  return (
    normalizeIcon(parentRule?.icon) ||
    findCategoryIcon(categories, task.category_id) ||
    findCategoryIcon(categories, parentRule?.category_id) ||
    fallbackIcon
  );
};
