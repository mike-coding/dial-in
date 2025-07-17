import React, { useState } from 'react';

interface Task {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
}

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');

  const addTask = () => {
    if (newTaskText.trim() === '') return;
    
    const newTask: Task = {
      id: Date.now(),
      text: newTaskText.trim(),
      completed: false,
      createdAt: new Date()
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskText('');
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const clearCompleted = () => {
    setTasks(tasks.filter(task => !task.completed));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Tasks</h1>
          <p className="text-gray-600">
            {completedCount} of {totalCount} tasks completed
          </p>
        </div>

        {/* Add new task */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a new task..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={addTask}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Tasks list */}
        <div className="max-h-96 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p>No tasks yet. Add one above to get started!</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <li key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        task.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {task.completed && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        task.completed 
                          ? 'text-gray-500 line-through' 
                          : 'text-gray-900'
                      }`}>
                        {task.text}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {task.createdAt.toLocaleDateString()} at {task.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1"
                      aria-label="Delete task"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer with actions */}
        {tasks.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {tasks.filter(task => !task.completed).length} remaining
              </span>
              {completedCount > 0 && (
                <button
                  onClick={clearCompleted}
                  className="text-sm text-red-500 hover:text-red-700 transition-colors"
                >
                  Clear completed ({completedCount})
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
