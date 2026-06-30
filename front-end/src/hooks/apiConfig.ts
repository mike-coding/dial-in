// Centralized API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Helper function for making API calls with the base URL
export const createApiUrl = (endpoint: string): string => {
  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
};
