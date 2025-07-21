import React, { useState } from 'react';
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

  return (
    <div 
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
                ? 'bg-gray-500/20 border-gray-500/50 text-white scale-110'
                : 'bg-gray-400/20 border-gray-400/50 hover:border-green-400 hover:scale-105'
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
            <p className={`text-lg transition-all duration-200 ${
              task.is_completed 
                ? 'text-gray-500/80 line-through' 
                : 'text-gray-800'
            }`}>
              {task.title}
            </p>
          </div>
          
          {/* Expand/Collapse Indicator */}
          <div className="flex items-center gap-2">
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isExpanded ? 'transform rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>

            {/* Delete Button */}
            <div
              data-action="delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center cursor-pointer transition-colors group"
              aria-label="Delete task"
            >
              <svg className="w-5 h-5 text-gray-500 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M6 6l12 12M6 18L18 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <TaskDetails
          task={task}
          onSave={handleUpdate}
          onDelete={onDelete}
          onClose={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};

export default Task;
