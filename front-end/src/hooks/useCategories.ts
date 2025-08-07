import { create } from 'zustand';
import React from 'react';
import { Category } from './types';
import { useUserDataStore } from './useUserData';
import { eventBus, UserDataLoadedEvent, AuthStatusChangedEvent } from './eventBus';
import { createApiUrl } from './apiConfig';

// Verbose flag for debug logging
const VERBOSE_DEBUG = false;

interface CategoriesStore {
  // Data
  categories: Category[];
  
  // Single sync state (for debugging/sync indicator)
  hasPendingWrites: boolean;
  
  // Actions
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Omit<Category, 'id' | 'user_id' | 'created_at'>) => void;
  updateCategory: (id: number, updates: Partial<Category>) => void;
  deleteCategory: (id: number) => void;
  clearCategories: () => void;
}

export const useCategoriesStore = create<CategoriesStore>((set, get) => ({
  categories: [],
  hasPendingWrites: false,
  
  setCategories: (categories) => set({ categories }),
  
  clearCategories: () => set({
    categories: [],
    hasPendingWrites: false,
  }),
  
  addCategory: (categoryData) => {
    const userData = useUserDataStore.getState().userData;
    if (!userData) {
      console.error("❌ addCategory called but userData is null!");
      return;
    }

    if (VERBOSE_DEBUG) console.log("➕ Adding category:", categoryData);

    // Optimistic update: Create temporary category with placeholder ID
    const tempCategory = {
      ...categoryData,
      id: Date.now(), // Temporary ID
      user_id: userData.id,
      created_at: new Date().toISOString(),
    };
    
    const { categories } = get();
    set({ 
      categories: [...categories, tempCategory],
      hasPendingWrites: true,
    });

    const apiUrl = createApiUrl('/categories');

    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...categoryData, user_id: userData.id }),
    })
      .then((res) => res.json())
      .then((newCategory) => {
        // Replace temporary category with real category from server
        const { categories } = get();
        const finalCategories = categories.map((category) =>
          category.id === tempCategory.id ? newCategory : category
        );
        
        // Check if this was the last pending write
        const stillHasPendingWrites = finalCategories.some(cat => 
          cat.id > Date.now() - 10000 // Temp IDs from last 10 seconds
        );
        
        set({ 
          categories: finalCategories,
          hasPendingWrites: stillHasPendingWrites,
        });
        
        if (VERBOSE_DEBUG) console.log("✅ Category added successfully:", newCategory);
      })
      .catch((err) => {
        console.error("❌ Error adding category:", err);
        // Revert optimistic update on error
        const { categories } = get();
        const revertedCategories = categories.filter(category => category.id !== tempCategory.id);
        
        set({ 
          categories: revertedCategories,
          hasPendingWrites: revertedCategories.some(cat => cat.id > Date.now() - 10000),
        });
      });
  },

  updateCategory: (id, updates) => {
    const userData = useUserDataStore.getState().userData;
    if (!userData) {
      console.error("❌ updateCategory called but userData is null!");
      return;
    }

    if (VERBOSE_DEBUG) console.log("🔄 Updating category:", id, updates);

    const { categories } = get();
    const originalCategory = categories.find(c => c.id === id);
    
    // Optimistic update
    const updatedCategories = categories.map((category) =>
      category.id === id ? { ...category, ...updates } : category
    );
    
    set({ 
      categories: updatedCategories,
      hasPendingWrites: true,
    });

    const apiUrl = createApiUrl(`/categories/${id}?user_id=${userData.id}`);

    fetch(apiUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
      .then((res) => res.json())
      .then((updatedCategory) => {
        const { categories } = get();
        const finalCategories = categories.map((category) =>
          category.id === id ? updatedCategory : category
        );
        
        set({ 
          categories: finalCategories,
          hasPendingWrites: false,
        });
        
        if (VERBOSE_DEBUG) console.log("✅ Category updated successfully:", updatedCategory);
      })
      .catch((err) => {
        console.error("❌ Error updating category:", err);
        // Revert to original on error
        if (originalCategory) {
          const { categories } = get();
          const revertedCategories = categories.map((category) =>
            category.id === id ? originalCategory : category
          );
          set({ 
            categories: revertedCategories,
            hasPendingWrites: false,
          });
        }
      });
  },

  deleteCategory: (id) => {
    const userData = useUserDataStore.getState().userData;
    if (!userData) {
      console.error("❌ deleteCategory called but userData is null!");
      return;
    }

    if (VERBOSE_DEBUG) console.log("🗑️ Deleting category:", id);

    const { categories } = get();
    const originalCategories = [...categories];
    const filteredCategories = categories.filter((category) => category.id !== id);
    
    set({ 
      categories: filteredCategories,
      hasPendingWrites: true,
    });
    const apiUrl = createApiUrl(`/categories/${id}?user_id=${userData.id}`);

    fetch(apiUrl, { method: "DELETE" })
      .then(() => {
        set({ hasPendingWrites: false });
        if (VERBOSE_DEBUG) console.log("✅ Category deleted successfully");
      })
      .catch((err) => {
        console.error("❌ Error deleting category:", err);
        // Revert deletion on error
        set({ 
          categories: originalCategories,
          hasPendingWrites: false,
        });
      });
  },
}));

// Set up event listeners
useCategoriesStore.getState();

// Listen for user data loaded events
eventBus.on<UserDataLoadedEvent>('user-data-loaded', (data) => {
  useCategoriesStore.getState().setCategories(data.categories);
});

// Listen for auth status changes
eventBus.on<AuthStatusChangedEvent>('auth-status-changed', (data) => {
  if (!data.isAuthenticated) {
    useCategoriesStore.getState().clearCategories();
  }
});

export const useCategories = () => {
  const categories = useCategoriesStore((state) => state.categories);
  const hasPendingWrites = useCategoriesStore((state) => state.hasPendingWrites);
  const addCategory = useCategoriesStore((state) => state.addCategory);
  const updateCategory = useCategoriesStore((state) => state.updateCategory);
  const deleteCategory = useCategoriesStore((state) => state.deleteCategory);
  
  return React.useMemo(
    () => ({ 
      // Clean, simple API
      categories,
      addCategory,
      updateCategory,
      deleteCategory,
      
      // Debug/sync state (for developer use)
      hasPendingWrites,
    }),
    [categories, addCategory, updateCategory, deleteCategory, hasPendingWrites]
  );
};
