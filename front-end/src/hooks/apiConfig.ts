// Centralized API Configuration
const getApiBaseUrl = (): string => {
  const hostname = window.location.hostname;
  
  // Development environments (local development)
  if (hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname.startsWith('192.168.') || 
      hostname.startsWith('10.') || 
      hostname.startsWith('172.')) {
    // Development: Use local backend
    return `http://${hostname}:5000`;
  }
  
  // Production: Railway uses HTTPS and no custom port
  return 'https://dial-in-production-0132.up.railway.app';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function for making API calls with the base URL
export const createApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};
