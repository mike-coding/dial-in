import React, { useState, useRef, useEffect } from 'react';
import { Task as TaskType } from '../hooks/types';
import TaskDetails from './TaskDetails';

interface TaskProps {
  task: TaskType;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, updates: Partial<TaskType>) => void;
}

const Task: React.FC<TaskProps> = ({ task, onToggle, onDelete, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [hasUnsavedTitle, setHasUnsavedTitle] = useState(false);
  const taskRef = useRef<HTMLDivElement>(null);

  // Update local title when task prop changes
  React.useEffect(() => {
    setTitle(task.title);
    setHasUnsavedTitle(false);
  }, [task.title]);

  // Handle click outside to collapse task
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && taskRef.current && !taskRef.current.contains(event.target as Node)) {
        handleCollapseWithAutoSave();
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, hasUnsavedTitle, title, task.title]);

  const handleTaskClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on checkbox or delete button
    if ((e.target as HTMLElement).closest('[data-action]')) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  const handleUpdate = (updates: Partial<TaskType>) => {
    onUpdate(task.id, updates);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setHasUnsavedTitle(e.target.value !== task.title);
  };

  const handleTitleBlur = () => {
    if (hasUnsavedTitle && title.trim() && title !== task.title) {
      handleUpdate({ title: title.trim() });
    } else if (!title.trim()) {
      // Revert to original title if empty
      setTitle(task.title);
      setHasUnsavedTitle(false);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setTitle(task.title);
      setHasUnsavedTitle(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleCollapseWithAutoSave = () => {
    // Auto-save any pending title changes before collapsing
    if (hasUnsavedTitle && title.trim() && title !== task.title) {
      handleUpdate({ title: title.trim() });
    }
    setIsExpanded(false);
  };

  return (
    <div 
      ref={taskRef}
      className={`rounded-sm shadow-sm hover:shadow-md transition-all duration-200 ${
        task.is_completed ? 'bg-white/50' : 'bg-white/90'
      }`}
    >
      <div 
        className="p-4 cursor-pointer"
        onClick={handleTaskClick}
      >
        <div className="flex items-center gap-4">
          {/* Checkbox */}
          <div
            data-action="toggle"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(task.id);
            }}
            className={`w-6 h-6 rounded-md border-t-1 border-l-1 flex items-center justify-center transition-all duration-200 cursor-pointer ${
              task.is_completed
                ? 'bg-gray-400/10 border-gray-500/50 text-white scale-110'
                : 'bg-gray-300/10 border-gray-400/50 hover:border-green-400 hover:scale-105'
            }`}
          >
            {task.is_completed && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M5 12l5 5L20 7" />
              </svg>
            )}
          </div>
          
          {/* Task Content */}
          <div className="flex-1 min-w-0">
            {isExpanded ? (
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className={`w-full text-lg bg-transparent border-b border-gray-300 outline-none transition-all duration-200 focus:border-b-2 focus:border-gray-400 ${
                  task.is_completed 
                    ? 'text-gray-500/80' 
                    : 'text-gray-800'
                }`}
                placeholder="Enter task title..."
                autoFocus={false}
              />
            ) : (
              <p className={`text-lg transition-all duration-200 ${
                task.is_completed 
                  ? 'text-gray-500/80' 
                  : 'text-gray-800'
              }`}>
                {task.title}
              </p>
            )}
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
                }
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors group"
              aria-label={isExpanded ? "Collapse task details" : "Expand task details"}
            >
              <svg 
                className={`w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-all duration-200 ${
                  isExpanded ? 'transform rotate-180' : ''
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
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <TaskDetails
          task={task}
          isExpanded={isExpanded}
          onSave={handleUpdate}
          onDelete={onDelete}
          onClose={() => setIsExpanded(false)}
        />
      </div>
    </div>
  );
};

export default Task;
