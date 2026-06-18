import React, { useEffect, useRef, useState } from "react";
import { sharedEmojiOptions } from "../utils/sharedEmojiOptions";
import WindowsEmoji from "./WindowsEmoji";

interface EmojiIconPickerProps {
  value?: string | null;
  fallbackIcon?: string;
  onChange: (icon: string | null) => void;
  ariaLabel?: string;
  buttonClassName?: string;
  className?: string;
  disabled?: boolean;
  emojiSize?: number;
  showClear?: boolean;
}

const EmojiIconPicker: React.FC<EmojiIconPickerProps> = ({
  value,
  fallbackIcon = "📂",
  onChange,
  ariaLabel = "Select icon",
  buttonClassName,
  className = "",
  disabled = false,
  emojiSize = 24,
  showClear = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const selectedIcon = value?.trim() || "";
  const displayIcon = selectedIcon || fallbackIcon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  return (
    <div className={`relative flex items-center gap-2 ${className}`} ref={pickerRef}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(event) => {
            if (disabled) {
              return;
            }
            event.stopPropagation();
            setIsOpen((current) => !current);
          }}
          className={
            buttonClassName ||
            `flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
              disabled ? "cursor-default" : "cursor-pointer hover:bg-gray-100"
            }`
          }
          aria-label={ariaLabel}
        >
          <WindowsEmoji emoji={displayIcon} size={emojiSize} />
        </button>

      </div>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 max-h-60 w-80 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <div className="grid grid-cols-10 gap-2">
            {showClear && selectedIcon && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onChange(null);
                  setIsOpen(false);
                }}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-gray-100 text-gray-600 hover:bg-blue-100 transition-colors"
                title="Use inherited icon"
                aria-label="Use inherited icon"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {sharedEmojiOptions.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onChange(emoji);
                  setIsOpen(false);
                }}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded hover:bg-blue-100 transition-colors"
                title={emoji}
              >
                <WindowsEmoji emoji={emoji} size={20} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiIconPicker;
