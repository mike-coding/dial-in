import React, { useMemo, useState } from 'react';
import {
  DEFAULT_DERIVED_FIELD_STYLE_TUNING,
  DerivedFieldStyleTuning,
  getColoredSurfaceStyle,
  getDerivedFieldStyle,
} from '../utils/presentationResolver';
import ColorPicker from './ColorPicker';
import WindowsEmoji from './WindowsEmoji';

const NUMERIC_KNOBS: Array<{
  key: keyof Pick<
    DerivedFieldStyleTuning,
    | 'cardBackgroundMix'
    | 'mutedCardBackgroundMix'
    | 'cardTextMix'
    | 'mutedCardTextMix'
    | 'cardBorderMix'
    | 'mutedCardBorderMix'
    | 'fieldBackgroundMix'
    | 'fieldHoverBackgroundMix'
    | 'selectedFieldBackgroundMix'
    | 'selectedFieldHoverBackgroundMix'
    | 'mutedFieldBackgroundMix'
    | 'mutedFieldHoverBackgroundMix'
    | 'focusRingMix'
  >;
  label: string;
}> = [
  { key: 'cardBackgroundMix', label: 'Card background' },
  { key: 'mutedCardBackgroundMix', label: 'Muted card background' },
  { key: 'cardTextMix', label: 'Card text' },
  { key: 'mutedCardTextMix', label: 'Muted card text' },
  { key: 'cardBorderMix', label: 'Card border' },
  { key: 'mutedCardBorderMix', label: 'Muted card border' },
  { key: 'fieldBackgroundMix', label: 'Field background' },
  { key: 'fieldHoverBackgroundMix', label: 'Field hover background' },
  { key: 'selectedFieldBackgroundMix', label: 'Selected field background' },
  { key: 'selectedFieldHoverBackgroundMix', label: 'Selected field hover background' },
  { key: 'mutedFieldBackgroundMix', label: 'Muted field background' },
  { key: 'mutedFieldHoverBackgroundMix', label: 'Muted field hover background' },
  { key: 'focusRingMix', label: 'Focus ring mix' },
];

const COLOR_KNOBS: Array<{
  key: keyof Pick<
    DerivedFieldStyleTuning,
    | 'targetColor'
    | 'textTargetColor'
    | 'mutedTextTargetColor'
    | 'fallbackBackground'
    | 'fallbackSelectedBackground'
    | 'fallbackHoverBackground'
    | 'fallbackSelectedHoverBackground'
    | 'fallbackFocusRing'
  >;
  label: string;
}> = [
  { key: 'targetColor', label: 'Target mix color' },
  { key: 'textTargetColor', label: 'Text target color' },
  { key: 'mutedTextTargetColor', label: 'Muted text target color' },
  { key: 'fallbackBackground', label: 'Fallback bg' },
  { key: 'fallbackSelectedBackground', label: 'Fallback selected bg' },
  { key: 'fallbackHoverBackground', label: 'Fallback hover bg' },
  { key: 'fallbackSelectedHoverBackground', label: 'Fallback selected hover bg' },
  { key: 'fallbackFocusRing', label: 'Fallback focus ring' },
];

const DebugColorInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <label className="grid grid-cols-[minmax(0,1fr)_5rem] items-center gap-3 text-sm text-gray-700">
    <span className="truncate">{label}</span>
    <input
      type="color"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 w-20 cursor-pointer rounded border border-gray-200 bg-white p-0"
    />
  </label>
);

