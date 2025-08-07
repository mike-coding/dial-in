import { create } from 'zustand';
import React from 'react';
import { Rule } from './types';
import { eventBus, UserDataLoadedEvent, AuthStatusChangedEvent } from './eventBus';
import { createApiUrl } from './apiConfig';

// Verbose flag for debug logging
const VERBOSE_DEBUG = false;

interface RulesStore {
  rules: Rule[];
  hasPendingWrites: boolean;
  addRule: (rule: Omit<Rule, 'id' | 'created_at'>) => void;
  updateRule: (id: number, updates: Partial<Rule>) => void;
  deleteRule: (id: number) => void;
  setRules: (rules: Rule[]) => void;
  clearRules: () => void;
}

export const useRulesStore = create<RulesStore>((set, get) => ({
  rules: [],
  hasPendingWrites: false,
  
  setRules: (rules) => set({ rules }),
  
  clearRules: () => set({
    rules: [],
    hasPendingWrites: false,
  }),
  
  addRule: (ruleData) => {
    if (VERBOSE_DEBUG) console.log("➕ Adding rule:", ruleData);

    // Optimistic update: Create temporary rule with placeholder ID
    const tempRule = {
      ...ruleData,
      id: Date.now(), // Temporary ID
      created_at: new Date().toISOString(),
    };
    
    const { rules } = get();
    set({ 
      rules: [...rules, tempRule],
      hasPendingWrites: true,
    });

    const apiUrl = createApiUrl('/rules');

    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ruleData),
    })
      .then((res) => res.json())
      .then((newRule) => {
        // Replace temporary rule with real rule from server
        const { rules } = get();
        const finalRules = rules.map((rule) =>
          rule.id === tempRule.id ? newRule : rule
        );
        
        // Check if this was the last pending write
        const stillHasPendingWrites = finalRules.some(rule => 
          rule.id > Date.now() - 10000 // Temp IDs from last 10 seconds
        );
        
        set({ 
          rules: finalRules,
          hasPendingWrites: stillHasPendingWrites,
        });
        
        if (VERBOSE_DEBUG) console.log("✅ Rule added successfully:", newRule);
      })
      .catch((err) => {
        console.error("❌ Error adding rule:", err);
        // Revert optimistic update on error
        const { rules } = get();
        const revertedRules = rules.filter(rule => rule.id !== tempRule.id);
        
        set({ 
          rules: revertedRules,
          hasPendingWrites: revertedRules.some(rule => rule.id > Date.now() - 10000),
        });
      });
  },

  updateRule: (id, updates) => {
    if (VERBOSE_DEBUG) console.log("🔄 Updating rule:", id, updates);

    const { rules } = get();
    const originalRule = rules.find(r => r.id === id);
    
    const updatedRules = rules.map((rule) =>
      rule.id === id ? { ...rule, ...updates } : rule
    );
    
    set({ 
      rules: updatedRules,
      hasPendingWrites: true,
    });

    const apiUrl = createApiUrl(`/rules/${id}`);

    fetch(apiUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
      .then((res) => res.json())
      .then((updatedRule) => {
        const { rules } = get();
        const finalRules = rules.map((rule) =>
          rule.id === id ? updatedRule : rule
        );
        
        set({ 
          rules: finalRules,
          hasPendingWrites: false,
        });
        
        if (VERBOSE_DEBUG) console.log("✅ Rule updated successfully:", updatedRule);
      })
      .catch((err) => {
        console.error("❌ Error updating rule:", err);
        // Revert to original on error
        if (originalRule) {
          const { rules } = get();
          const revertedRules = rules.map((rule) =>
            rule.id === id ? originalRule : rule
          );
          set({ 
            rules: revertedRules,
            hasPendingWrites: false,
          });
        }
      });
  },

  deleteRule: (id) => {
    if (VERBOSE_DEBUG) console.log("🗑️ Deleting rule:", id);

    const { rules } = get();
    const originalRules = [...rules];
    const filteredRules = rules.filter((rule) => rule.id !== id);
    
    set({ 
      rules: filteredRules,
      hasPendingWrites: true,
    });

    const apiUrl = createApiUrl(`/rules/${id}`);

    fetch(apiUrl, { method: "DELETE" })
      .then(() => {
        set({ hasPendingWrites: false });
        if (VERBOSE_DEBUG) console.log("✅ Rule deleted successfully");
      })
      .catch((err) => {
        console.error("❌ Error deleting rule:", err);
        // Revert deletion on error
        set({ 
          rules: originalRules,
          hasPendingWrites: false,
        });
      });
  },
}));

// Listen for user data loaded events
eventBus.on<UserDataLoadedEvent>('user-data-loaded', (data) => {
  useRulesStore.getState().setRules(data.rules);
});

// Listen for auth status changes
eventBus.on<AuthStatusChangedEvent>('auth-status-changed', (data) => {
  if (!data.isAuthenticated) {
    useRulesStore.getState().clearRules();
  }
});

export const useRules = () => {
  const rules = useRulesStore((state) => state.rules);
  const hasPendingWrites = useRulesStore((state) => state.hasPendingWrites);
  const addRule = useRulesStore((state) => state.addRule);
  const updateRule = useRulesStore((state) => state.updateRule);
  const deleteRule = useRulesStore((state) => state.deleteRule);
  
  return React.useMemo(
    () => ({ 
      // Clean, simple API
      rules,
      addRule,
      updateRule,
      deleteRule,
      
      // Debug/sync state (for developer use)
      hasPendingWrites,
    }),
    [rules, addRule, updateRule, deleteRule, hasPendingWrites]
  );
};
