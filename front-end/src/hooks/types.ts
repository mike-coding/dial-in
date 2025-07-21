export type Page = "Tasks" | "Calendar" | "Rules" | "Categories" | "Users" | "Dashboard";

export interface Category {
  id: number;
  name: string;
  description?: string;
  user_id: number;
  created_at: string;
}

export interface Rule {
  id: number;
  name: string;
  description?: string;
  category_id?: number; // Now optional
  user_id: number; // Add user_id
  rate_pattern: string;
  is_active: boolean;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  category_id: number | null; // Allow null category
  rule_id?: number;
  user_id: number;
  is_completed: boolean;
  due_date?: string;
  created_at: string;
  completed_at?: string;
}

export interface Event {
  id: number;
  title: string;
  description?: string;
  category_id: number | null; // Allow null category
  rule_id?: number;
  user_id: number;
  start_time: string;
  end_time?: string;
  created_at: string;
}

export interface UserData {
  id: number;
  username: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
}

// Loading state types for React Query-style API
export interface QueryState<T> {
  data: T;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  isFetching: boolean;
  refetch: () => Promise<void>;
}

export interface MutationState {
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

// Data loading coordination state
export interface DataLoadingState {
  isInitialLoad: boolean;
  loadedDomains: Set<string>;
  failedDomains: Set<string>;
  lastLoadTime: number | null;
}