const DerivedFieldStyleDebug: React.FC = () => {
  const [tuning, setTuning] = useState<DerivedFieldStyleTuning>(DEFAULT_DERIVED_FIELD_STYLE_TUNING);
  const [ruleColor, setRuleColor] = useState('#0ea5e9');
  const [isActive, setIsActive] = useState(true);
  const [useRuleColor, setUseRuleColor] = useState(true);
  const effectiveColor = useRuleColor ? ruleColor : null;
  const muted = !isActive;
  const cardStyle = getColoredSurfaceStyle(effectiveColor || undefined, {
    muted,
    fallbackBackground: muted ? '#f9fafb' : '#ffffff',
    fallbackTextColor: muted ? '#6b7280' : undefined,
  }, tuning);
  const fieldStyle = getDerivedFieldStyle(effectiveColor, { muted }, tuning);
  const selectedFieldStyle = getDerivedFieldStyle(effectiveColor, { muted, selected: true }, tuning);

  const constantsText = useMemo(
    () =>
      `export const DEFAULT_DERIVED_FIELD_STYLE_TUNING: DerivedFieldStyleTuning = ${JSON.stringify(
        tuning,
        null,
        2
      )};`,
    [tuning]
  );

  const setNumericKnob = (key: (typeof NUMERIC_KNOBS)[number]['key'], value: number) => {
    setTuning((current) => ({ ...current, [key]: value }));
  };

  const setColorKnob = (key: (typeof COLOR_KNOBS)[number]['key'], value: string) => {
    setTuning((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="min-h-full bg-gray-200/60 p-6 text-gray-900">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h1 className="text-xl font-semibold">Derived Field Tuner</h1>
            <div className="flex items-center gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={useRuleColor} onChange={(event) => setUseRuleColor(event.target.checked)} />
                Rule color
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
                Active
              </label>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm font-medium">Preview color</span>
            <ColorPicker value={ruleColor} onChange={(color) => color && setRuleColor(color)} ariaLabel="Preview color" />
            <span className="font-mono text-sm text-gray-600">{ruleColor}</span>
          </div>

          <div className="rounded-md border-l-4 bg-gray-100 transition-all duration-200" style={cardStyle}>
            <div className="min-w-0 px-4 py-2">
              <div className={`grid min-h-10 min-w-0 grid-cols-[2.5rem_minmax(0,1fr)_2rem] items-center gap-4 ${muted ? 'opacity-60' : ''}`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100">
                  <WindowsEmoji emoji="⚙️" size={24} />
                </div>
                <input
                  value="Expanded debug rule"
                  readOnly
                  className="derived-field w-full text-lg rounded-md outline-none transition-all duration-200 px-2 py-1 text-current"
                  style={fieldStyle}
                />
                <div className="flex h-8 w-8 items-center justify-center">
                  <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="px-4 pb-4 text-current">
              <div className="pt-4 space-y-4">
                <textarea
                  value="Description field using derived field colors."
                  readOnly
                  rows={3}
                  className="derived-field w-full px-3 py-2 rounded-md focus:outline-none resize-none text-current"
                  style={fieldStyle}
                />

                <button
                  type="button"
                  className="derived-field w-full px-3 py-2 rounded-md text-left flex items-center justify-between transition-colors"
                  style={fieldStyle}
                >
                  <span className="flex items-center gap-2">
                    <img src={isActive ? '/svg/active.svg' : '/svg/inactive.svg'} alt="" className="h-5 w-5" />
                    <span>{isActive ? 'Active' : 'Inactive'}</span>
                  </span>
                  <span className="text-xs opacity-70">{isActive ? 'Generating tasks' : 'Paused'}</span>
                </button>

                <div className="grid gap-3 sm:grid-cols-[2.5rem_minmax(0,1fr)]">
                  <div>
                    <label className="block text-sm font-medium mb-1">Color</label>
                    <div className="derived-field flex h-10 w-10 items-center justify-center rounded-md" style={fieldStyle}>
                      <span className="block h-6 w-6 rounded-sm" style={{ backgroundColor: ruleColor }} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Project</label>
                    <button
                      type="button"
                      className="derived-field w-full px-3 py-2 rounded-md text-left flex items-center justify-between transition-colors"
                      style={fieldStyle}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <WindowsEmoji emoji="📁" size={18} />
                        <span className="truncate">Debug Project</span>
                      </span>
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="derived-surface rounded-md p-3 space-y-4" style={selectedFieldStyle}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">Every weekday at 9:00 AM</span>
                    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {['Daily', 'Weekly', 'Monthly', 'Weekday', 'Yearly'].map((label, index) => (
                      <button
                        key={label}
                        type="button"
                        className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                          index === 1 ? 'bg-white/70 border-gray-600/20' : 'bg-white/30 border-white/50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-md bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Mix Knobs</h2>
              <button
                type="button"
                onClick={() => setTuning(DEFAULT_DERIVED_FIELD_STYLE_TUNING)}
                className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium hover:bg-gray-200"
              >
                Reset
              </button>
            </div>
            <div className="space-y-3">
              {NUMERIC_KNOBS.map(({ key, label }) => (
                <label key={key} className="block text-sm text-gray-700">
                  <div className="mb-1 flex justify-between gap-3">
                    <span>{label}</span>
                    <span className="font-mono">{tuning[key].toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={tuning[key]}
                    onChange={(event) => setNumericKnob(key, Number(event.target.value))}
                    className="w-full"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-md bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold">Fallback Colors</h2>
            <div className="space-y-3">
              {COLOR_KNOBS.map(({ key, label }) => (
                <DebugColorInput key={key} label={label} value={tuning[key]} onChange={(value) => setColorKnob(key, value)} />
              ))}
            </div>
          </div>

          <div className="rounded-md bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold">Current Constants</h2>
            <textarea readOnly value={constantsText} rows={12} className="w-full resize-none rounded-md bg-gray-100 p-3 font-mono text-xs" />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DerivedFieldStyleDebug;
