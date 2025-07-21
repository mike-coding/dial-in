import React, { useState } from "react";

const Categories: React.FC = () => {
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCategory = () => {
    if (newCategoryName.trim() === '') return;
    // TODO: Add category logic
    setNewCategoryName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCategory();
    }
  };

  return (
    <div className="">
      <div className="w-full max-w-full px-4 mx-auto pt-4">
        
        {/* Add Category Input */}
        <div className="mb-6">
          <div className="bg-white/90 rounded-sm shadow-sm border border-gray-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <div 
                onClick={handleAddCategory}
                className="w-10 h-10 flex items-center justify-center cursor-pointer transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a new category..."
                className="flex-1 text-gray-700 placeholder-gray-400 bg-transparent border-none outline-none text-lg"
              />
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="space-y-3">
          <div className="text-center py-12">
            <div className="text-6xl mb-4 opacity-50">🏷️</div>
            <p className="text-gray-500 text-lg">No categories yet</p>
            <p className="text-gray-400 text-sm mt-1">Add one above to get started!</p>
          </div>
        </div>

        {/* Bottom spacing for mobile navigation */}
        <div className="h-16"></div>
      </div>
    </div>
  );
};

export default Categories;
