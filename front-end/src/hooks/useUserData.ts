import { create } from 'zustand';
import React from 'react';
import { UserPreferences, UserPreferencesUpdate } from './types';
import { createApiUrl } from './apiConfig';

// Verbose flag for debug logging
const VERBOSE_DEBUG = false;

interface UserDataStore {
  userData: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
  
  // Core user data methods
  loadUserData: (userId: number) => Promise<void>;
  updateUserData: (userId: number, updates: UserPreferencesUpdate) => Promise<void>;
  setUserData: (userData: UserPreferences | null) => void;
}

export const useUserDataStore = create<UserDataStore>((set) => ({
  userData: null,
  isLoading: false,
  error: null,

  loadUserData: async (userId: number) => {
    if (VERBOSE_DEBUG) console.log("🔄 Loading user data for user:", userId);
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(createApiUrl(`/user_data/${userId}`), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load user data: ${response.statusText}`);
      }

      const userData = await response.json();
      
      if (VERBOSE_DEBUG) console.log("✅ User data loaded:", userData);
      
      set({ 
        userData: userData,
        isLoading: false,
        error: null 
      });
      
    } catch (error) {
      console.error("❌ Error loading user preferences:", error);
      set({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load user preferences'
      });
    }
  },

  updateUserData: async (userId: number, updates: UserPreferencesUpdate) => {
    if (VERBOSE_DEBUG) console.log("🔄 Updating user data:", updates);
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(createApiUrl(`/user_data/${userId}`), {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update user data: ${response.statusText}`);
      }

      const updatedUserData = await response.json();
      
      if (VERBOSE_DEBUG) console.log("✅ User data updated:", updatedUserData);
      
      set({ 
        userData: updatedUserData,
        isLoading: false,
        error: null 
      });
      
    } catch (error) {
      console.error("❌ Error updating user data:", error);
      set({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update user data'
      });
    }
  },

  setUserData: (userData: UserPreferences | null) => {
    if (VERBOSE_DEBUG) console.log("Setting user data:", userData);
    set({ userData });
  }
}));

export const useUserData = () => {
  const userData = useUserDataStore((state) => state.userData);
  const isLoading = useUserDataStore((state) => state.isLoading);
  const error = useUserDataStore((state) => state.error);
  const loadUserData = useUserDataStore((state) => state.loadUserData);
  const updateUserData = useUserDataStore((state) => state.updateUserData);
  const setUserData = useUserDataStore((state) => state.setUserData);
  
  return React.useMemo(
    () => ({ 
      userData,
      isLoading,
      error,
      loadUserData,
      updateUserData,
      setUserData
    }),
    [userData, isLoading, error, loadUserData, updateUserData, setUserData]
  );
};
