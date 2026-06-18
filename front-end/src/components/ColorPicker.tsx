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
  fieldSize?: boolean;
}

const normalizeColor = (color?: string | null) =>
  typeof color === "string" && /^#[0-9a-fA-F]{6}$/.test(color.trim())
    ? color.trim().toLowerCase()
    : "";

const darkenColor = (color: string, amount = 36) => {
  const red = Math.max(0, parseInt(color.slice(1, 3), 16) - amount);
  const green = Math.max(0, parseInt(color.slice(3, 5), 16) - amount);
  const blue = Math.max(0, parseInt(color.slice(5, 7), 16) - amount);
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
};

const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  fallbackColor,
  onChange,
  disabled = false,
  showClear = false,
  clearLabel = "Inherit",
  ariaLabel = "Select color",
  buttonClassName,
  fieldSize = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const normalizedValue = normalizeColor(value);
  const normalizedFallback = normalizeColor(fallbackColor);
  const displayedColor = normalizedValue || normalizedFallback || "#9ca3af";
  const displayedBorderColor = darkenColor(displayedColor);

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
          `flex items-center rounded-md transition-colors ${
            fieldSize ? "h-10 w-10 justify-center bg-gray-400/10" : "h-8 w-8 justify-center"
          } ${disabled ? "cursor-default" : "cursor-pointer hover:bg-gray-100"}`
        }
        aria-label={ariaLabel}
      >
        <span
          className="block h-6 w-6 shrink-0 rounded-sm"
          style={{ backgroundColor: displayedColor, borderColor: displayedBorderColor }}
        />
      </button>

      {isOpen && !disabled ? (
        <div
          className={`absolute left-0 top-full z-50 mt-2 rounded-md border border-gray-200 bg-white p-2 shadow-lg ${
            fieldSize ? "w-44" : "w-44"
          }`
        }
          onClick={(event) => event.stopPropagation()}
        >
          <div className="grid grid-cols-5 gap-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleSelect(color)}
                className={`h-7 w-7 rounded-md border-2 transition-transform hover:scale-110 ${
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
