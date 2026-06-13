import React, { useState, useRef, useEffect } from "react";
import { useCategories, useRules, useTasks, useUser } from "../hooks/AppContext";
import WindowsEmoji from "./WindowsEmoji";
import Category from "./Category";
import { sharedEmojiOptions } from "../utils/sharedEmojiOptions";
import RuleEditor from "./rules/RuleEditor";
import { ExistingRuleItem } from "./rules/RuleItem";
import { RuleDraft } from "./rules/types";
import {
  createDraftFromRule,
  createEmptySegment,
  encodeSegment,
  getSegmentError,
} from "./rules/ruleUtils";
import { Rule as RuleType } from "../hooks/types";

type ScheduleUpdateMode = "future_replace_preserve_completed" | "all_replace" | "additive_future";

interface SchedulePreviewSummary {
  delete_count: number;
  create_count: number;
  net_change: number;
}

interface SchedulePromptState {
  ruleId: number;
  projectId: number;
  updates: Partial<RuleType>;
  preview: {
    existing_child_tasks: number;
    previews: Record<string, SchedulePreviewSummary>;
  };
  selectedMode: ScheduleUpdateMode;
}

const Categories: React.FC = () => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📂');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { categories, addCategory, deleteCategory, updateCategory } = useCategories();
  const { userData } = useUser();
  const { rules, addRule, updateRule, deleteRule, previewScheduleUpdate } = useRules();
  const { tasks } = useTasks();
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [projectRuleDrafts, setProjectRuleDrafts] = useState<Record<number, RuleDraft>>({});
  const [projectRuleErrors, setProjectRuleErrors] = useState<Record<number, string | null>>({});
  const [openProjectRuleEditors, setOpenProjectRuleEditors] = useState<Record<number, boolean>>({});
  const [expandedRuleId, setExpandedRuleId] = useState<number | null>(null);
  const [editRuleDraft, setEditRuleDraft] = useState<RuleDraft | null>(null);
  const [editRuleError, setEditRuleError] = useState<string | null>(null);
  const [deleteConfirmRuleId, setDeleteConfirmRuleId] = useState<number | null>(null);
  const [schedulePrompt, setSchedulePrompt] = useState<SchedulePromptState | null>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const emojiOptions = sharedEmojiOptions;

  const projectCounts = React.useMemo(() => {
    const counts: Record<number, { rules: number; pending: number; completed: number }> = {};

    categories.forEach((category) => {
      counts[category.id] = { rules: 0, pending: 0, completed: 0 };
    });

    rules.forEach((rule) => {
      if (rule.category_id && counts[rule.category_id]) {
        counts[rule.category_id].rules += 1;
      }
    });

    tasks.forEach((task) => {
      if (task.category_id && counts[task.category_id]) {
        if (task.is_completed) {
          counts[task.category_id].completed += 1;
        } else {
          counts[task.category_id].pending += 1;
        }
      }
    });

    return counts;
  }, [categories, rules, tasks]);

  const handleAddCategory = () => {
    if (newCategoryName.trim() === '') return;
    
    addCategory({
      name: newCategoryName.trim(),
      icon: selectedEmoji,
    });
    
    setNewCategoryName('');
    setSelectedEmoji('📂');
    setShowEmojiPicker(false);
  };

  const handleDeleteCategory = (id: number, cascadeTasks: boolean) => {
    deleteCategory(id, cascadeTasks);
  };

  const validateRuleDraft = (draft: RuleDraft): string | null => {
    if (!userData?.id) {
      return "You must be signed in.";
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

  const getProjectRuleDraft = (projectId: number): RuleDraft => {
    return (
      projectRuleDrafts[projectId] || {
        name: '',
        description: '',
        categoryId: String(projectId),
        isActive: true,
        segments: [createEmptySegment()],
      }
    );
  };

  const setProjectRuleDraft = (projectId: number, draftUpdater: React.SetStateAction<RuleDraft>) => {
    setProjectRuleDrafts((currentDrafts) => {
      const currentDraft = currentDrafts[projectId] || getProjectRuleDraft(projectId);
      const nextDraft = typeof draftUpdater === 'function' ? draftUpdater(currentDraft) : draftUpdater;
      return {
        ...currentDrafts,
        [projectId]: {
          ...nextDraft,
          categoryId: String(projectId),
        },
      };
    });
  };

  const toggleProjectRuleEditor = (projectId: number) => {
    setOpenProjectRuleEditors((current) => ({
      ...current,
      [projectId]: !current[projectId],
    }));
    setProjectRuleErrors((current) => ({ ...current, [projectId]: null }));

    if (!openProjectRuleEditors[projectId]) {
      setDeleteConfirmRuleId(null);
      setExpandedRuleId(null);
      setEditRuleDraft(null);
      setEditRuleError(null);
      setSchedulePrompt(null);
    }
  };

  const closeAllProjectRuleEditors = () => {
    const openProjectIds = Object.entries(openProjectRuleEditors)
      .filter(([, isOpen]) => isOpen)
      .map(([projectId]) => Number(projectId));

    if (openProjectIds.length === 0) {
      return;
    }

    setProjectRuleDrafts((current) => {
      const nextDrafts = { ...current };
      openProjectIds.forEach((projectId) => {
        nextDrafts[projectId] = {
          name: '',
          description: '',
          categoryId: String(projectId),
          isActive: true,
          segments: [createEmptySegment()],
        };
      });
      return nextDrafts;
    });

    setProjectRuleErrors((current) => {
      const nextErrors = { ...current };
      openProjectIds.forEach((projectId) => {
        nextErrors[projectId] = null;
      });
      return nextErrors;
    });

    setOpenProjectRuleEditors((current) => {
      const nextOpenState = { ...current };
      openProjectIds.forEach((projectId) => {
        nextOpenState[projectId] = false;
      });
      return nextOpenState;
    });
  };

  const handleProjectExpandChange = (projectId: number, isExpanded: boolean) => {
    if (isExpanded) {
      return;
    }

    const projectRuleIds = new Set(
      rules
        .filter((rule) => rule.category_id === projectId)
        .map((rule) => rule.id)
    );

    setOpenProjectRuleEditors((current) => ({
      ...current,
      [projectId]: false,
    }));

    setProjectRuleErrors((current) => ({
      ...current,
      [projectId]: null,
    }));

    setDeleteConfirmRuleId((current) => (current !== null && projectRuleIds.has(current) ? null : current));

    setSchedulePrompt((current) => (current && current.projectId === projectId ? null : current));

    setExpandedRuleId((current) => (current !== null && projectRuleIds.has(current) ? null : current));

    setEditRuleDraft((currentDraft) => {
      if (!currentDraft || !expandedRuleId || !projectRuleIds.has(expandedRuleId)) {
        return currentDraft;
      }
      return null;
    });

    setEditRuleError(null);
  };

  useEffect(() => {
    const hasOpenEditor = Object.values(openProjectRuleEditors).some(Boolean);
    if (!hasOpenEditor) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const targetElement = event.target as HTMLElement | null;
      if (targetElement?.closest('[data-project-rule-create]')) {
        return;
      }
      closeAllProjectRuleEditors();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [openProjectRuleEditors]);

  const handleCreateProjectRule = (projectId: number) => {
    const draft = getProjectRuleDraft(projectId);
    const validationError = validateRuleDraft(draft);
    if (validationError || !userData?.id) {
      setProjectRuleErrors((current) => ({ ...current, [projectId]: validationError }));
      return;
    }

    const ratePattern = draft.segments.map((segment) => encodeSegment(segment)).join('; ');
    addRule({
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      category_id: projectId,
      user_id: userData.id,
      rate_pattern: ratePattern,
      is_active: draft.isActive,
    });

    setProjectRuleDrafts((current) => ({
      ...current,
      [projectId]: {
        name: '',
        description: '',
        categoryId: String(projectId),
        isActive: true,
        segments: [createEmptySegment()],
      },
    }));
    setProjectRuleErrors((current) => ({ ...current, [projectId]: null }));
    setOpenProjectRuleEditors((current) => ({ ...current, [projectId]: false }));
  };

  const toggleProjectExistingRule = (rule: RuleType) => {
    setDeleteConfirmRuleId(null);
    setEditRuleError(null);
    setSchedulePrompt(null);

    if (expandedRuleId === rule.id) {
      setExpandedRuleId(null);
      setEditRuleDraft(null);
      return;
    }

    setExpandedRuleId(rule.id);
    setEditRuleDraft(createDraftFromRule(rule));
  };

  const handleSaveProjectExistingRule = async (rule: RuleType, projectId: number) => {
    if (!editRuleDraft) {
      return;
    }

    const validationError = validateRuleDraft(editRuleDraft);
    if (validationError) {
      setEditRuleError(validationError);
      return;
    }

    const updates: Partial<RuleType> = {
      name: editRuleDraft.name.trim(),
      description: editRuleDraft.description.trim() || undefined,
      category_id: Number(editRuleDraft.categoryId),
      rate_pattern: editRuleDraft.segments.map((segment) => encodeSegment(segment)).join('; '),
      is_active: editRuleDraft.isActive,
    };

    const scheduleChanged = updates.rate_pattern !== rule.rate_pattern;
    if (scheduleChanged) {
      try {
        const preview = await previewScheduleUpdate(rule.id, updates.rate_pattern || "");
        if (preview?.schedule_changed && preview.has_child_tasks) {
          setSchedulePrompt({
            ruleId: rule.id,
            projectId,
            updates,
            preview: {
              existing_child_tasks: preview.existing_child_tasks,
              previews: preview.previews || {},
            },
            selectedMode: "future_replace_preserve_completed",
          });
          return;
        }
      } catch (error) {
        setEditRuleError(error instanceof Error ? error.message : "Failed to preview schedule changes.");
        return;
      }
    }

    updateRule(rule.id, updates, scheduleChanged ? { scheduleUpdateMode: "future_replace_preserve_completed" } : undefined);
    setEditRuleError(null);
    setExpandedRuleId(null);
    setEditRuleDraft(null);
  };

  const applySchedulePrompt = () => {
    if (!schedulePrompt) {
      return;
    }

    updateRule(schedulePrompt.ruleId, schedulePrompt.updates, {
      scheduleUpdateMode: schedulePrompt.selectedMode,
    });

    setSchedulePrompt(null);
    setEditRuleError(null);
    setExpandedRuleId(null);
    setEditRuleDraft(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCategory();
    }
  };

  return (
    <div className="">
      <div className="w-full max-w-full px-4 mx-auto pt-4">
        
        {/* Add Category Input */}
        <div className="mb-6 relative" ref={emojiPickerRef}>
          <div className="bg-white rounded-md px-4 py-3">
            <div className="flex items-center gap-3">
              <div 
                onClick={handleAddCategory}
                className="w-10 h-10 flex items-center justify-center cursor-pointer transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              
              {/* Emoji Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <WindowsEmoji emoji={selectedEmoji} size={24} />
                </button>
              </div>
              
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a new project..."
                className="flex-1 text-gray-700 placeholder-gray-400 bg-transparent border-none outline-none text-lg"
              />
            </div>
          </div>
          
          {/* Emoji Picker Dropdown - positioned relative to container */}
          {showEmojiPicker && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 max-h-60 overflow-y-auto">
              <div className="grid grid-cols-10 gap-2">
                {emojiOptions.map((emoji, index) => (
                  <button
                    key={`${emoji}-${index}`}
                    onClick={() => {
                      setSelectedEmoji(emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center hover:bg-blue-100 rounded transition-colors flex-shrink-0"
                    title={emoji}
                  >
                    <WindowsEmoji emoji={emoji} size={20} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Categories List */}
        <div className="space-y-3">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4 opacity-50 flex justify-center">
                <WindowsEmoji emoji="🏷️" size={72} />
              </div>
              <p className="text-gray-500 text-lg">No projects yet</p>
              <p className="text-gray-400 text-sm mt-1">Add a project above to get started!</p>
            </div>
          ) : (
            categories.map((category) => (
              <Category
                key={category.id}
                category={category}
                onDelete={handleDeleteCategory}
                onUpdate={updateCategory}
                onExpandChange={(isExpanded) => handleProjectExpandChange(category.id, isExpanded)}
                counts={projectCounts[category.id]}
                headerMeta={
                  <span>
                    {projectCounts[category.id]?.rules || 0} {(projectCounts[category.id]?.rules || 0) === 1 ? 'rule' : 'rules'} · {projectCounts[category.id]?.pending || 0} open · {projectCounts[category.id]?.completed || 0} done
                  </span>
                }
              >
                <div className="pt-2 border-t border-white/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Rules</span>
                  </div>

                  {(rules.filter((rule) => rule.category_id === category.id)).length === 0 ? (
                    <p className="text-sm text-gray-500">No rules yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {rules
                        .filter((rule) => rule.category_id === category.id)
                        .map((rule) => (
                          <ExistingRuleItem
                            key={rule.id}
                            rule={rule}
                            category={category}
                            hideCategoryIcon
                            isExpanded={expandedRuleId === rule.id}
                            editDraft={editRuleDraft}
                            categories={categories}
                            editError={editRuleError}
                            showDeleteConfirm={deleteConfirmRuleId === rule.id}
                            bodyOverride={
                              schedulePrompt && schedulePrompt.ruleId === rule.id ? (
                                <div className="px-4 pb-4 pt-4 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-gray-700">Schedule change</h3>
                                    <span className="text-xs text-gray-500">{schedulePrompt.preview.existing_child_tasks} tasks</span>
                                  </div>

                                  <div className="space-y-2">
                                    {([
                                      ["future_replace_preserve_completed", "Recompute future, preserve completed"],
                                      ["all_replace", "Recompute all child tasks"],
                                      ["additive_future", "Generate future only (additive)"],
                                    ] as Array<[ScheduleUpdateMode, string]>).map(([mode, label]) => {
                                      const summary = schedulePrompt.preview.previews[mode] || {
                                        delete_count: 0,
                                        create_count: 0,
                                        net_change: 0,
                                      };
                                      const selected = schedulePrompt.selectedMode === mode;

                                      return (
                                        <button
                                          key={mode}
                                          type="button"
                                          onClick={() =>
                                            setSchedulePrompt((current) =>
                                              current
                                                ? {
                                                    ...current,
                                                    selectedMode: mode,
                                                  }
                                                : current
                                            )
                                          }
                                          className={`w-full rounded-md px-3 py-2 text-left transition-colors ${
                                            selected ? "bg-gray-400/30" : "bg-gray-400/10 hover:bg-gray-400/20"
                                          }`}
                                        >
                                          <div className="text-sm font-medium text-gray-800">{label}</div>
                                          <div className="text-xs mt-1">
                                            <span className="text-red-600">-{summary.delete_count}</span>
                                            <span className="text-gray-500">, </span>
                                            <span className="text-green-600">+{summary.create_count}</span>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setSchedulePrompt(null)}
                                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={applySchedulePrompt}
                                      className="px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
                                    >
                                      Apply
                                    </button>
                                  </div>
                                </div>
                              ) : undefined
                            }
                            onToggle={() => toggleProjectExistingRule(rule)}
                            onToggleActive={() => {
                              const nextIsActive = !rule.is_active;
                              updateRule(rule.id, { is_active: nextIsActive });
                              if (expandedRuleId === rule.id) {
                                setEditRuleDraft((currentDraft) =>
                                  currentDraft ? { ...currentDraft, isActive: nextIsActive } : currentDraft
                                );
                              }
                            }}
                            setDraft={(value) => {
                              setEditRuleDraft((currentDraft) => {
                                const baseDraft = currentDraft ?? createDraftFromRule(rule);
                                return typeof value === "function" ? value(baseDraft) : value;
                              });
                            }}
                            onSubmit={() => handleSaveProjectExistingRule(rule, category.id)}
                            onDeleteRequest={() => setDeleteConfirmRuleId(rule.id)}
                            onDeleteCancel={() => setDeleteConfirmRuleId(null)}
                            onDeleteConfirm={(deleteChildren) => {
                              deleteRule(rule.id, { deleteChildren });
                              setDeleteConfirmRuleId(null);
                              setExpandedRuleId(null);
                              setEditRuleDraft(null);
                            }}
                          />
                        ))}
                    </div>
                  )}

                  <div className="bg-gray-400/10 rounded-md px-4 py-2" data-project-rule-create>
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => handleCreateProjectRule(category.id)}
                        className="w-10 h-10 flex items-center justify-center cursor-pointer transition-colors hover:scale-105 transition-all duration-200"
                        aria-label="Create rule"
                      >
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="square" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={getProjectRuleDraft(category.id).name}
                        onFocus={() => {
                          if (!openProjectRuleEditors[category.id]) {
                            toggleProjectRuleEditor(category.id);
                          }
                        }}
                        onChange={(event) =>
                          setProjectRuleDraft(category.id, (currentDraft) => ({
                            ...currentDraft,
                            name: event.target.value,
                          }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleCreateProjectRule(category.id);
                          }
                        }}
                        placeholder="Add a new rule..."
                        className="flex-1 text-gray-700 placeholder-gray-400 bg-transparent border-none outline-none text-lg"
                      />
                    </div>
                  </div>

                  {openProjectRuleEditors[category.id] && (
                    <div className="bg-gray-400/10 rounded-md" data-project-rule-create>
                      <RuleEditor
                        draft={getProjectRuleDraft(category.id)}
                        setDraft={(value) => setProjectRuleDraft(category.id, value)}
                        categories={categories}
                        error={projectRuleErrors[category.id] || null}
                        submitLabel="Create"
                        onSubmit={() => handleCreateProjectRule(category.id)}
                        lockCategoryId={String(category.id)}
                        hideCategorySelector
                        showSubmitButton={false}
                      />

                      <div className="px-4 pb-4 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleCreateProjectRule(category.id)}
                          className="px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Category>
            ))
          )}
        </div>

        {/* Bottom spacing for mobile navigation */}
        <div className="h-16"></div>
      </div>
    </div>
  );
};

export default Categories;
