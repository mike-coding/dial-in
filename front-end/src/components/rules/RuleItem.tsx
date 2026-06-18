import React from "react";
import { Category, Rule as RuleType } from "../../hooks/types";
import { resolveRuleIcon } from "../../utils/iconResolver";
import EmojiIconPicker from "../EmojiIconPicker";
import WindowsEmoji from "../WindowsEmoji";
import RuleEditor from "./RuleEditor";
import { RuleDraft } from "./types";

interface RuleItemProps {
  title: React.ReactNode;
  icon?: string;
  leading?: React.ReactNode;
  subtitle?: string;
  titleSuffix?: React.ReactNode;
  headerAction?: React.ReactNode;
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
  headerAction,
  isExpanded,
  onToggle,
  children,
}) => (
  <div className="bg-gray-100 rounded-md transition-all duration-200">
    <div className="px-4 py-3 cursor-pointer" onClick={onToggle}>
      <div className={`flex items-center ${leading || icon ? "gap-4" : "gap-2"}`}>
        {headerAction ? <div className="flex-shrink-0">{headerAction}</div> : null}

        {(leading || icon) ? (
          <div className="flex-shrink-0">{leading ?? (icon ? <WindowsEmoji emoji={icon} size={24} /> : null)}</div>
        ) : null}

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
  isExpanded: boolean;
  editDraft: RuleDraft | null;
  categories: Category[];
  editError: string | null;
  showDeleteConfirm: boolean;
  bodyOverride?: React.ReactNode;
  onToggle: () => void;
  onToggleActive: () => void;
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
  onToggleActive,
  onIconChange,
  setDraft,
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
    icon={isExpanded && editDraft ? undefined : (rule.icon || category?.icon || resolveRuleIcon(rule, categories))}
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
    headerAction={
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleActive();
        }}
        className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-gray-300/40 transition-colors"
        aria-label={rule.is_active ? "Set rule inactive" : "Set rule active"}
      >
        <img
          src={rule.is_active ? "/svg/active.svg" : "/svg/inactive.svg"}
          alt=""
          className="w-4 h-4"
        />
      </button>
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

export default RuleItem;
