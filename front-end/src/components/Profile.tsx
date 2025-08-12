import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/AppContext';

interface ProfileProps {
  isMobile?: boolean;
}

const Profile: React.FC<ProfileProps> = ({ isMobile = false }) => {
  const { userData, logout, updateUserData } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: userData?.username || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Update form data when user data changes
  useEffect(() => {
    if (userData) {
      setFormData({
        username: userData.username || '',
      });
    }
  }, [userData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!userData) return;

    setIsSaving(true);
    setMessage(null);

    try {
      updateUserData({
        username: formData.username,
      });
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update profile' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (userData) {
      setFormData({
        username: userData.username || '',
      });
    }
    setIsEditing(false);
    setMessage(null);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl">
      <div className={`w-full ${isMobile ? 'max-w-full px-4' : 'max-w-2xl'} mx-auto ${isMobile ? 'pt-4' : 'pt-8'}`}>
        
        {/* Profile Header */}
        <div className="mb-8 text-center">
          <div className="w-20 h-20 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-lg backdrop-brightness-105 backdrop-saturate-70 backdrop-contrast-100">
            <div className="text-2xl font-bold text-gray-800">
              {(formData.username?.[0] || 'U').toUpperCase()}
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-md backdrop-blur-lg ${
            message.type === 'success' 
              ? 'bg-green-100/80 text-green-800 border border-green-200' 
              : 'bg-red-100/80 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-white/30 rounded-md border border-white/20 p-6 backdrop-blur-lg backdrop-brightness-105 backdrop-saturate-70 backdrop-contrast-100 mb-6">
          <div className="space-y-4">
            
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                  placeholder="Enter username"
                />
              ) : (
                <p className="text-gray-800 bg-gray-100/50 px-3 py-2 rounded-md">
                  {formData.username || 'Not set'}
                </p>
              )}
            </div>

            {/* User ID (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <p className="text-gray-800 bg-gray-100/50 px-3 py-2 rounded-md">
                {userData.id}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white/30 rounded-md border border-white/20 p-6 backdrop-blur-lg backdrop-brightness-105 backdrop-saturate-70 backdrop-contrast-100">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Account Actions</h3>
          
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </div>
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>User ID: {userData.id}</p>
        </div>

        {/* Bottom spacing for mobile navigation */}
        {isMobile && <div className="h-16"></div>}
      </div>
    </div>
  );
};

export default Profile;
