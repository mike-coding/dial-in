import React, { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { Task as TaskType } from '../hooks/types';
import Task from './Task';

interface TasksProps {
  isMobile?: boolean;
}

const Tasks: React.FC<TasksProps> = ({ isMobile = false }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [filter, setFilter] = useState('Today');
  const { tasks, addTask, updateTask, deleteTask } = useTasks();

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

  const completedCount = (tasks || []).filter(task => task.is_completed).length;

  return (
    <div className="">
      <div className={`w-full ${isMobile ? 'max-w-full px-4' : 'max-w-2xl'} mx-auto ${isMobile ? 'pt-4' : 'pt-8'}`}>
        
        {/* Filter Dropdown */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white/90 rounded-md px-6 py-3 text-gray-700 font-medium shadow-sm hover:shadow-md transition-shadow appearance-none pr-10 cursor-pointer"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="All">All</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
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
          {(tasks || []).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-50">📝</div>
              <p className="text-gray-500 text-lg">No tasks yet</p>
              <p className="text-gray-400 text-sm mt-1">Add one above to get started!</p>
            </div>
          ) : (
            <>
              {/* Incomplete Tasks */}
              {(tasks || []).filter(task => !task.is_completed).map((task) => (
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
              {(tasks || []).filter(task => task.is_completed).map((task) => (
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
