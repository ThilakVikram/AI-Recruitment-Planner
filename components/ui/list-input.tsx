"use client";

import { useState } from "react";

type Props = {
  id: string;
  value: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  /** Show 1, 2, 3… instead of bullets (e.g. interview rounds). */
  numbered?: boolean;
  maxItems?: number;
  maxLength?: number;
  disabled?: boolean;
};

/** An editable list: each item is its own row; Enter in the last box adds the next one. */
export function ListInput({ id, value, onChange, placeholder, numbered = false, maxItems = 30, maxLength = 500, disabled = false }: Props) {
  const [draft, setDraft] = useState("");

  function add() {
    const item = draft.trim();
    if (!item || value.length >= maxItems) return;
    onChange([...value, item.slice(0, maxLength)]);
    setDraft("");
  }

  return (
    <div className="space-y-1.5">
      {value.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-right text-xs text-faint">{numbered ? `${i + 1}.` : "•"}</span>
          <input
            className="input py-1.5"
            value={item}
            maxLength={maxLength}
            disabled={disabled}
            onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))}
            onBlur={() => !item.trim() && onChange(value.filter((_, j) => j !== i))}
            aria-label={`Item ${i + 1}`}
          />
          <button type="button" className="btn-ghost px-2 py-1" disabled={disabled} onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove item ${i + 1}`}>
            ×
          </button>
        </div>
      ))}
      {value.length < maxItems && (
        <div className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-right text-xs text-faint">{numbered ? `${value.length + 1}.` : "+"}</span>
          <input
            id={id}
            className="input py-1.5"
            placeholder={placeholder}
            value={draft}
            maxLength={maxLength}
            disabled={disabled}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            onBlur={add}
          />
          <button type="button" className="btn-ghost px-2 py-1 text-xs" disabled={disabled || !draft.trim()} onClick={add}>
            Add
          </button>
        </div>
      )}
    </div>
  );
}
