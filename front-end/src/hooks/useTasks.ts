import { create } from 'zustand';
import React from 'react';
import { Task } from './types';
import { useUserStore } from './useUser';
import { eventBus, UserDataLoadedEvent, AuthStatusChangedEvent } from './eventBus';
import { createApiUrl } from './apiConfig';

// Verbose flag for debug logging
const VERBOSE_DEBUG = false;

interface TasksStore {
  // Data
  tasks: Task[];
  
  // Single sync state (for debugging/sync indicator)
  hasPendingWrites: boolean;
  
  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'completed_at'>) => void;
  updateTask: (id: number, updates: Partial<Task>) => void;
  deleteTask: (id: number) => void;
  clearTasks: () => void;
}

export const useTasksStore = create<TasksStore>((set, get) => ({
  tasks: [],
  hasPendingWrites: false,
  
  setTasks: (tasks) => set({ tasks }),
  
  clearTasks: () => set({
    tasks: [],
    hasPendingWrites: false,
  }),
  
  addTask: (taskData) => {
    const userData = useUserStore.getState().userData;
    if (!userData) {
      console.error("❌ addTask called but userData is null!");
      return;
    }

    if (VERBOSE_DEBUG) console.log("➕ Adding task:", taskData);

    // Optimistic update: Create temporary task with placeholder ID
    const tempTask = {
      ...taskData,
      id: Date.now(), // Temporary ID
      user_id: userData.id,
      created_at: new Date().toISOString(),
      completed_at: undefined,
    };
    
    const { tasks } = get();
    set({ 
      tasks: [...tasks, tempTask],
      hasPendingWrites: true,
    });

    const apiUrl = createApiUrl('/tasks/');

    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...taskData, user_id: userData.id }),
    })
      .then((res) => res.json())
      .then((newTask) => {
        // Replace temporary task with real task from server
        const { tasks } = get();
        const finalTasks = tasks.map((task) =>
          task.id === tempTask.id ? newTask : task
        );
        
        // Check if this was the last pending write
        const stillHasPendingWrites = finalTasks.some(task => 
          task.id > Date.now() - 10000 // Temp IDs from last 10 seconds
        );
        
        set({ 
          tasks: finalTasks,
          hasPendingWrites: stillHasPendingWrites,
        });
        
        if (VERBOSE_DEBUG) console.log("✅ Task added successfully:", newTask);
      })
      .catch((err) => {
        console.error("❌ Error adding task:", err);
        // Revert optimistic update on error
        const { tasks } = get();
        const revertedTasks = tasks.filter(task => task.id !== tempTask.id);
        
        set({ 
          tasks: revertedTasks,
          hasPendingWrites: revertedTasks.some(task => task.id > Date.now() - 10000),
        });
      });
  },

  updateTask: (id, changes) => {
    if (VERBOSE_DEBUG) console.log(`🔄 Updating task ${id}:`, changes);

    const userData = useUserStore.getState().userData;
    if (!userData) {
      console.error("❌ updateTask called but userData is null!");
      return;
    }

    const { tasks } = get();
    const originalTask = tasks.find(t => t.id === id);
    
    // Optimistic update
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, ...changes } : task
    );
    
    set({ 
      tasks: updatedTasks,
      hasPendingWrites: true,
    });
    
    const apiUrl = createApiUrl(`/tasks/${id}?user_id=${userData.id}`);
    
    fetch(apiUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    })
      .then((res) => res.json())
      .then((updatedTask) => {
        const { tasks } = get();
        const finalTasks = tasks.map(task => 
          task.id === id ? updatedTask : task
        );
        
        set({ 
          tasks: finalTasks,
          hasPendingWrites: false,
        });
        
        if (VERBOSE_DEBUG) console.log("✅ Task updated successfully:", updatedTask);
      })
      .catch((err) => {
        console.error("❌ Error updating task:", err);
        // Revert to original on error
        if (originalTask) {
          const { tasks } = get();
          const revertedTasks = tasks.map(task => 
            task.id === id ? originalTask : task
          );
          set({ 
            tasks: revertedTasks,
            hasPendingWrites: false,
          });
        }
      });
  },

  deleteTask: (id) => {
    if (VERBOSE_DEBUG) console.log(`🗑️ Deleting task ${id}`);

    const userData = useUserStore.getState().userData;
    if (!userData) {
      console.error("❌ deleteTask called but userData is null!");
      return;
    }

    const { tasks } = get();
    const originalTasks = [...tasks];
    const filteredTasks = tasks.filter(task => task.id !== id);
    
    set({ 
      tasks: filteredTasks,
      hasPendingWrites: true,
    });
    
    const apiUrl = createApiUrl(`/tasks/${id}?user_id=${userData.id}`);
    
    fetch(apiUrl, { method: "DELETE" })
      .then(() => {
        set({ hasPendingWrites: false });
        if (VERBOSE_DEBUG) console.log("✅ Task deleted successfully");
      })
      .catch((err) => {
        console.error("❌ Error deleting task:", err);
        // Revert deletion on error
        set({ 
          tasks: originalTasks,
          hasPendingWrites: false,
        });
      });
  },
}));

// Listen for user data loaded events
eventBus.on<UserDataLoadedEvent>('user-data-loaded', (data) => {
  useTasksStore.getState().setTasks(data.tasks);
});

// Listen for auth status changes
eventBus.on<AuthStatusChangedEvent>('auth-status-changed', (data) => {
  if (!data.isAuthenticated) {
    useTasksStore.getState().clearTasks();
  }
});

export const useTasks = () => {
  const tasks = useTasksStore((state) => state.tasks);
  const hasPendingWrites = useTasksStore((state) => state.hasPendingWrites);
  const addTask = useTasksStore((state) => state.addTask);
  const updateTask = useTasksStore((state) => state.updateTask);
  const deleteTask = useTasksStore((state) => state.deleteTask);
  
  return React.useMemo(
    () => ({ 
      // Clean, simple API
      tasks,
      addTask,
      updateTask,
      deleteTask,
      
      // Debug/sync state (for developer use)
      hasPendingWrites,
    }),
    [tasks, addTask, updateTask, deleteTask, hasPendingWrites]
  );
};
