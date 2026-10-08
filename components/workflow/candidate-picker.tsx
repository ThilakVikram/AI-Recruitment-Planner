"use client";

import type { CandidateDTO } from "@/lib/workflow/types";
import { FitBadge } from "@/components/ui/fit-badge";

export function CandidatePicker({
  candidates,
  selected,
  onChange,
  single = false,
  disabled = false,
}: {
  candidates: CandidateDTO[];
  selected: string[];
  onChange: (ids: string[]) => void;
  single?: boolean;
  disabled?: boolean;
}) {
  if (!candidates.length) {
    return (
      <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-faint">
        No candidates yet. Score CVs in Stage 4 first.
      </p>
    );
  }

  function toggle(id: string) {
    if (single) return onChange([id]);
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  return (
    <fieldset disabled={disabled}>
      <legend className="label">{single ? "Candidate" : "Candidates"}</legend>
      <ul className="max-h-72 divide-y divide-line overflow-y-auto rounded-lg border border-line bg-surface-2">
        {candidates.map((c) => (
          <li key={c.id}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-surface-3">
              <input
                type={single ? "radio" : "checkbox"}
                name="candidate-picker"
                className="accent-primary"
                checked={selected.includes(c.id)}
                onChange={() => toggle(c.id)}
              />
              <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
              <span className="hidden text-xs text-faint sm:inline">{c.decision}</span>
              <span className="w-12 text-right text-xs tabular-nums text-muted">{c.score ?? "—"}/100</span>
              <span className="hidden sm:inline"><FitBadge category={c.category} /></span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
