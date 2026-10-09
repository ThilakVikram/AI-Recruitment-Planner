"use client";

import { useState } from "react";

type Props = { id: string; value: string[]; onChange: (tags: string[]) => void; placeholder?: string; disabled?: boolean };

/** Tag-style input: Enter or comma adds a tag, Backspace on an empty field removes the last one. */
export function TagInput({ id, value, onChange, placeholder = "e.g. React, Node.js, SQL", disabled = false }: Props) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const additions = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const next = [...value];
    for (const skill of additions) {
      if (!next.some((s) => s.toLowerCase() === skill.toLowerCase())) next.push(skill.slice(0, 60));
    }
    onChange(next.slice(0, 50));
    setDraft("");
  }

  return (
    <div className="input flex min-h-10 flex-wrap items-center gap-1.5 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
      {value.map((skill) => (
        <span key={skill} className="inline-flex items-center gap-1 rounded-md bg-surface-3 py-0.5 pr-1 pl-2 text-xs">
          {skill}
          <button type="button" className="rounded px-1 text-faint hover:text-ink" disabled={disabled} onClick={() => onChange(value.filter((s) => s !== skill))} aria-label={`Remove ${skill}`}>
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        disabled={disabled}
        className="min-w-32 flex-1 bg-transparent outline-none placeholder:text-faint"
        placeholder={value.length ? "Add another…" : placeholder}
        value={draft}
        onChange={(e) => (e.target.value.includes(",") ? commit(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (draft.trim()) commit(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => draft.trim() && commit(draft)}
      />
    </div>
  );
}
