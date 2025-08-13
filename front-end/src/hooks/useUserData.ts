import { create } from 'zustand';
import React from 'react';
import { UserData, UserUpdate } from './types';
import { createApiUrl } from './apiConfig';
import { eventBus, UserDataLoadedEvent, AuthStatusChangedEvent } from './eventBus';

// Verbose flag for debug logging
const VERBOSE_DEBUG = false;

interface UserDataStore {
  userData: UserData | null;
  isLoading: boolean;
  error: string | null;
  
  // Core user data methods
  updateUserData: (userId: number, updates: UserUpdate) => void;
  setUserData: (userData: UserData | null) => void;
}

export const useUserDataStore = create<UserDataStore>((set, get) => ({
  userData: null,
  isLoading: false,
  error: null,

  updateUserData: (userId: number, updates: UserUpdate) => {
    if (VERBOSE_DEBUG) console.log("🔄 Updating user data:", updates);
    
    const { userData } = get();
    if (!userData) {
      console.error("❌ updateUserData called but userData is null!");
      return;
    }

    // Optimistic update - immediately update local state
    const updatedUserData = { ...userData, ...updates };
    set({ 
      userData: updatedUserData,
      isLoading: true, 
      error: null 
    });
    
    // Background network request
    fetch(createApiUrl(`/user_data/${userId}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to update user data: ${response.statusText}`);
      }
      return response.json();
    })
    .then(serverUserData => {
      if (VERBOSE_DEBUG) console.log("✅ User data updated successfully:", serverUserData);
      
      set({ 
        userData: serverUserData,
        isLoading: false,
        error: null 
      });
    })
    .catch(error => {
      console.error("❌ Error updating user data:", error);
      // Revert optimistic update on error
      set({ 
        userData: userData, // Revert to original
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update user data'
      });
    });
  },

  setUserData: (userData: UserData | null) => {
    if (VERBOSE_DEBUG) console.log("Setting user data:", userData);
    set({ userData });
  }
}));

// Listen for user data loaded events
eventBus.on<UserDataLoadedEvent>('user-data-loaded', (data) => {
  if (VERBOSE_DEBUG) console.log("📥 UserData received from event bus:", data.userData);
  useUserDataStore.getState().setUserData(data.userData);
});

// Listen for auth status changes
eventBus.on<AuthStatusChangedEvent>('auth-status-changed', (data) => {
  if (!data.isAuthenticated) {
    if (VERBOSE_DEBUG) console.log("🚫 User logged out, clearing user data");
    useUserDataStore.getState().setUserData(null);
  }
});

export const useUserData = () => {
  const userData = useUserDataStore((state) => state.userData);
  const isLoading = useUserDataStore((state) => state.isLoading);
  const error = useUserDataStore((state) => state.error);
  const updateUserData = useUserDataStore((state) => state.updateUserData);
  const setUserData = useUserDataStore((state) => state.setUserData);
  
  return React.useMemo(
    () => ({ 
      userData,
      isLoading,
      error,
      updateUserData,
      setUserData
    }),
    [userData, isLoading, error, updateUserData, setUserData]
  );
};
