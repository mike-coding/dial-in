import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useCategories } from '../hooks/useCategories';
import { useUser, useUserData } from '../hooks/AppContext';
import { Task as TaskType } from '../hooks/types';
import Task from './Task';
import WindowsEmoji from './WindowsEmoji';

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
  const { userData: authUser } = useUser();
  const { userData: preferences, loadUserData, updateUserData } = useUserData();
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Load user preferences on mount
  useEffect(() => {
    if (authUser?.id && !preferences) {
      loadUserData(authUser.id);
    }
  }, [authUser, preferences, loadUserData]);

  // Update filters when user preferences load
  useEffect(() => {
    if (preferences) {
      // Map backend time_period values to frontend dateFilter values
      const dateFilterMap: Record<string, 'Today' | 'This Week' | 'This Month' | 'Upcoming'> = {
        'today': 'Today',
        'week': 'This Week', 
        'month': 'This Month',
        'upcoming': 'Upcoming'
      };
      
      setFilters(prev => ({
        ...prev,
        dateFilter: dateFilterMap[preferences.time_period] || 'Today',
        showUndated: preferences.show_undated,
        showUncategorized: preferences.show_uncategorized,
        showOverdue: preferences.show_overdue,
      }));
    }
  }, [preferences]);

  // Function to update filter preferences in backend
  const updateFilterPreference = (updates: { 
    time_period?: string;
    show_undated?: boolean;
    show_uncategorized?: boolean; 
    show_overdue?: boolean;
  }) => {
    if (authUser?.id) {
      updateUserData(authUser.id, updates);
    }
  };

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
    
    // Fix week calculation - assume Monday as week start
    const weekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 6 days from Monday
    weekStart.setDate(today.getDate() - daysFromMonday);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    
    // Fix month calculation - handle year rollover
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    if (monthEnd.getMonth() === 0) { // January = 0, so we rolled over
      monthEnd.setFullYear(monthEnd.getFullYear());
    }

    return tasks.filter(task => {
      // Check if task is overdue
      const isOverdue = task.due_date && new Date(task.due_date) < now && !task.is_completed;
      
      // If task is overdue and we don't want to show overdue tasks, filter it out
      if (isOverdue && !filters.showOverdue) return false;
      
      // Date filter (only apply to non-overdue, incomplete tasks)
      if (task.due_date && !isOverdue && !task.is_completed) {
        const dueDate = new Date(task.due_date);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        
        switch (filters.dateFilter) {
          case 'Today':
            if (dueDateOnly.getTime() !== today.getTime()) return false;
            break;
          case 'This Week':
            // Show incomplete tasks due from today through end of this week
            if (dueDateOnly < today || dueDateOnly >= weekEnd) return false;
            break;
          case 'This Month':
            // Show incomplete tasks due from today through end of this month
            if (dueDateOnly < today || dueDateOnly >= monthEnd) return false;
            break;
          case 'Upcoming':
            if (dueDateOnly < today) return false;
            break;
        }
      } else if (task.due_date && task.is_completed) {
        // For completed tasks, apply more lenient date filtering
        const dueDate = new Date(task.due_date);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        
        switch (filters.dateFilter) {
          case 'Today':
            // Show completed tasks that were due today OR were overdue and just completed
            if (dueDateOnly.getTime() !== today.getTime() && dueDateOnly >= today) return false;
            break;
          case 'This Week':
            // Show completed tasks from this entire week (past and future)
            if (dueDateOnly < weekStart || dueDateOnly >= weekEnd) return false;
            break;
          case 'This Month':
            // Show completed tasks from this entire month (past and future)
            if (dueDateOnly < monthStart || dueDateOnly >= monthEnd) return false;
            break;
          case 'Upcoming':
            // For upcoming, still don't show past completed tasks
            if (dueDateOnly < today) return false;
            break;
        }
      } else if (!task.due_date) {
        // Task has no due date - respect showUndated setting for all date filters
        if (!filters.showUndated) return false;
      }

      // Category filter
      if (categories && categories.length > 0) {
        // Categories exist in the system
        if (filters.categoryIds.length > 0) {
          // Some categories are selected - show tasks from those categories + uncategorized if enabled
          const hasMatchingCategory = task.category_id && filters.categoryIds.includes(task.category_id);
          const isUncategorizedAndShown = !task.category_id && filters.showUncategorized;
          
          if (!hasMatchingCategory && !isUncategorizedAndShown) {
            return false;
          }
        } else {
          // No categories are selected - only show uncategorized tasks (if enabled)
          if (task.category_id) return false; // Hide all categorized tasks
          if (!task.category_id && !filters.showUncategorized) return false; // Hide uncategorized if disabled
        }
      } else {
        // No categories exist in system - just apply uncategorized filter for safety
        if (!task.category_id && !filters.showUncategorized) return false;
      }

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
    <div className="rounded-xl ">
      <div className={`w-full ${isMobile ? 'max-w-full px-4' : 'max-w-2xl'} mx-auto ${isMobile ? 'pt-4' : 'pt-8'}`}>
        
        {/* Filter Dropdown */}
        <div className="mb-6 flex justify-center">
          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="bg-white/30 rounded-md px-6 py-3 text-gray-800 font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 backdrop-blur-lg backdrop-brightness-105 backdrop-saturate-70 backdrop-contrast-100"
            >
              <span>{filters.dateFilter}</span>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isFilterOpen && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-md border border-gray-200 p-4 z-50 w-80">
                {/* Date Filter */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Time Period</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="radio"
                        name="dateFilter"
                        checked={filters.dateFilter === 'Today'}
                        onChange={() => {
                          setFilters(prev => ({ ...prev, dateFilter: 'Today' }));
                          updateFilterPreference({ time_period: 'today' });
                        }}
                        className="mr-2"
                      />
                      <span className="text-gray-900">Today</span>
                    </label>
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="radio"
                        name="dateFilter"
                        checked={filters.dateFilter === 'Upcoming'}
                        onChange={() => {
                          setFilters(prev => ({ ...prev, dateFilter: 'Upcoming' }));
                          updateFilterPreference({ time_period: 'upcoming' });
                        }}
                        className="mr-2"
                      />
                      <span className="text-gray-900">Upcoming</span>
                    </label>
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="radio"
                        name="dateFilter"
                        checked={filters.dateFilter === 'This Week'}
                        onChange={() => {
                          setFilters(prev => ({ ...prev, dateFilter: 'This Week' }));
                          updateFilterPreference({ time_period: 'week' });
                        }}
                        className="mr-2"
                      />
                      <span className="text-gray-900">This Week</span>
                    </label>
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="radio"
                        name="dateFilter"
                        checked={filters.dateFilter === 'This Month'}
                        onChange={() => {
                          setFilters(prev => ({ ...prev, dateFilter: 'This Month' }));
                          updateFilterPreference({ time_period: 'month' });
                        }}
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
                          <WindowsEmoji emoji={category.icon || '📁'} size={18} className="mr-1" />
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
                        onChange={(e) => {
                          setFilters(prev => ({ ...prev, showUndated: e.target.checked }));
                          updateFilterPreference({ show_undated: e.target.checked });
                        }}
                        className="mr-2"
                      />
                      <span className="text-gray-900">Undated</span>
                    </label>
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={filters.showUncategorized}
                        onChange={(e) => {
                          setFilters(prev => ({ ...prev, showUncategorized: e.target.checked }));
                          updateFilterPreference({ show_uncategorized: e.target.checked });
                        }}
                        className="mr-2"
                      />
                      <span className="text-gray-900">Uncategorized</span>
                    </label>
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={filters.showOverdue}
                        onChange={(e) => {
                          setFilters(prev => ({ ...prev, showOverdue: e.target.checked }));
                          updateFilterPreference({ show_overdue: e.target.checked });
                        }}
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
        <div className="mb-2">
          <div className="bg-white/30 rounded-md border border-white/20 px-4 py-2 backdrop-blur-lg backdrop-brightness-105 backdrop-saturate-70 backdrop-contrast-100">
            <div className="flex items-center gap-3">
              <div 
                onClick={handleAddTask}
                className="w-10 h-10 flex items-center justify-center cursor-pointer transition-colors hover:scale-105 transition-all duration-200"
              >
                <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a new task..."
                className="flex-1 text-gray-600/80 placeholder-gray-600/40 bg-transparent border-none outline-none text-lg"
              />
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <WindowsEmoji emoji="📝" size={72} className="mb-4 opacity-50" />
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
                <div className="flex flex-row justify-center py-2 w-full">
                  <div className="h-1 w-5/6 rounded-sm bg-gray-600/20 transition-all duration-200 backdrop-blur-lg backdrop-brightness-100 backdrop-saturate-70 backdrop-contrast-100"></div>
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
