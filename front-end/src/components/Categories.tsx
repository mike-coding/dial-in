import React, { useState, useRef, useEffect } from "react";
import { useCategories } from "../hooks/useCategories";
import WindowsEmoji from "./WindowsEmoji";
import Category from "./Category";
import { sharedEmojiOptions } from "../utils/sharedEmojiOptions";

const Categories: React.FC = () => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📂');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { categories, addCategory, deleteCategory, updateCategory } = useCategories();
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const emojiOptions = sharedEmojiOptions;

  const handleAddCategory = () => {
    if (newCategoryName.trim() === '') return;
    
    addCategory({
      name: newCategoryName.trim(),
      icon: selectedEmoji,
    });
    
    setNewCategoryName('');
    setSelectedEmoji('📂');
    setShowEmojiPicker(false);
  };

  const handleDeleteCategory = (id: number) => {
    deleteCategory(id);
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
        <div className="mb-6 relative" ref={emojiPickerRef}>
          <div className="bg-white rounded-md px-4 py-3">
            <div className="flex items-center gap-3">
              <div 
                onClick={handleAddCategory}
                className="w-10 h-10 flex items-center justify-center cursor-pointer transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              
              {/* Emoji Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <WindowsEmoji emoji={selectedEmoji} size={24} />
                </button>
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
          
          {/* Emoji Picker Dropdown - positioned relative to container */}
          {showEmojiPicker && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 max-h-60 overflow-y-auto">
              <div className="grid grid-cols-10 gap-2">
                {emojiOptions.map((emoji, index) => (
                  <button
                    key={`${emoji}-${index}`}
                    onClick={() => {
                      setSelectedEmoji(emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center hover:bg-blue-100 rounded transition-colors flex-shrink-0"
                    title={emoji}
                  >
                    <WindowsEmoji emoji={emoji} size={20} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Categories List */}
        <div className="space-y-3">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4 opacity-50 flex justify-center">
                <WindowsEmoji emoji="🏷️" size={72} />
              </div>
              <p className="text-gray-500 text-lg">No categories yet</p>
              <p className="text-gray-400 text-sm mt-1">Add one above to get started!</p>
            </div>
          ) : (
            categories.map((category) => (
              <Category
                key={category.id}
                category={category}
                onDelete={handleDeleteCategory}
                onUpdate={updateCategory}
              />
            ))
          )}
        </div>

        {/* Bottom spacing for mobile navigation */}
        <div className="h-16"></div>
      </div>
    </div>
  );
};

export default Categories;
