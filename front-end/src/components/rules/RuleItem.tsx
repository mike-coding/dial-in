import React from "react";
import { Category, Rule as RuleType } from "../../hooks/types";
import {
  getColoredSurfaceStyle,
  getDerivedFieldStyle,
  resolveRuleColor,
  resolveRuleIcon,
} from "../../utils/presentationResolver";
import EmojiIconPicker from "../EmojiIconPicker";
import WindowsEmoji from "../WindowsEmoji";
import RuleEditor from "./RuleEditor";
import { RuleDraft } from "./types";

interface RuleItemProps {
  title: React.ReactNode;
  icon?: string;
  leading?: React.ReactNode;
  subtitle?: string;
  color?: string;
  isActive?: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

const RuleItem: React.FC<RuleItemProps> = ({
  title,
  icon,
  leading,
  subtitle,
  color,
  isActive = true,
  isExpanded,
  onToggle,
  children,
}) => {
  const isMuted = !isActive;

  return (
  <div
    className="w-full max-w-full min-w-0 overflow-hidden rounded-md border-l-4 bg-gray-100 transition-all duration-200"
    style={getColoredSurfaceStyle(color, {
      muted: isMuted,
      fallbackBackground: isMuted ? "#f9fafb" : undefined,
      fallbackTextColor: isMuted ? "#6b7280" : undefined,
    })}
  >
    <div className="min-w-0 px-4 py-2 cursor-pointer" onClick={onToggle}>
      <div className={`flex min-h-10 min-w-0 items-center ${leading || icon ? "gap-4" : "gap-2"} ${isMuted ? "opacity-60" : ""}`}>
        {(leading || icon) ? (
          <div className="flex-shrink-0">{leading ?? (icon ? <WindowsEmoji emoji={icon} size={24} /> : null)}</div>
        ) : null}

        <div className="flex-1 min-w-0">
          <div className="flex min-w-0 items-center px-2 py-1">
            {title}
          </div>
          {subtitle && <p className="text-sm px-2 truncate opacity-70">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors group">
            <svg
              className={`w-5 h-5 text-gray-500 group-hover:text-gray-400 transition-all duration-200 ${isExpanded ? "" : "transform -rotate-90"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <div
      className={`transition-all duration-300 ease-in-out ${
        isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
      } min-w-0 max-w-full`}
    >
      {children}
    </div>
  </div>
  );
};

interface NewRuleItemProps {
  isExpanded: boolean;
  onToggle: () => void;
  draft: RuleDraft;
  setDraft: React.Dispatch<React.SetStateAction<RuleDraft>>;
  categories: Category[];
  error: string | null;
  onSubmit: () => void;
}

export const NewRuleItem: React.FC<NewRuleItemProps> = ({
  isExpanded,
  onToggle,
  draft,
  setDraft,
  categories,
  error,
  onSubmit,
}) => (
  <div className="bg-white rounded-md transition-all duration-200">
    <div className="px-4 py-2">
      <div className="flex items-center gap-3">
        <div
          onClick={(event) => {
            event.stopPropagation();
            onSubmit();
          }}
          className="w-10 h-10 flex items-center justify-center cursor-pointer transition-colors hover:scale-105 transition-all duration-200"
          aria-label="Create rule"
        >
          <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <EmojiIconPicker
          value={draft.icon}
          fallbackIcon={categories.find((category) => String(category.id) === draft.categoryId)?.icon || "⚙️"}
          onChange={(icon) => setDraft((currentDraft) => ({ ...currentDraft, icon: icon || "" }))}
          showClear
          ariaLabel="Select rule icon"
        />
        <input
          type="text"
          value={draft.name}
          onFocus={() => {
            if (!isExpanded) {
              onToggle();
            }
          }}
          onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSubmit();
            }
          }}
          className="flex-1 text-current placeholder-gray-600/40 bg-transparent border-none outline-none text-lg"
          placeholder="Add a new rule..."
          autoFocus={false}
        />
      </div>
    </div>

    <div
      className={`transition-all duration-300 ease-in-out ${
        isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
      }`}
    >
      <RuleEditor
        draft={draft}
        setDraft={setDraft}
        categories={categories}
        error={error}
        submitLabel="Create"
        onSubmit={onSubmit}
        showSubmitButton={false}
      />
    </div>
  </div>
);

interface ExistingRuleItemProps {
  rule: RuleType;
  category: Category | null;
  isExpanded: boolean;
  editDraft: RuleDraft | null;
  categories: Category[];
  editError: string | null;
  showDeleteConfirm: boolean;
  bodyOverride?: React.ReactNode;
  onToggle: () => void;
  onIconChange: (icon: string | null) => void;
  setDraft: (value: React.SetStateAction<RuleDraft>) => void;
  onDeleteRequest: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: (deleteChildren: boolean) => void;
}

export const ExistingRuleItem: React.FC<ExistingRuleItemProps> = ({
  rule,
  category,
  isExpanded,
  editDraft,
  categories,
  editError,
  showDeleteConfirm,
  bodyOverride,
  onToggle,
  onIconChange,
  setDraft,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
}) => {
  const displayColor = isExpanded && editDraft ? editDraft.color || category?.color || undefined : resolveRuleColor(rule, categories);
  const displayIsActive = isExpanded && editDraft ? editDraft.isActive : rule.is_active;

  return (
    <RuleItem
    title={
      isExpanded && editDraft ? (
        <input
          type="text"
          value={editDraft.name}
          onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))}
          onClick={(event) => event.stopPropagation()}
          className="derived-field w-full text-lg rounded-md outline-none transition-all duration-200 px-2 py-1 text-current"
          style={getDerivedFieldStyle(displayColor, { muted: !displayIsActive })}
          placeholder="Rule name..."
          autoFocus={false}
        />
      ) : (
        <p className="text-lg truncate">{rule.name}</p>
      )
    }
    icon={isExpanded && editDraft ? undefined : (rule.icon || category?.icon || resolveRuleIcon(rule, categories))}
    color={displayColor}
    isActive={displayIsActive}
    leading={
      isExpanded && editDraft ? (
        <EmojiIconPicker
          value={editDraft.icon}
          fallbackIcon={category?.icon || resolveRuleIcon(rule, categories)}
          onChange={(icon) => {
            setDraft((currentDraft) => ({ ...currentDraft, icon: icon || "" }));
            onIconChange(icon);
          }}
          showClear
          ariaLabel="Select rule icon"
        />
      ) : undefined
    }
    isExpanded={isExpanded}
    onToggle={onToggle}
  >
    {isExpanded && bodyOverride ? (
      bodyOverride
    ) : (
      isExpanded && editDraft && (
      <RuleEditor
        draft={editDraft}
        setDraft={setDraft}
        categories={categories}
        error={editError}
        submitLabel="Save"
        onSubmit={() => {}}
        showSubmitButton={false}
        showDeleteConfirm={showDeleteConfirm}
        onDeleteRequest={onDeleteRequest}
        onDeleteCancel={onDeleteCancel}
        onDeleteConfirm={onDeleteConfirm}
      />
      )
    )}
  </RuleItem>
  );
};

export default RuleItem;
