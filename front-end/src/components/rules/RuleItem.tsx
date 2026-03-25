import React from "react";
import { Category, Rule as RuleType } from "../../hooks/types";
import WindowsEmoji from "../WindowsEmoji";
import RuleEditor from "./RuleEditor";
import { RuleDraft } from "./types";

interface RuleItemProps {
  title: React.ReactNode;
  icon?: string;
  leading?: React.ReactNode;
  subtitle?: string;
  titleSuffix?: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

const RuleItem: React.FC<RuleItemProps> = ({
  title,
  icon,
  leading,
  subtitle,
  titleSuffix,
  isExpanded,
  onToggle,
  children,
}) => (
  <div className="bg-white rounded-md transition-all duration-200">
    <div className="px-4 py-3 cursor-pointer" onClick={onToggle}>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">{leading ?? (icon ? <WindowsEmoji emoji={icon} size={24} /> : null)}</div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 px-2 py-1">
            {title}
            {titleSuffix}
          </div>
          {subtitle && <p className="text-sm text-gray-500 px-2 truncate">{subtitle}</p>}
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
      }`}
    >
      {children}
    </div>
  </div>
);

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
          className="flex-1 text-gray-600/80 placeholder-gray-600/40 bg-transparent border-none outline-none text-lg"
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
  scheduleSummary: string;
  isExpanded: boolean;
  editDraft: RuleDraft | null;
  categories: Category[];
  editError: string | null;
  showDeleteConfirm: boolean;
  onToggle: () => void;
  setDraft: (value: React.SetStateAction<RuleDraft>) => void;
  onSubmit: () => void;
  onDeleteRequest: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: (deleteChildren: boolean) => void;
}

export const ExistingRuleItem: React.FC<ExistingRuleItemProps> = ({
  rule,
  category,
  scheduleSummary,
  isExpanded,
  editDraft,
  categories,
  editError,
  showDeleteConfirm,
  onToggle,
  setDraft,
  onSubmit,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
}) => (
  <RuleItem
    title={
      isExpanded && editDraft ? (
        <input
          type="text"
          value={editDraft.name}
          onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))}
          onClick={(event) => event.stopPropagation()}
          className="w-full text-lg bg-gray-400/10 rounded-md outline-none transition-all duration-200 focus:bg-gray-400/20 px-2 py-1 text-gray-700"
          placeholder="Rule name..."
          autoFocus={false}
        />
      ) : (
        <p className="text-lg truncate text-gray-700">{rule.name}</p>
      )
    }
    icon={category?.icon || "⚙️"}
    subtitle={scheduleSummary}
    titleSuffix={!rule.is_active ? <span className="text-xs text-gray-400">Paused</span> : undefined}
    isExpanded={isExpanded}
    onToggle={onToggle}
  >
    {isExpanded && editDraft && (
      <RuleEditor
        draft={editDraft}
        setDraft={setDraft}
        categories={categories}
        error={editError}
        submitLabel="Save"
        onSubmit={onSubmit}
        showDeleteConfirm={showDeleteConfirm}
        onDeleteRequest={onDeleteRequest}
        onDeleteCancel={onDeleteCancel}
        onDeleteConfirm={onDeleteConfirm}
      />
    )}
  </RuleItem>
);

export default RuleItem;
