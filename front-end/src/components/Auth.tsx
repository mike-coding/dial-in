import React, { useState } from 'react';
import { useUser } from '../hooks/AppContext';
import { getVersionString } from '../utils/version';

interface AuthProps {
  isMobile?: boolean;
}

const Auth: React.FC<AuthProps> = ({ isMobile = false }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, register, authState } = useUser();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let success = false;
      
      if (isLoginMode) {
        success = await login(formData);
        if (!success) {
          setError('Invalid username or password');
        }
      } else {
        success = await register(formData);
        if (!success) {
          setError('Registration failed. Username may already exist.');
        }
      }
    } catch (err) {
      setError(isLoginMode ? 'Login failed' : 'Registration failed');
      console.error('Auth error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError(null);
    setFormData({
      username: '',
      password: '',
    });
  };

  const containerClasses = isMobile 
    ? "h-full w-full px-6 py-8" 
    : "h-full w-full flex items-center justify-center px-4";

  const cardClasses = isMobile
    ? "h-full w-full flex flex-col flex flex-col justify-between pt-4"
    : "h-full w-full max-w-md";

  return (
    <div className={`bg-gray-100 ${containerClasses}`}>
      <div className={cardClasses}>
        {/* Header */}
        <div className="flex flex-row justify-center text-center h-1/10">
          <div className="flex flex-row items-center justify-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">
              DIAL_IN
            </h1>
            <div className="flex flex-row text-sm text-gray-500 font-medium h-full items-end pb-2.5">{getVersionString()}</div>
          </div>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 text-center">
              {isLoginMode ? 'Sign In' : 'Sign Up'}
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {authState.error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {authState.error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                placeholder="Enter your username"
                disabled={isSubmitting || authState.isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                placeholder="Enter your password"
                disabled={isSubmitting || authState.isLoading}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || authState.isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting || authState.isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isLoginMode ? 'Signing In...' : 'Creating Account...'}
                  </div>
                ) : (
                  isLoginMode ? 'Sign In' : 'Create Account'
                )}
              </button>
            </div>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors underline"
              disabled={isSubmitting || authState.isLoading}
            >
              {isLoginMode 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>© 2025 DIAL_IN</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
