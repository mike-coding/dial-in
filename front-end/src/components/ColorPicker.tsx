import React, { useEffect, useRef, useState } from "react";

const COLOR_OPTIONS = [
  "#64748b",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#6366f1",
  "#a855f7",
  "#ec4899",
];

interface ColorPickerProps {
  value?: string | null;
  fallbackColor?: string | null;
  onChange: (color: string | null) => void;
  disabled?: boolean;
  showClear?: boolean;
  clearLabel?: string;
  ariaLabel?: string;
  buttonClassName?: string;
}

const normalizeColor = (color?: string | null) =>
  typeof color === "string" && /^#[0-9a-fA-F]{6}$/.test(color.trim())
    ? color.trim().toLowerCase()
    : "";

const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  fallbackColor,
  onChange,
  disabled = false,
  showClear = false,
  clearLabel = "Inherit",
  ariaLabel = "Select color",
  buttonClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const normalizedValue = normalizeColor(value);
  const normalizedFallback = normalizeColor(fallbackColor);
  const displayedColor = normalizedValue || normalizedFallback || "#9ca3af";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const handleSelect = (color: string | null) => {
    onChange(color);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-flex" ref={pickerRef} data-action="color-picker">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (!disabled) {
            setIsOpen((current) => !current);
          }
        }}
        disabled={disabled}
        className={
          buttonClassName ||
          `flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
            disabled ? "cursor-default" : "cursor-pointer hover:bg-gray-100"
          }`
        }
        aria-label={ariaLabel}
      >
        <span
          className="block h-5 w-5 rounded-full border-2 border-white shadow ring-1 ring-gray-300"
          style={{ backgroundColor: displayedColor }}
        />
      </button>

      {isOpen && !disabled ? (
        <div
          className="absolute left-0 top-full z-50 mt-2 w-44 rounded-md border border-gray-200 bg-white p-2 shadow-lg"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="grid grid-cols-5 gap-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleSelect(color)}
                className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                  normalizedValue === color ? "border-gray-800" : "border-white"
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select ${color}`}
              />
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="color"
              value={normalizedValue || displayedColor}
              onChange={(event) => handleSelect(event.target.value)}
              className="h-8 w-10 cursor-pointer rounded border border-gray-200 bg-white p-0"
              aria-label="Custom color"
            />

            {showClear ? (
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className="flex-1 rounded-md px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
              >
                {clearLabel}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ColorPicker;
