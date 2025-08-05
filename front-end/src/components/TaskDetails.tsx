import React, { useState, useEffect, useRef } from 'react';
import { Task as TaskType } from '../hooks/types';
import { useCategories } from '../hooks/useCategories';
import WindowsEmoji from './WindowsEmoji';

interface TaskDetailsProps {
  task: TaskType;
  isExpanded: boolean;
  onSave: (updatedTask: Partial<TaskType>) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ task, isExpanded, onSave, onDelete, onClose }) => {
  const { categories } = useCategories();
  const [description, setDescription] = useState(task.description || '');
  const [categoryId, setCategoryId] = useState<number | null>(task.category_id || null);
  const [dueDate, setDueDate] = useState(() => {
    if (!task.due_date) return '';
    // Convert ISO string to YYYY-MM-DD for date input
    return task.due_date.split('T')[0];
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isDropdownAnimating, setIsDropdownAnimating] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Reset delete confirmation when task changes or when collapsed/expanded
  useEffect(() => {
    setShowDeleteConfirm(false);
    setIsCategoryDropdownOpen(false);
    setIsDropdownAnimating(false);
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
  const handleDueDateChange = (e: any) => {
    const newDueDate = e.target.value;
    setDueDate(newDueDate);
    autoSave({ due_date: newDueDate ? new Date(newDueDate + 'T00:00:00').toISOString() : undefined });
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
            className="w-full px-3 py-2 bg-gray-400/10 rounded-md focus:outline-none focus:border-gray-400 resize-none"
            placeholder="Add a description..."
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
            className="w-full px-3 py-2 mb-1 bg-gray-400/10 rounded-md text-left flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              {categoryId ? (
                <>
                  <WindowsEmoji 
                    emoji={categories?.find(cat => cat.id === categoryId)?.icon || '📁'} 
                    size={18} 
                  />
                  <span className="text-gray-900">
                    {categories?.find(cat => cat.id === categoryId)?.name || 'No category'}
                  </span>
                </>
              ) : (
                <span className="text-gray-500">No category</span>
              )}
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}
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

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={handleDueDateChange}
            className="w-full px-3 py-2 bg-gray-400/10 rounded-md focus:outline-none focus:border-gray-400 transition-colors"
          />
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
