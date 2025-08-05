import React from 'react';

interface WindowsEmojiProps {
  emoji: string;
  size?: number;
  className?: string;
}

const WindowsEmoji: React.FC<WindowsEmojiProps> = ({ 
  emoji, 
  size = 24, 
  className = "" 
}) => {
  return (
    <span 
      className={`inline-block ${className}`}
      style={{ 
        fontFamily: '"Segoe UI Emoji"',
        fontSize: `${size}px`, 
        lineHeight: '1', 
        verticalAlign: 'middle'
      }}
    >
      {emoji}
    </span>
  );
};

export default WindowsEmoji;
