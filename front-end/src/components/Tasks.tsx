import React, { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useCategories } from '../hooks/useCategories';

interface TasksProps {
  isMobile?: boolean;
}

const Tasks: React.FC<TasksProps> = ({ isMobile = false }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const { categories } = useCategories();

  // Get default category (first one) or create a fallback
  const defaultCategory = categories.length > 0 ? categories[0] : null;

  const handleAddTask = () => {
    if (newTaskText.trim() === '') return;
    
    addTask({
      title: newTaskText.trim(),
      description: '',
      category_id: defaultCategory?.id || null, // Allow null category
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

  const clearCompleted = () => {
    const completedTasks = (tasks || []).filter(task => task.is_completed);
    completedTasks.forEach(task => deleteTask(task.id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  const completedCount = (tasks || []).filter(task => task.is_completed).length;
  const totalCount = (tasks || []).length;

  return (
    <div className={`w-full ${isMobile ? 'max-w-full px-2' : 'max-w-2xl'} mx-auto ${isMobile ? 'p-2' : 'p-6'}`}>
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className={`${isMobile ? 'p-4' : 'p-6'} border-b border-gray-200`}>
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-800 mb-2`}>Tasks</h1>
          <p className="text-gray-600">
            {completedCount} of {totalCount} tasks completed
          </p>
        </div>

        {/* Add new task */}
        <div className={`${isMobile ? 'p-4' : 'p-6'} border-b border-gray-200`}>
          <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a new task..."
              className={`${isMobile ? 'w-full mb-2' : 'flex-1'} px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            <div
              onClick={handleAddTask}
              className={`${isMobile ? 'w-full text-center' : 'px-6'} py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer select-none`}
            >
              Add
            </div>
          </div>
        </div>

        {/* Tasks list */}
        <div className={`${isMobile ? 'max-h-80' : 'max-h-96'} overflow-y-auto`}>
          {(tasks || []).length === 0 ? (
            <div className={`${isMobile ? 'p-6' : 'p-8'} text-center text-gray-500`}>
              <div className="text-4xl mb-2">📝</div>
              <p className={isMobile ? 'text-sm' : ''}>No tasks yet. Add one above to get started!</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {(tasks || []).map((task) => (
                <li key={task.id} className={`${isMobile ? 'p-3' : 'p-4'} hover:bg-gray-50 transition-colors`}>
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => toggleTask(task.id)}
                      className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} rounded border-2 flex items-center justify-center transition-colors cursor-pointer select-none ${
                        task.is_completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {task.is_completed && (
                        <svg className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`${isMobile ? 'text-base' : 'text-sm'} font-medium ${
                        task.is_completed 
                          ? 'text-gray-500 line-through' 
                          : 'text-gray-900'
                      }`}>
                        {task.title}
                      </p>
                      <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 mt-1`}>
                        {new Date(task.created_at).toLocaleDateString()} at {new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    <div
                      onClick={() => handleDeleteTask(task.id)}
                      className={`text-red-400 hover:text-red-600 transition-colors ${isMobile ? 'p-2' : 'p-1'} cursor-pointer select-none`}
                      aria-label="Delete task"
                    >
                      <svg className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer with actions */}
        {(tasks || []).length > 0 && (
          <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-gray-200 bg-gray-50`}>
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'}`}>
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                {(tasks || []).filter(task => !task.is_completed).length} remaining
              </span>
              {completedCount > 0 && (
                <div
                  onClick={clearCompleted}
                  className={`${isMobile ? 'text-xs' : 'text-sm'} text-red-500 hover:text-red-700 transition-colors cursor-pointer select-none`}
                >
                  Clear completed ({completedCount})
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
