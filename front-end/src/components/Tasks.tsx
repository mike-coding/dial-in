import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useCategories } from '../hooks/useCategories';
import { Task as TaskType } from '../hooks/types';
import Task from './Task';

interface TasksProps {
  isMobile?: boolean;
}

interface FilterState {
  dateFilter: 'Today' | 'This Week' | 'This Month' | 'Upcoming';
  categoryIds: number[];
  showUndated: boolean;
  showUncategorized: boolean;
  showOverdue: boolean;
}

const Tasks: React.FC<TasksProps> = ({ isMobile = false }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    dateFilter: 'Today',
    categoryIds: [],
    showUndated: true,
    showUncategorized: true,
    showOverdue: true,
  });
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const { categories } = useCategories();
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isFilterOpen]);

  const handleAddTask = () => {
    if (newTaskText.trim() === '') return;
    
    addTask({
      title: newTaskText.trim(),
      description: '',
      category_id: null, // Default to no category
      is_completed: false,
    });
    
    setNewTaskText('');
  };

  const toggleTask = (id: number) => {
    const task = (tasks || []).find(t => t.id === id);
    if (task) {
      updateTask(id, { 
        is_completed: !task.is_completed,
        completed_at: !task.is_completed ? new Date().toISOString() : undefined
      });
    }
  };

  const handleDeleteTask = (id: number) => {
    deleteTask(id);
  };

  const handleUpdateTask = (id: number, updates: Partial<TaskType>) => {
    updateTask(id, updates);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);
    const monthFromNow = new Date(today);
    monthFromNow.setMonth(today.getMonth() + 1);

    return tasks.filter(task => {
      // Check if task is overdue
      const isOverdue = task.due_date && new Date(task.due_date) < now && !task.is_completed;
      
      // If task is overdue and we don't want to show overdue tasks, filter it out
      if (isOverdue && !filters.showOverdue) return false;
      
      // Date filter (only apply to non-overdue tasks)
      if (task.due_date && !isOverdue) {
        const dueDate = new Date(task.due_date);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        
        switch (filters.dateFilter) {
          case 'Today':
            if (dueDateOnly.getTime() !== today.getTime()) return false;
            break;
          case 'This Week':
            if (dueDateOnly < today || dueDateOnly >= weekFromNow) return false;
            break;
          case 'This Month':
            if (dueDateOnly < today || dueDateOnly >= monthFromNow) return false;
            break;
          case 'Upcoming':
            if (dueDateOnly < today) return false;
            break;
        }
      } else if (!task.due_date) {
        // Task has no due date - respect showUndated setting for all date filters
        if (!filters.showUndated) return false;
      }

      // Category filter
      if (filters.categoryIds.length > 0) {
        if (!task.category_id || !filters.categoryIds.includes(task.category_id)) {
          return false;
        }
      }

      // Uncategorized filter
      if (!task.category_id && !filters.showUncategorized) return false;

      return true;
    });
  }, [tasks, filters]);

  const toggleCategoryFilter = (categoryId: number) => {
    setFilters(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
  };

  const completedCount = filteredTasks.filter(task => task.is_completed).length;

  return (
    <div className="">
      <div className={`w-full ${isMobile ? 'max-w-full px-4' : 'max-w-2xl'} mx-auto ${isMobile ? 'pt-4' : 'pt-8'}`}>
        
        {/* Filter Dropdown */}
        <div className="mb-6 flex justify-center">
          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="bg-white/90 rounded-md px-6 py-3 text-gray-700 font-medium shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center gap-2"
            >
              <span>{filters.dateFilter}</span>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isFilterOpen && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-md shadow-lg border border-gray-200 p-4 z-50 w-80">
                {/* Date Filter */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Time Period</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="radio"
                        name="dateFilter"
                        checked={filters.dateFilter === 'Today'}
                        onChange={() => setFilters(prev => ({ ...prev, dateFilter: 'Today' }))}
                        className="mr-2"
                      />
                      <span className="text-gray-900">Today</span>
                    </label>
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="radio"
                        name="dateFilter"
                        checked={filters.dateFilter === 'Upcoming'}
                        onChange={() => setFilters(prev => ({ ...prev, dateFilter: 'Upcoming' }))}
                        className="mr-2"
                      />
                      <span className="text-gray-900">Upcoming</span>
                    </label>
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="radio"
                        name="dateFilter"
                        checked={filters.dateFilter === 'This Week'}
                        onChange={() => setFilters(prev => ({ ...prev, dateFilter: 'This Week' }))}
                        className="mr-2"
                      />
                      <span className="text-gray-900">This Week</span>
                    </label>
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="radio"
                        name="dateFilter"
                        checked={filters.dateFilter === 'This Month'}
                        onChange={() => setFilters(prev => ({ ...prev, dateFilter: 'This Month' }))}
                        className="mr-2"
                      />
                      <span className="text-gray-900">This Month</span>
                    </label>
                  </div>
                </div>

                {/* Category Filter */}
                {categories && categories.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {categories.map(category => (
                        <label key={category.id} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={filters.categoryIds.includes(category.id)}
                            onChange={() => toggleCategoryFilter(category.id)}
                            className="mr-2"
                          />
                          <span className="text-lg mr-1">{category.icon || '📁'}</span>
                          <span className="text-gray-900">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Filters */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Show</h3>
                  <div className="space-y-1">
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={filters.showUndated}
                        onChange={(e) => setFilters(prev => ({ ...prev, showUndated: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-gray-900">Undated</span>
                    </label>
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={filters.showUncategorized}
                        onChange={(e) => setFilters(prev => ({ ...prev, showUncategorized: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-gray-900">Uncategorized</span>
                    </label>
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={filters.showOverdue}
                        onChange={(e) => setFilters(prev => ({ ...prev, showOverdue: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-gray-900">Overdue</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Task Input */}
        <div className="mb-6">
          <div className="bg-white/90 rounded-sm shadow-sm border border-gray-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <div 
                onClick={handleAddTask}
                className="w-10 h-10 flex items-center justify-center cursor-pointer transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a new task..."
                className="flex-1 text-gray-700 placeholder-gray-400 bg-transparent border-none outline-none text-lg"
              />
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-50">📝</div>
              <p className="text-gray-500 text-lg">No tasks match your filters</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filter settings above</p>
            </div>
          ) : (
            <>
              {/* Incomplete Tasks */}
              {filteredTasks.filter(task => !task.is_completed).map((task) => (
                <Task
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onDelete={handleDeleteTask}
                  onUpdate={handleUpdateTask}
                />
              ))}

              {/* Divider - only show if there are completed tasks */}
              {completedCount > 0 && (
                <div className="flex flex-row justify-center py-4 w-full">
                  <div className="h-1 bg-gray-300 w-5/6"></div>
                </div>
              )}

              {/* Completed Tasks */}
              {filteredTasks.filter(task => task.is_completed).map((task) => (
                <Task
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onDelete={handleDeleteTask}
                  onUpdate={handleUpdateTask}
                />
              ))}
            </>
          )}
        </div>

        {/* Bottom spacing for mobile navigation */}
        {isMobile && <div className="h-16"></div>}
      </div>
    </div>
  );
};

export default Tasks;
