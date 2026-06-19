import React, { useState, useEffect, useRef } from 'react';
import { Task as TaskType } from '../hooks/types';
import { useCategories } from '../hooks/useCategories';
import { useRules } from '../hooks/useRules';
import { getDerivedFieldStyle, resolveInheritedTaskColor, resolveRuleColor, resolveRuleIcon, resolveTaskColor } from '../utils/presentationResolver';
import { toDateOnlyValue, toTimeOnlyValue } from '../utils/taskSchedule';
import ColorPicker from './ColorPicker';
import WindowsEmoji from './WindowsEmoji';

interface TaskDetailsProps {
  task: TaskType;
  isExpanded: boolean;
  onSave: (updatedTask: Partial<TaskType>) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}

type PickerField = 'due-date' | 'due-time' | 'end-date' | 'end-time';

const CalendarFieldIcon = () => (
  <svg
    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3M5 11h14M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
  </svg>
);

const ClockFieldIcon = () => (
  <svg
    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TaskDetails: React.FC<TaskDetailsProps> = ({ task, isExpanded, onSave, onDelete, onClose }) => {
  const { categories } = useCategories();
  const { rules } = useRules();
  const inheritedTaskColor = resolveInheritedTaskColor(task, rules, categories);
  const taskColor = resolveTaskColor(task, rules, categories);
  const fieldStyle = getDerivedFieldStyle(taskColor, { muted: task.is_completed });
  const parentRule = task.rule_id ? rules.find((rule) => rule.id === task.rule_id) : undefined;
  const parentRuleCategory = parentRule?.category_id
    ? categories?.find((category) => category.id === parentRule.category_id)
    : undefined;
  const parentRuleStyle = getDerivedFieldStyle(
    parentRule ? resolveRuleColor(parentRule, categories) || taskColor : taskColor,
    { muted: task.is_completed }
  );
  const [description, setDescription] = useState(task.description || '');
  const [categoryId, setCategoryId] = useState<number | null>(task.category_id || null);
  const [dueDate, setDueDate] = useState(() => toDateOnlyValue(task.due_date));
  const [dueTime, setDueTime] = useState(() => toTimeOnlyValue(task.due_time));
  const [endDate, setEndDate] = useState(() => toDateOnlyValue(task.end_date));
  const [endTime, setEndTime] = useState(() => toTimeOnlyValue(task.end_time));
  const hasEndDate = endDate !== '';

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isDropdownAnimating, setIsDropdownAnimating] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const openPickerFieldRef = useRef<PickerField | null>(null);

  // Reset delete confirmation when task changes or when collapsed/expanded
  useEffect(() => {
    setShowDeleteConfirm(false);
    setIsCategoryDropdownOpen(false);
    setIsDropdownAnimating(false);
    setDescription(task.description || '');
    setCategoryId(task.category_id || null);
    setDueDate(toDateOnlyValue(task.due_date));
    setDueTime(toTimeOnlyValue(task.due_time));
    setEndDate(toDateOnlyValue(task.end_date));
    setEndTime(toTimeOnlyValue(task.end_time));
  }, [task.id, isExpanded]);

  // Handle dropdown closing with animation
  const closeDropdown = () => {
    setIsDropdownAnimating(true);
    setTimeout(() => {
      setIsCategoryDropdownOpen(false);
      setIsDropdownAnimating(false);
    }, 150); // Match animation duration
  };

  // Handle click outside for category dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCategoryDropdownOpen]);

  // Auto-save helper function
  const autoSave = (updates: Partial<TaskType>) => {
    onSave(updates);
  };

  // Auto-save description on blur
  const handleDescriptionBlur = () => {
    if (description !== (task.description || '')) {
      autoSave({ description: description || undefined });
    }
  };

  // Auto-save category on change
  const handleCategoryChange = (newCategoryId: number | null) => {
    setCategoryId(newCategoryId);
    closeDropdown();
    autoSave({ category_id: newCategoryId });
  };

  // Auto-save due date on change
  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDueDate(val);
    if (!val) {
      setDueTime('');
    }
    onSave({ due_date: val || (null as any), due_time: val ? dueTime || null : null });
  };

  const handleDueTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDueTime(val);
    onSave({ due_time: val || null });
  };

  // Auto-save end date on change
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEndDate(val);
    if (!val) {
      setEndTime('');
    }
    onSave({ end_date: val || (null as any), end_time: val ? endTime || null : null });
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEndTime(val);
    onSave({ end_time: val || null });
  };

  const handlePickerMouseDown = (field: PickerField, e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
    const isSameOpenField = document.activeElement === input && openPickerFieldRef.current === field;

    e.preventDefault();

    if (isSameOpenField) {
      openPickerFieldRef.current = null;
      input.blur();
      return;
    }

    openPickerFieldRef.current = field;
    input.focus({ preventScroll: true });

    try {
      input.showPicker?.();
    } catch {
      // Browsers can reject showPicker outside direct user activation.
    }
  };

  const handlePickerBlur = (field: PickerField) => {
    if (openPickerFieldRef.current === field) {
      openPickerFieldRef.current = null;
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(task.id);
    onClose();
  };

  const handleContainerClick = (e: any) => {
    // If delete confirmation is showing and user clicks outside the actual delete button, cancel
    if (showDeleteConfirm && !e.target.closest('.confirm-delete-button')) {
      setShowDeleteConfirm(false);
    }
    // Close category dropdown if clicking outside of it
    if (isCategoryDropdownOpen && !categoryDropdownRef.current?.contains(e.target)) {
      closeDropdown();
    }
  };

  return (
    <div className="p-4" onClick={handleContainerClick}>
      <div className="space-y-4">
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            rows={3}
            className="derived-field w-full px-3 py-2 rounded-md focus:outline-none focus:border-gray-400 resize-none"
            style={fieldStyle}
            placeholder="Add a description..."
          />
        </div>

        {task.rule_id && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rule
            </label>
            <div
              className="derived-field w-full px-3 py-2 rounded-md flex items-center justify-between gap-3"
              style={parentRuleStyle}
            >
              <div className="flex min-w-0 items-center gap-2">
                <WindowsEmoji
                  emoji={parentRule ? resolveRuleIcon(parentRule, categories) : '⚙️'}
                  size={18}
                />
                <span className="truncate text-gray-900">
                  {parentRule?.name || 'Rule unavailable'}
                </span>
              </div>
              {parentRuleCategory && (
                <div className="flex min-w-0 shrink-0 items-center gap-1 text-sm text-gray-600">
                  <WindowsEmoji emoji={parentRuleCategory.icon || '📁'} size={14} />
                  <span className="max-w-36 truncate">{parentRuleCategory.name}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-[2.5rem_minmax(0,1fr)]">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <ColorPicker
              value={task.color}
              fallbackColor={inheritedTaskColor}
              onChange={(color) => onSave({ color })}
              showClear
              fieldSize
              buttonClassName="derived-field flex h-10 w-10 items-center justify-center rounded-md transition-colors cursor-pointer"
              buttonStyle={fieldStyle}
              ariaLabel="Select task color"
            />
          </div>

          {/* Category */}
          <div className="relative" ref={categoryDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <button
              type="button"
              onClick={() => {
                if (isCategoryDropdownOpen) {
                  closeDropdown();
                } else {
                  setIsCategoryDropdownOpen(true);
                }
              }}
              className="derived-field w-full px-3 py-2 mb-1 rounded-md text-left flex items-center justify-between transition-colors"
              style={fieldStyle}
            >
              <div className="flex min-w-0 items-center gap-2">
                {categoryId ? (
                  <>
                    <WindowsEmoji 
                      emoji={categories?.find(cat => cat.id === categoryId)?.icon || '📁'} 
                      size={18} 
                    />
                    <span className="truncate text-gray-900">
                      {categories?.find(cat => cat.id === categoryId)?.name || 'No category'}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500">No category</span>
                )}
              </div>
              <svg
                className={`w-5 h-5 shrink-0 text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {(isCategoryDropdownOpen || isDropdownAnimating) && (
              <div className={`absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden ${
                isDropdownAnimating 
                  ? 'animate-[dropdown-out_0.15s_ease-in_forwards]' 
                  : 'animate-[dropdown-in_0.15s_ease-out_forwards]'
              }`}>
                <div
                  onClick={() => handleCategoryChange(null)}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors flex items-center gap-2 ${
                    !categoryId ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                  }`}
                >
                  <WindowsEmoji emoji="📋" size={18} />
                  <span>No category</span>
                </div>
                {categories?.map((category) => (
                  <div
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors flex items-center gap-2 ${
                      categoryId === category.id ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                    }`}
                  >
                    <WindowsEmoji emoji={category.icon || '📁'} size={18} />
                    <span>{category.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {hasEndDate ? 'Start date' : 'Due date'}
            </label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={handleDueDateChange}
                onMouseDown={(e) => handlePickerMouseDown('due-date', e)}
                onBlur={() => handlePickerBlur('due-date')}
                className={`derived-field date-time-picker-input w-full py-2 pr-3 pl-10 rounded-md focus:outline-none focus:border-gray-400 transition-colors ${!dueDate ? 'empty-datetime-input' : ''}`}
                style={fieldStyle}
              />
              <CalendarFieldIcon />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {hasEndDate ? 'Start time' : 'Due time'}
            </label>
            <div className="relative">
              <input
                type="time"
                value={dueTime}
                onChange={handleDueTimeChange}
                onMouseDown={(e) => handlePickerMouseDown('due-time', e)}
                onBlur={() => handlePickerBlur('due-time')}
                disabled={!dueDate}
                className={`derived-field date-time-picker-input w-full py-2 pr-3 pl-10 rounded-md focus:outline-none focus:border-gray-400 transition-colors disabled:opacity-50 ${!dueTime ? 'empty-datetime-input' : ''}`}
                style={fieldStyle}
              />
              <ClockFieldIcon />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End date
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                onMouseDown={(e) => handlePickerMouseDown('end-date', e)}
                onBlur={() => handlePickerBlur('end-date')}
                className={`derived-field date-time-picker-input w-full py-2 pr-3 pl-10 rounded-md focus:outline-none focus:border-gray-400 transition-colors ${!endDate ? 'empty-datetime-input' : ''}`}
                style={fieldStyle}
              />
              <CalendarFieldIcon />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End time
            </label>
            <div className="relative">
              <input
                type="time"
                value={endTime}
                onChange={handleEndTimeChange}
                onMouseDown={(e) => handlePickerMouseDown('end-time', e)}
                onBlur={() => handlePickerBlur('end-time')}
                disabled={!endDate}
                className={`derived-field date-time-picker-input w-full py-2 pr-3 pl-10 rounded-md focus:outline-none focus:border-gray-400 transition-colors disabled:opacity-50 ${!endTime ? 'empty-datetime-input' : ''}`}
                style={fieldStyle}
              />
              <ClockFieldIcon />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between delete-action-area">
          {!showDeleteConfirm ? (
            <button
              onClick={handleDelete}
              className="px-4 py-2 border-1 border-red/40 text-sm font-medium text-red-600/60 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              Delete
            </button>
          ) : (
            <div className="flex items-center justify-between space-x-3 px-1 w-full">
              <span className="text-sm font-medium text-gray-700">Delete this task?</span>
              <button
                onClick={confirmDelete}
                className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors confirm-delete-button"
              >
                Yes, Really Delete It
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
