import React, { useState } from 'react';
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
  const [description, setDescription] = useState(task.description || '');
  const [categoryId, setCategoryId] = useState(task.category_id?.toString() || '');
  const [dueDate, setDueDate] = useState(() => {
    if (!task.due_date) return '';
    // Convert ISO string to YYYY-MM-DD for date input
    return task.due_date.split('T')[0];
  });

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
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategoryId = e.target.value;
    setCategoryId(newCategoryId);
    autoSave({ category_id: newCategoryId ? Number(newCategoryId) : null });
  };

  // Auto-save due date on change
  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDueDate = e.target.value;
    setDueDate(newDueDate);
    autoSave({ due_date: newDueDate ? new Date(newDueDate + 'T00:00:00').toISOString() : undefined });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
      onClose();
    }
  };

  return (
    <div className="p-4">
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
            onChange={handleCategoryChange}
            className="w-full px-3 py-2 mb-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            value={dueDate}
            onChange={handleDueDateChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-start">
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
