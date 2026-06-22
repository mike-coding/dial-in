import React, { useState, useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useCategories } from '../hooks/useCategories';
import { useUserData } from '../hooks/AppContext';
import { Task as TaskType } from '../hooks/types';
import { getTaskStart } from '../utils/taskSchedule';
import Task from './Task';
import WindowsEmoji from './WindowsEmoji';

interface PlannerTasksProps {
  currentDate: Date;
  isMobile?: boolean;
  selectedDate: Date | null;
}

type PlannerPeriod = 'day' | 'week' | 'month' | 'upcoming';

const PlannerTasks: React.FC<PlannerTasksProps> = ({ currentDate, isMobile = false, selectedDate }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const { categories } = useCategories();
  const { userData: preferences } = useUserData();

  const plannerPeriod: PlannerPeriod = preferences?.time_period === 'today'
    ? 'day'
    : ['day', 'week', 'month', 'upcoming'].includes(preferences?.time_period || '')
      ? (preferences?.time_period as PlannerPeriod)
      : 'day';

  const showUndated = preferences?.show_undated;
  const showUncategorized = preferences?.show_uncategorized;
  const showOverdue = preferences?.show_overdue;
  const categoryFilter = preferences?.show_categories || [];

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
    const selectedDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const selectedTaskDay = selectedDate
      ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
      : null;

    const weekStart = new Date(selectedDay);
    weekStart.setDate(selectedDay.getDate() - selectedDay.getDay());
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const upcomingEnd = new Date(selectedDay);
    upcomingEnd.setDate(selectedDay.getDate() + 7);
    
    const monthStart = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), 1);
    const monthEnd = new Date(selectedDay.getFullYear(), selectedDay.getMonth() + 1, 1);

    return tasks.filter(task => {
      const taskStart = getTaskStart(task);
      const taskDateOnly = taskStart
        ? new Date(taskStart.getFullYear(), taskStart.getMonth(), taskStart.getDate())
        : null;

      // Date-only tasks become overdue after their due date has passed; timed tasks compare exact time.
      const isOverdue = Boolean(
        taskStart &&
        !task.is_completed &&
        (task.due_time ? taskStart < now : taskDateOnly !== null && taskDateOnly < today)
      );
      
      // If task is overdue and we don't want to show overdue tasks, filter it out
      if (isOverdue && !showOverdue) return false;
      
      if (taskStart && taskDateOnly) {
        const includeByOverdue = isOverdue && showOverdue;

        if (!includeByOverdue && selectedTaskDay) {
          if (taskDateOnly.getTime() !== selectedTaskDay.getTime()) return false;
        } else if (!includeByOverdue) {
          switch (plannerPeriod) {
            case 'day':
              if (taskDateOnly.getTime() !== selectedDay.getTime()) return false;
              break;
            case 'week':
              if (taskDateOnly < weekStart || taskDateOnly >= weekEnd) return false;
              break;
            case 'month':
              if (taskDateOnly < monthStart || taskDateOnly >= monthEnd) return false;
              break;
            case 'upcoming':
              if (taskDateOnly < selectedDay || taskDateOnly >= upcomingEnd) return false;
              break;
          }
        }
      } else if (!taskStart) {
        // Task has no due date - respect showUndated setting for all date filters
        if (!showUndated) return false;
      }

      // Category filter
      if (categories && categories.length > 0) {
        // Categories exist in the system
        if (categoryFilter.length > 0) {
          // Some categories are selected - show tasks from those categories + uncategorized if enabled
          const hasMatchingCategory = task.category_id && categoryFilter.includes(task.category_id);
          const isUncategorizedAndShown = !task.category_id && showUncategorized;
          
          if (!hasMatchingCategory && !isUncategorizedAndShown) {
            return false;
          }
        } else {
          // No categories are selected - only show uncategorized tasks (if enabled)
          if (task.category_id) return false; // Hide all categorized tasks
          if (!task.category_id && !showUncategorized) return false; // Hide uncategorized if disabled
        }
      } else {
        // No categories exist in system - just apply uncategorized filter for safety
        if (!task.category_id && !showUncategorized) return false;
      }

      return true;
    });
  }, [tasks, currentDate, selectedDate, plannerPeriod, showUndated, showUncategorized, showOverdue, categoryFilter]);

  const sortedFilteredTasks = useMemo(() => {
    const getSortTimestamp = (task: TaskType) => {
      if (task.due_date) {
        return getTaskStart(task)?.getTime() || 0;
      }
      return new Date(task.created_at).getTime();
    };

    return [...filteredTasks].sort((leftTask, rightTask) => {
      const leftTimestamp = getSortTimestamp(leftTask);
      const rightTimestamp = getSortTimestamp(rightTask);
      return leftTimestamp - rightTimestamp;
    });
  }, [filteredTasks]);

  const incompleteTasks = sortedFilteredTasks.filter(task => !task.is_completed);
  const completedTasks = sortedFilteredTasks.filter(task => task.is_completed);
  const completedCount = completedTasks.length;

  return (
    <div className="w-full min-w-0 rounded-xl">
      <div className={`w-full min-w-0 ${isMobile ? 'max-w-full px-4' : 'max-w-2xl'} mx-auto ${isMobile ? 'pt-4' : 'pt-8'}`}>
        {/* Add Task Input */}
        <div className="mb-2">
          <div className="bg-white rounded-md border border-white/20 px-4 py-2 backdrop-blur-lg backdrop-brightness-105 backdrop-saturate-70 backdrop-contrast-100">
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
        <div className="w-full min-w-0 space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <WindowsEmoji emoji="📝" size={72} className="mb-4 opacity-50" />
              <p className="text-gray-500 text-lg">No tasks match your filters</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filter settings above</p>
            </div>
          ) : (
            <>
              {/* Incomplete Tasks */}
              {incompleteTasks.map((task) => (
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
              {completedTasks.map((task) => (
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

export default PlannerTasks;
