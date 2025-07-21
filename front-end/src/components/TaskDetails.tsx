import React, { useState, useEffect } from 'react';
import { Task as TaskType } from '../hooks/types';
import { useCategories } from '../hooks/useCategories';

interface TaskDetailsProps {
  task: TaskType;
  onSave: (updatedTask: Partial<TaskType>) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ task, onSave, onDelete, onClose }) => {
  const { categories } = useCategories();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [categoryId, setCategoryId] = useState(task.category_id || '');
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const [hasChanges, setHasChanges] = useState(false);

  // Check if there are unsaved changes
  useEffect(() => {
    const changed = 
      title !== task.title ||
      description !== (task.description || '') ||
      categoryId !== (task.category_id || '') ||
      dueDate !== (task.due_date || '');
    setHasChanges(changed);
  }, [title, description, categoryId, dueDate, task]);

  const handleSave = () => {
    const updates: Partial<TaskType> = {
      title,
      description: description || undefined,
      category_id: categoryId ? Number(categoryId) : undefined,
      due_date: dueDate || undefined,
    };
    onSave(updates);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
      onClose();
    }
  };

  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return '';
    // Convert from ISO string to YYYY-MM-DD format for input
    return dateString.split('T')[0];
  };

  const formatDateForSubmission = (dateString: string) => {
    if (!dateString) return '';
    // Convert from YYYY-MM-DD to ISO string
    return new Date(dateString + 'T00:00:00').toISOString();
  };

  return (
    <div className="p-4">
      <div className="space-y-4">

        {/* Task Title */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter task title..."
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Add a description..."
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">No category</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Due Date
          </label>
          <input
            type="date"
            value={formatDateForInput(dueDate)}
            onChange={(e) => setDueDate(e.target.value ? formatDateForSubmission(e.target.value) : '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
          >
            Delete Task
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || !title.trim()}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                hasChanges && title.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
