import { create } from 'zustand';
import React from 'react';
import { UserData, AuthState, LoginCredentials, RegisterCredentials, DataLoadingState } from './types';
import { eventBus, UserDataLoadedEvent, AuthStatusChangedEvent, DataLoadingEvent } from './eventBus';

// Verbose flag for debug logging
const VERBOSE_DEBUG = false;

interface UserDataStore {
  userData: UserData | null;
  authState: AuthState;
  dataLoadingState: DataLoadingState;
  
  // Core user data methods
  setUserData: (userData: UserData | null) => void;
  updateUserData: (changes: Partial<UserData>) => void;
  
  // Authentication methods
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
  
  // Data loading coordination
  loadUserData: (userId: number) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

export const useUserDataStore = create<UserDataStore>((set, get) => ({
  userData: null,
  authState: {
    isAuthenticated: false,
    isLoading: false,
    error: null,
  },
  dataLoadingState: {
    isInitialLoad: false,
    loadedDomains: new Set(),
    failedDomains: new Set(),
    lastLoadTime: null,
  },
  
  setUserData: (userData) => {
    if (VERBOSE_DEBUG) console.log("setUserData in Zustand", performance.now());
    set({ 
      userData,
      authState: { 
        ...get().authState, 
        isAuthenticated: !!userData 
      }
    });
    
    // Emit auth status change event
    eventBus.emit<AuthStatusChangedEvent>('auth-status-changed', {
      isAuthenticated: !!userData,
      userData,
    });
  },
  
  updateUserData: (changes) => {
    const { userData } = get();
    if (!userData) {
      console.error("❌ updateUserData called but userData is null!");
      return;
    }
    
    if (!userData.id) {
      console.error("❌ userData exists but id is missing:", userData);
      return;
    }
    
    const updatedUserData = { ...userData, ...changes };
    
    if (VERBOSE_DEBUG) {
      console.log("🔄 OPTIMISTIC UPDATE - Before:", userData);
      console.log("🔄 OPTIMISTIC UPDATE - Changes:", changes);
      console.log("🔄 OPTIMISTIC UPDATE - After:", updatedUserData);
    }
    
    // Perform optimistic update
    set({ userData: updatedUserData });

    const currentHost = window.location.hostname;
    const apiUrl = `http://${currentHost}:5000/userdata/${userData.id}`;

    fetch(apiUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedUserData),
    })
      .then((res) => res.json())
      .then((serverData) => {
        set({ userData: serverData });
        if (VERBOSE_DEBUG) console.log("✅ User data updated successfully");
      })
      .catch((err) => {
        console.error("Error updating userData:", err);
        // Revert optimistic update
        set({ userData });
        set({ 
          authState: { 
            ...get().authState, 
            error: "Failed to update user data" 
          }
        });
      });
  },

  loadUserData: async (userId) => {
    if (VERBOSE_DEBUG) console.log("🔄 Loading all user data for user:", userId);
    
    // Set loading state
    set({
      dataLoadingState: {
        isInitialLoad: true,
        loadedDomains: new Set(),
        failedDomains: new Set(),
        lastLoadTime: Date.now(),
      }
    });
    
    const currentHost = window.location.hostname;
    const domains = ['categories', 'tasks', 'events', 'rules'];
    
    try {
      // Emit loading events for each domain
      domains.forEach(domain => {
        eventBus.emit<DataLoadingEvent>('data-loading', {
          userId,
          domain,
          status: 'loading'
        });
      });

      // Load all user data in parallel
      const [categoriesRes, tasksRes, eventsRes, rulesRes] = await Promise.all([
        fetch(`http://${currentHost}:5000/users/${userId}/categories`),
        fetch(`http://${currentHost}:5000/users/${userId}/tasks`),
        fetch(`http://${currentHost}:5000/users/${userId}/events`),
        fetch(`http://${currentHost}:5000/users/${userId}/rules`),
      ]);

      // Parse all responses
      const [categories, tasks, events, rules] = await Promise.all([
        categoriesRes.json(),
        tasksRes.json(),
        eventsRes.json(),
        rulesRes.json(),
      ]);

      // Emit user data loaded event instead of direct store manipulation
      eventBus.emit<UserDataLoadedEvent>('user-data-loaded', {
        userId,
        categories,
        tasks,
        events,
        rules,
      });

      // Update loading state
      set({
        dataLoadingState: {
          isInitialLoad: false,
          loadedDomains: new Set(domains),
          failedDomains: new Set(),
          lastLoadTime: Date.now(),
        }
      });

      if (VERBOSE_DEBUG) {
        console.log("✅ All user data loaded:", {
          categories: categories.length,
          tasks: tasks.length,
          events: events.length,
          rules: rules.length,
        });
      }
    } catch (error) {
      console.error("❌ Failed to load user data:", error);
      
      // Emit error events
      domains.forEach(domain => {
        eventBus.emit<DataLoadingEvent>('data-loading', {
          userId,
          domain,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      });
      
      set({ 
        authState: { 
          ...get().authState, 
          error: "Failed to load user data" 
        },
        dataLoadingState: {
          isInitialLoad: false,
          loadedDomains: new Set(),
          failedDomains: new Set(domains),
          lastLoadTime: Date.now(),
        }
      });
    }
  },

  refreshUserData: async () => {
    const { userData } = get();
    if (userData) {
      await get().loadUserData(userData.id);
    }
  },

  login: async (credentials) => {
    const { authState } = get();
    set({ 
      authState: { 
        ...authState, 
        isLoading: true, 
        error: null 
      }
    });

    try {
      const currentHost = window.location.hostname;
      const response = await fetch(`http://${currentHost}:5000/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const userData = await response.json();
      
      set({ 
        userData,
        authState: {
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }
      });

      // Load all user data after successful login
      await get().loadUserData(userData.id);

      if (VERBOSE_DEBUG) console.log("✅ Login successful:", userData);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      set({ 
        userData: null,
        authState: {
          isAuthenticated: false,
          isLoading: false,
          error: errorMessage,
        }
      });
      console.error("❌ Login failed:", errorMessage);
      return false;
    }
  },

  register: async (credentials) => {
    const { authState } = get();
    set({ 
      authState: { 
        ...authState, 
        isLoading: true, 
        error: null 
      }
    });

    try {
      const currentHost = window.location.hostname;
      const response = await fetch(`http://${currentHost}:5000/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Registration failed");
      }

      const userData = await response.json();
      
      set({ 
        userData,
        authState: {
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }
      });

      // Load user data after registration (probably empty for new users)
      await get().loadUserData(userData.id);

      if (VERBOSE_DEBUG) console.log("✅ Registration successful:", userData);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      set({ 
        userData: null,
        authState: {
          isAuthenticated: false,
          isLoading: false,
          error: errorMessage,
        }
      });
      console.error("❌ Registration failed:", errorMessage);
      return false;
    }
  },

  logout: () => {
    // Emit logout event instead of direct store manipulation
    eventBus.emit<AuthStatusChangedEvent>('auth-status-changed', {
      isAuthenticated: false,
      userData: null,
    });
    
    set({ 
      userData: null,
      authState: {
        isAuthenticated: false,
        isLoading: false,
        error: null,
      },
      dataLoadingState: {
        isInitialLoad: false,
        loadedDomains: new Set(),
        failedDomains: new Set(),
        lastLoadTime: null,
      }
    });
    if (VERBOSE_DEBUG) console.log("✅ Logout successful - all data cleared");
  },

  checkAuthStatus: async () => {
    const { authState } = get();
    set({ 
      authState: { 
        ...authState, 
        isLoading: true 
      }
    });

    try {
      const currentHost = window.location.hostname;
      const response = await fetch(`http://${currentHost}:5000/me`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const userData = await response.json();
        set({ 
          userData,
          authState: {
            isAuthenticated: true,
            isLoading: false,
            error: null,
          }
        });
        
        // Load user data if authenticated
        await get().loadUserData(userData.id);
      } else {
        throw new Error("Not authenticated");
      }
    } catch (error) {
      set({ 
        userData: null,
        authState: {
          isAuthenticated: false,
          isLoading: false,
          error: null,
        }
      });
    }
  },
}));

export const useUserData = () => {
  const userData = useUserDataStore((state) => state.userData);
  const authState = useUserDataStore((state) => state.authState);
  const dataLoadingState = useUserDataStore((state) => state.dataLoadingState);
  const setUserData = useUserDataStore((state) => state.setUserData);
  const updateUserData = useUserDataStore((state) => state.updateUserData);
  const login = useUserDataStore((state) => state.login);
  const register = useUserDataStore((state) => state.register);
  const logout = useUserDataStore((state) => state.logout);
  const checkAuthStatus = useUserDataStore((state) => state.checkAuthStatus);
  const loadUserData = useUserDataStore((state) => state.loadUserData);
  const refreshUserData = useUserDataStore((state) => state.refreshUserData);
  
  return React.useMemo(
    () => ({ 
      userData, 
      authState,
      dataLoadingState,
      setUserData, 
      updateUserData,
      login,
      register,
      logout,
      checkAuthStatus,
      loadUserData,
      refreshUserData,
    }),
    [userData, authState, dataLoadingState, setUserData, updateUserData, login, register, logout, checkAuthStatus, loadUserData, refreshUserData]
  );
};
