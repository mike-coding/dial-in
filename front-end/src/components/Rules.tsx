import React, { useState } from "react";
import { useCategories, useRules, useUser } from "../hooks/AppContext";
import { Rule as RuleType } from "../hooks/types";
import WindowsEmoji from "./WindowsEmoji";
import { ExistingRuleItem, NewRuleItem } from "./rules/RuleItem";
import {
  createDraftFromRule,
  createEmptyDraft,
  encodeSegment,
  getSegmentError,
  summarizeRatePattern,
} from "./rules/ruleUtils";
import { RuleDraft } from "./rules/types";

const Rules: React.FC = () => {
  const { userData } = useUser();
  const { categories } = useCategories();
  const { rules, addRule, updateRule, deleteRule, hasPendingWrites } = useRules();
  const [expandedId, setExpandedId] = useState<number | "new" | null>(null);
  const [newDraft, setNewDraft] = useState<RuleDraft>(createEmptyDraft());
  const [editDraft, setEditDraft] = useState<RuleDraft | null>(null);
  const [newError, setNewError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const validateDraft = (draft: RuleDraft): string | null => {
    if (!userData?.id) {
      return "You must be signed in to manage rules.";
    }

    if (!draft.name.trim()) {
      return "Rule name is required.";
    }

    if (draft.segments.length === 0) {
      return "At least one schedule segment is required.";
    }

    const invalidSegment = draft.segments.find((segment) => getSegmentError(segment));
    if (invalidSegment) {
      return getSegmentError(invalidSegment);
    }

    return null;
  };

  const buildRatePattern = (draft: RuleDraft) => draft.segments.map((segment) => encodeSegment(segment)).join("; ");

  const toggleNewRule = () => {
    setDeleteConfirmId(null);
    setEditDraft(null);
    setEditError(null);
    setNewError(null);
    setExpandedId((currentExpandedId) => (currentExpandedId === "new" ? null : "new"));
  };

  const toggleExistingRule = (rule: RuleType) => {
    setDeleteConfirmId(null);
    setNewError(null);

    if (expandedId === rule.id) {
      setExpandedId(null);
      setEditDraft(null);
      setEditError(null);
      return;
    }

    setExpandedId(rule.id);
    setEditDraft(createDraftFromRule(rule));
    setEditError(null);
  };

  const handleCreateRule = () => {
    const validationError = validateDraft(newDraft);
    if (validationError || !userData?.id) {
      setNewError(validationError);
      return;
    }

    addRule({
      name: newDraft.name.trim(),
      description: newDraft.description.trim() || undefined,
      category_id: newDraft.categoryId ? Number(newDraft.categoryId) : undefined,
      user_id: userData.id,
      rate_pattern: buildRatePattern(newDraft),
      is_active: newDraft.isActive,
    });

    setNewDraft(createEmptyDraft());
    setNewError(null);
    setExpandedId(null);
  };

  const handleSaveRule = (ruleId: number) => {
    if (!editDraft) {
      return;
    }

    const validationError = validateDraft(editDraft);
    if (validationError) {
      setEditError(validationError);
      return;
    }

    updateRule(ruleId, {
      name: editDraft.name.trim(),
      description: editDraft.description.trim() || undefined,
      category_id: editDraft.categoryId ? Number(editDraft.categoryId) : undefined,
      rate_pattern: buildRatePattern(editDraft),
      is_active: editDraft.isActive,
    });

    setEditError(null);
    setExpandedId(null);
    setEditDraft(null);
  };

  const resolveCategory = (ruleCategoryId?: number) => {
    if (!ruleCategoryId) {
      return null;
    }
    return categories.find((category) => category.id === ruleCategoryId) ?? null;
  };

  return (
    <div className="w-full max-w-2xl px-4 mx-auto pt-4">
      <div className="space-y-3">
        <NewRuleItem
          isExpanded={expandedId === "new"}
          onToggle={toggleNewRule}
          draft={newDraft}
          setDraft={setNewDraft}
          categories={categories}
          error={newError}
          onSubmit={handleCreateRule}
        />

        {rules.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4 opacity-50 flex justify-center">
              <WindowsEmoji emoji="⚙️" size={64} />
            </div>
            <p className="text-gray-500 text-lg">No rules yet</p>
          </div>
        ) : (
          rules.map((rule) => {
            const category = resolveCategory(rule.category_id);
            const scheduleSummary = summarizeRatePattern(rule.rate_pattern);
            const isExpanded = expandedId === rule.id;

            return (
              <ExistingRuleItem
                key={rule.id}
                rule={rule}
                category={category}
                scheduleSummary={scheduleSummary}
                isExpanded={isExpanded}
                editDraft={editDraft}
                categories={categories}
                editError={editError}
                showDeleteConfirm={deleteConfirmId === rule.id}
                onToggle={() => toggleExistingRule(rule)}
                setDraft={(value) => {
                  setEditDraft((currentDraft) => {
                    const baseDraft = currentDraft ?? createDraftFromRule(rule);
                    return typeof value === "function" ? value(baseDraft) : value;
                  });
                }}
                onSubmit={() => handleSaveRule(rule.id)}
                onDeleteRequest={() => setDeleteConfirmId(rule.id)}
                onDeleteCancel={() => setDeleteConfirmId(null)}
                onDeleteConfirm={(deleteChildren) => {
                  deleteRule(rule.id, { deleteChildren });
                  setDeleteConfirmId(null);
                  setExpandedId(null);
                  setEditDraft(null);
                }}
              />
            );
          })
        )}

        {hasPendingWrites && <div className="text-sm text-gray-500 px-2">Syncing...</div>}

        <div className="h-16"></div>
      </div>
    </div>
  );
};

export default Rules;
