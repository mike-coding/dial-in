import React, { useEffect, useMemo, useRef, useState } from "react";
import { Category } from "../../hooks/types";
import WindowsEmoji from "../WindowsEmoji";
import {
  createEmptySegment,
  frequencyOptions,
  getFieldChrome,
  getSegmentError,
  monthOptions,
  nextId,
  occurrenceOptions,
  summarizeRatePattern,
  weekdayOptions,
  encodeSegment,
  sortNumbers,
} from "./ruleUtils";
import { OccurrenceCode, RuleDraft, RuleSegment } from "./types";

interface RuleEditorProps {
  draft: RuleDraft;
  setDraft: React.Dispatch<React.SetStateAction<RuleDraft>>;
  categories: Category[];
  error: string | null;
  submitLabel: string;
  onSubmit: () => void;
  showSubmitButton?: boolean;
  showDeleteConfirm?: boolean;
  onDeleteRequest?: () => void;
  onDeleteConfirm?: (deleteChildren: boolean) => void;
  onDeleteCancel?: () => void;
}

const RuleEditor: React.FC<RuleEditorProps> = ({
  draft,
  setDraft,
  categories,
  error,
  submitLabel,
  onSubmit,
  showSubmitButton = true,
  showDeleteConfirm = false,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}) => {
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isDropdownAnimating, setIsDropdownAnimating] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const ratePattern = useMemo(
    () => draft.segments.map((segment) => encodeSegment(segment)).join("; "),
    [draft.segments]
  );
  const preview = useMemo(() => summarizeRatePattern(ratePattern), [ratePattern]);
  const selectedCategory = categories.find((category) => String(category.id) === draft.categoryId) || null;

  const closeDropdown = () => {
    setIsDropdownAnimating(true);
    setTimeout(() => {
      setIsCategoryDropdownOpen(false);
      setIsDropdownAnimating(false);
    }, 150);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    if (isCategoryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isCategoryDropdownOpen]);

  const setSegment = (segmentId: number, updater: (segment: RuleSegment) => RuleSegment) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      segments: currentDraft.segments.map((segment) => (segment.id === segmentId ? updater(segment) : segment)),
    }));
  };

  const toggleNumber = (values: number[], value: number) =>
    values.includes(value) ? values.filter((entry) => entry !== value) : sortNumbers([...values, value]);

  return (
    <div className="px-4 pb-4">
      <div className="pt-4 space-y-4">
        <div>
          <textarea
            value={draft.description}
            onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, description: event.target.value }))}
            rows={3}
            className="w-full px-3 py-2 bg-gray-400/10 rounded-md focus:outline-none focus:bg-gray-400/15 resize-none text-gray-800"
            placeholder="Description..."
          />
        </div>

        <div className="relative" ref={categoryDropdownRef}>
          <button
            type="button"
            onClick={() => {
              if (isCategoryDropdownOpen) {
                closeDropdown();
              } else {
                setIsCategoryDropdownOpen(true);
              }
            }}
            className="w-full px-3 py-2 bg-gray-400/10 rounded-md text-left flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              {selectedCategory ? (
                <>
                  <WindowsEmoji emoji={selectedCategory.icon || "📁"} size={18} />
                  <span className="text-gray-900">{selectedCategory.name}</span>
                </>
              ) : (
                <span className="text-gray-500">No category</span>
              )}
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isCategoryDropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {(isCategoryDropdownOpen || isDropdownAnimating) && (
            <div
              className={`absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden ${
                isDropdownAnimating
                  ? "animate-[dropdown-out_0.15s_ease-in_forwards]"
                  : "animate-[dropdown-in_0.15s_ease-out_forwards]"
              }`}
            >
              <div
                onClick={() => {
                  setDraft((currentDraft) => ({ ...currentDraft, categoryId: "" }));
                  closeDropdown();
                }}
                className={`px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors flex items-center gap-2 ${
                  !draft.categoryId ? "bg-blue-100 text-blue-900" : "text-gray-900"
                }`}
              >
                <WindowsEmoji emoji="📋" size={18} />
                <span>No category</span>
              </div>
              {categories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => {
                    setDraft((currentDraft) => ({ ...currentDraft, categoryId: String(category.id) }));
                    closeDropdown();
                  }}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors flex items-center gap-2 ${
                    String(category.id) === draft.categoryId ? "bg-blue-100 text-blue-900" : "text-gray-900"
                  }`}
                >
                  <WindowsEmoji emoji={category.icon || "📁"} size={18} />
                  <span>{category.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Status</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDraft((currentDraft) => ({ ...currentDraft, isActive: true }))}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${getFieldChrome(draft.isActive)}`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setDraft((currentDraft) => ({ ...currentDraft, isActive: false }))}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${getFieldChrome(!draft.isActive)}`}
            >
              Paused
            </button>
          </div>
        </div>

        <div className="rounded-md bg-gray-400/10 px-3 py-3 text-sm text-gray-700">{preview || "Set a schedule"}</div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-gray-700">Schedule</div>
            <button
              type="button"
              onClick={() =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  segments: [...currentDraft.segments, createEmptySegment()],
                }))
              }
              className="px-3 py-2 bg-gray-400/10 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-400/15 transition-colors"
            >
              Add segment
            </button>
          </div>

          {draft.segments.map((segment) => {
            const segmentError = getSegmentError(segment);

            return (
              <div key={segment.id} className="rounded-md bg-gray-400/10 p-3 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid flex-1 gap-2 md:grid-cols-5">
                    {frequencyOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setSegment(segment.id, (currentSegment) => ({
                            ...createEmptySegment(option.value),
                            id: currentSegment.id,
                          }))
                        }
                        className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${getFieldChrome(segment.frequency === option.value)}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {draft.segments.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          segments: currentDraft.segments.filter((entry) => entry.id !== segment.id),
                        }))
                      }
                      className="px-3 py-2 border border-red/40 rounded-md text-sm font-medium text-red-600/70 hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {segment.frequency === "d" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={segment.dailyInterval}
                      onChange={(event) =>
                        setSegment(segment.id, (currentSegment) => ({
                          ...currentSegment,
                          dailyInterval: event.target.value,
                        }))
                      }
                      className="w-24 px-3 py-2 bg-white rounded-md focus:outline-none text-gray-800"
                    />
                    <span className="text-sm text-gray-600">day(s)</span>
                  </div>
                )}

                {segment.frequency === "w" && (
                  <div className="grid grid-cols-4 gap-2 md:grid-cols-7">
                    {weekdayOptions.map((weekday) => (
                      <button
                        key={weekday.value}
                        type="button"
                        onClick={() =>
                          setSegment(segment.id, (currentSegment) => ({
                            ...currentSegment,
                            weeklyDays: toggleNumber(currentSegment.weeklyDays, weekday.value),
                          }))
                        }
                        className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${getFieldChrome(segment.weeklyDays.includes(weekday.value))}`}
                      >
                        {weekday.label}
                      </button>
                    ))}
                  </div>
                )}

                {segment.frequency === "m" && (
                  <div className="grid grid-cols-7 gap-2 md:grid-cols-8 lg:grid-cols-10">
                    {Array.from({ length: 31 }, (_, offset) => offset + 1).map((dateValue) => (
                      <button
                        key={dateValue}
                        type="button"
                        onClick={() =>
                          setSegment(segment.id, (currentSegment) => ({
                            ...currentSegment,
                            monthlyDates: toggleNumber(currentSegment.monthlyDates, dateValue),
                          }))
                        }
                        className={`rounded-md border px-2 py-2 text-sm font-medium transition-colors ${getFieldChrome(segment.monthlyDates.includes(dateValue))}`}
                      >
                        {dateValue}
                      </button>
                    ))}
                  </div>
                )}

                {segment.frequency === "mw" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setSegment(segment.id, (currentSegment) => ({
                            ...currentSegment,
                            monthlyWeekdays: [
                              ...currentSegment.monthlyWeekdays,
                              { id: nextId(), occurrence: "1", weekday: 2 },
                            ],
                          }))
                        }
                        className="px-3 py-2 bg-white rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Add row
                      </button>
                    </div>

                    {segment.monthlyWeekdays.map((entry) => (
                      <div key={entry.id} className="grid gap-2 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_auto]">
                        <select
                          value={entry.occurrence}
                          onChange={(event) =>
                            setSegment(segment.id, (currentSegment) => ({
                              ...currentSegment,
                              monthlyWeekdays: currentSegment.monthlyWeekdays.map((currentEntry) =>
                                currentEntry.id === entry.id
                                  ? { ...currentEntry, occurrence: event.target.value as OccurrenceCode }
                                  : currentEntry
                              ),
                            }))
                          }
                          className="px-3 py-2 bg-white rounded-md focus:outline-none text-gray-800"
                        >
                          {occurrenceOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={entry.weekday}
                          onChange={(event) =>
                            setSegment(segment.id, (currentSegment) => ({
                              ...currentSegment,
                              monthlyWeekdays: currentSegment.monthlyWeekdays.map((currentEntry) =>
                                currentEntry.id === entry.id
                                  ? { ...currentEntry, weekday: Number(event.target.value) }
                                  : currentEntry
                              ),
                            }))
                          }
                          className="px-3 py-2 bg-white rounded-md focus:outline-none text-gray-800"
                        >
                          {weekdayOptions.map((weekday) => (
                            <option key={weekday.value} value={weekday.value}>
                              {weekday.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setSegment(segment.id, (currentSegment) => ({
                              ...currentSegment,
                              monthlyWeekdays:
                                currentSegment.monthlyWeekdays.length === 1
                                  ? currentSegment.monthlyWeekdays
                                  : currentSegment.monthlyWeekdays.filter((currentEntry) => currentEntry.id !== entry.id),
                            }))
                          }
                          className="px-3 py-2 border border-red/40 rounded-md text-sm font-medium text-red-600/70 hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {segment.frequency === "y" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setSegment(segment.id, (currentSegment) => ({
                            ...currentSegment,
                            yearlyDates: [
                              ...currentSegment.yearlyDates,
                              { id: nextId(), month: 1, date: "1" },
                            ],
                          }))
                        }
                        className="px-3 py-2 bg-white rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Add row
                      </button>
                    </div>

                    {segment.yearlyDates.map((entry) => (
                      <div key={entry.id} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_120px_auto]">
                        <select
                          value={entry.month}
                          onChange={(event) =>
                            setSegment(segment.id, (currentSegment) => ({
                              ...currentSegment,
                              yearlyDates: currentSegment.yearlyDates.map((currentEntry) =>
                                currentEntry.id === entry.id
                                  ? { ...currentEntry, month: Number(event.target.value) }
                                  : currentEntry
                              ),
                            }))
                          }
                          className="px-3 py-2 bg-white rounded-md focus:outline-none text-gray-800"
                        >
                          {monthOptions.map((month) => (
                            <option key={month.value} value={month.value}>
                              {month.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={entry.date}
                          onChange={(event) =>
                            setSegment(segment.id, (currentSegment) => ({
                              ...currentSegment,
                              yearlyDates: currentSegment.yearlyDates.map((currentEntry) =>
                                currentEntry.id === entry.id
                                  ? { ...currentEntry, date: event.target.value }
                                  : currentEntry
                              ),
                            }))
                          }
                          className="px-3 py-2 bg-white rounded-md focus:outline-none text-gray-800"
                          placeholder="Day"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setSegment(segment.id, (currentSegment) => ({
                              ...currentSegment,
                              yearlyDates:
                                currentSegment.yearlyDates.length === 1
                                  ? currentSegment.yearlyDates
                                  : currentSegment.yearlyDates.filter((currentEntry) => currentEntry.id !== entry.id),
                            }))
                          }
                          className="px-3 py-2 border border-red/40 rounded-md text-sm font-medium text-red-600/70 hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3 border-t border-white/30 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={segment.hasMonthFilter}
                        onChange={(event) =>
                          setSegment(segment.id, (currentSegment) => ({
                            ...currentSegment,
                            hasMonthFilter: event.target.checked,
                            months: event.target.checked ? currentSegment.months : [],
                          }))
                        }
                      />
                      Months
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={segment.hasTime}
                        onChange={(event) =>
                          setSegment(segment.id, (currentSegment) => ({
                            ...currentSegment,
                            hasTime: event.target.checked,
                          }))
                        }
                      />
                      Time
                    </label>
                  </div>

                  {segment.hasMonthFilter && (
                    <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
                      {monthOptions.map((month) => (
                        <button
                          key={month.value}
                          type="button"
                          onClick={() =>
                            setSegment(segment.id, (currentSegment) => ({
                              ...currentSegment,
                              months: toggleNumber(currentSegment.months, month.value),
                            }))
                          }
                          className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${getFieldChrome(segment.months.includes(month.value))}`}
                        >
                          {month.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {segment.hasTime && (
                    <input
                      type="time"
                      value={segment.time}
                      onChange={(event) =>
                        setSegment(segment.id, (currentSegment) => ({
                          ...currentSegment,
                          time: event.target.value,
                        }))
                      }
                      className="px-3 py-2 bg-white rounded-md focus:outline-none text-gray-800"
                    />
                  )}
                </div>

                {segmentError && <div className="text-sm text-red-600">{segmentError}</div>}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          {onDeleteRequest ? (
            !showDeleteConfirm ? (
              <button
                type="button"
                onClick={onDeleteRequest}
                className="px-4 py-2 border border-red/40 text-sm font-medium text-red-600/60 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                Delete
              </button>
            ) : (
              <div className="flex items-center justify-between gap-3 px-1 w-full">
                <span className="text-sm font-medium text-gray-700">Delete rule tasks too?</span>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={onDeleteCancel}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteConfirm?.(false)}
                    className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                  >
                    Keep tasks
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteConfirm?.(true)}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                  >
                    Delete tasks
                  </button>
                </div>
              </div>
            )
          ) : (
            <div />
          )}

          {!showDeleteConfirm && showSubmitButton && (
            <button
              type="button"
              onClick={onSubmit}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              {submitLabel}
            </button>
          )}
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
    </div>
  );
};

export default RuleEditor;
