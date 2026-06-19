import React, { useState, useRef, useEffect } from 'react';
import { Category as CategoryType } from '../hooks/types';
import EmojiIconPicker from './EmojiIconPicker';
import ColorPicker from './ColorPicker';

interface CategoryProps {
  category: CategoryType;
  onDelete: (id: number, cascadeTasks: boolean) => void;
  onUpdate: (id: number, updates: Partial<CategoryType>) => void;
  children?: React.ReactNode;
  onExpandChange?: (isExpanded: boolean) => void;
  headerMeta?: React.ReactNode;
  counts?: { rules: number; pending: number; completed: number };
}

const Category: React.FC<CategoryProps> = ({ category, onDelete, onUpdate, children, onExpandChange, headerMeta, counts }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [name, setName] = useState(category.name);
  const [hasUnsavedName, setHasUnsavedName] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'hidden' | 'confirm' | 'choose'>('hidden');
  const categoryRef = useRef<HTMLDivElement>(null);

  // Update local name when category prop changes
  React.useEffect(() => {
    setName(category.name);
    setHasUnsavedName(false);
  }, [category.name]);

  // Reset delete confirmation when category changes or when collapsed/expanded
  useEffect(() => {
    setDeleteStep('hidden');
  }, [category.id, isExpanded]);

  // Handle click outside to collapse category
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        handleCollapseWithAutoSave();
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, hasUnsavedName, name, category.name]);

  const handleCategoryClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on actionable elements
    if ((e.target as HTMLElement).closest('[data-action]')) {
      return;
    }
    
    // If delete confirmation is showing and user clicks outside the actual delete button, cancel
    if (deleteStep !== 'hidden' && !(e.target as HTMLElement).closest('.confirm-delete-button')) {
      setDeleteStep('hidden');
    }
    
    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);
    onExpandChange?.(nextExpanded);
  };

  const handleUpdate = (updates: Partial<CategoryType>) => {
    onUpdate(category.id, updates);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setHasUnsavedName(e.target.value !== category.name);
  };

  const handleNameBlur = () => {
    if (hasUnsavedName && name.trim() && name !== category.name) {
      handleUpdate({ name: name.trim() });
    } else if (!name.trim()) {
      // Revert to original name if empty
      setName(category.name);
      setHasUnsavedName(false);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setName(category.name);
      setHasUnsavedName(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleCollapseWithAutoSave = () => {
    // Auto-save any pending name changes before collapsing
    if (hasUnsavedName && name.trim() && name !== category.name) {
      handleUpdate({ name: name.trim() });
    }
    setIsExpanded(false);
    onExpandChange?.(false);
  };

  const handleDelete = () => {
    const hasContent = counts && (counts.rules > 0 || counts.pending > 0 || counts.completed > 0);
    if (hasContent) {
      setDeleteStep('confirm');
    } else {
      // No rules or tasks — delete immediately
      onDelete(category.id, false);
    }
  };

  const confirmDelete = (cascadeTasks: boolean) => {
    onDelete(category.id, cascadeTasks);
  };

  return (
    <div 
      ref={categoryRef}
      className="rounded-md border-l-4 bg-white transition-all duration-200"
      style={{ borderLeftColor: category.color || 'transparent' }}
    >
      <div 
        className="px-4 py-3 cursor-pointer"
        onClick={handleCategoryClick}
      >
        <div className="flex items-center gap-4">
          {/* Category Icon */}
          <div className="flex-shrink-0">
            <EmojiIconPicker
              value={category.icon}
              fallbackIcon="📂"
              onChange={(icon) => {
                if (icon) {
                  handleUpdate({ icon });
                }
              }}
              disabled={!isExpanded}
              ariaLabel="Select project icon"
            />
          </div>

          {/* Category Content */}
          <div className="flex-1 min-w-0">
            {isExpanded ? (
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                onKeyDown={handleNameKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-lg bg-gray-400/10 rounded-md outline-none transition-all duration-200 focus:bg-gray-400/20 px-2 py-1 text-gray-700"
                placeholder="Enter project name..."
                autoFocus={false}
              />
            ) : (
              <p className="text-lg transition-all duration-200 px-2 py-1 truncate text-gray-700">
                {category.name}
              </p>
            )}
            {headerMeta ? (
              <div className="px-2 mt-1 text-xs text-gray-500 truncate">{headerMeta}</div>
            ) : null}
          </div>
          
          {/* Expand/Collapse Controls */}
          <div className="flex items-center gap-2">
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (isExpanded) {
                  handleCollapseWithAutoSave();
                } else {
                  setIsExpanded(true);
                  onExpandChange?.(true);
                }
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors group"
              aria-label={isExpanded ? "Collapse category details" : "Expand category details"}
            >
              <svg 
                className={`w-5 h-5 text-gray-500 group-hover:text-gray-400 transition-all duration-200 ${
                  isExpanded ? '' : 'transform -rotate-90'
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="px-4 pb-4">
          <div className="pt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <ColorPicker
                value={category.color}
                onChange={(color) => handleUpdate({ color })}
                showClear
                ariaLabel="Select project color"
              />
            </div>

            {children}

            {/* Delete Button */}
            <div className="pt-2">
              <div className="flex items-center justify-between delete-action-area">
                {deleteStep === 'hidden' ? (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 border-1 border-red/40 text-sm font-medium text-red-600/60 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  >
                    Delete
                  </button>
                ) : deleteStep === 'confirm' ? (
                  <div className="w-full space-y-2 confirm-delete-button">
                    <p className="text-sm text-gray-700">
                      This will delete{' '}
                      {counts && counts.rules > 0 && (
                        <span className="font-medium">{counts.rules} {counts.rules === 1 ? 'rule' : 'rules'}</span>
                      )}
                      {counts && counts.rules > 0 && (counts.pending + counts.completed) > 0 && ' and '}
                      {counts && (counts.pending + counts.completed) > 0 && (
                        <span className="font-medium">{counts.pending + counts.completed} {(counts.pending + counts.completed) === 1 ? 'task' : 'tasks'}</span>
                      )}
                      .
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => confirmDelete(true)}
                        className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors confirm-delete-button"
                      >
                        Delete everything
                      </button>
                      {counts && (counts.pending + counts.completed) > 0 && (
                        <button
                          onClick={() => confirmDelete(false)}
                          className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors confirm-delete-button"
                        >
                          Keep tasks
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Category;
