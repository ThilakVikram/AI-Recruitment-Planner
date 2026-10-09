"use client";

import type { MetadataEntry } from "@/lib/applicants/constants";

/** Free-form key / value pairs for anything the fixed fields don't cover. */
export function MetadataEditor({ value, onChange }: { value: MetadataEntry[]; onChange: (entries: MetadataEntry[]) => void }) {
  const update = (index: number, patch: Partial<MetadataEntry>) => onChange(value.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  return (
    <div className="space-y-2">
      {value.map((entry, i) => (
        <div key={i} className="flex gap-2">
          <input
            className="input w-2/5"
            placeholder="Field (e.g. Visa status)"
            maxLength={100}
            value={entry.key}
            onChange={(e) => update(i, { key: e.target.value })}
            aria-label={`Field ${i + 1} name`}
          />
          <input
            className="input flex-1"
            placeholder="Value"
            maxLength={1000}
            value={entry.value}
            onChange={(e) => update(i, { value: e.target.value })}
            aria-label={`Field ${i + 1} value`}
          />
          <button type="button" className="btn-ghost px-2.5" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove field ${i + 1}`}>
            ×
          </button>
        </div>
      ))}
      {value.length < 30 && (
        <button type="button" className="btn-ghost -ml-2 text-primary-strong" onClick={() => onChange([...value, { key: "", value: "" }])}>
          + Add field
        </button>
      )}
    </div>
  );
}
