"use client";

import { useState } from "react";
import type { SourcingProfileDTO } from "@/lib/workflow/types";

const VERDICT_STYLE: Record<string, string> = {
  "Reach out": "border-fit-strong/40 bg-fit-strong/10 text-fit-strong",
  Hold: "border-fit-average/40 bg-fit-average/10 text-fit-average",
  Pass: "border-fit-not/40 bg-fit-not/10 text-fit-not",
};

function List({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  if (!items.length) return null;
  return (
    <div>
      <div className={`text-xs font-semibold tracking-wide uppercase ${tone}`}>{title}</div>
      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-muted">
        {items.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

type Props = {
  profile: SourcingProfileDTO;
  rank: number | null;
  onRemove: () => void;
  /** Optional per-profile (re)analysis, e.g. on the recruitment page. */
  onAnalyze?: () => void;
  analyzing?: boolean;
  /** Extra controls shown on the card (e.g. “Add to applicants” on the recruitment page). */
  actions?: React.ReactNode;
};

export function ProfileCard({ profile, rank, onRemove, onAnalyze, analyzing = false, actions }: Props) {
  const [showText, setShowText] = useState(false);
  const a = profile.analysis;

  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {rank && <span className="font-display text-sm font-semibold text-faint">#{rank}</span>}
        <span className="font-medium">{profile.candidateName}</span>
        <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">{profile.platform}</span>
        {profile.verdict && (
          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${VERDICT_STYLE[profile.verdict] ?? ""}`}>{profile.verdict}</span>
        )}
        <span className="ml-auto font-display text-lg font-semibold tabular-nums">
          {profile.score ?? "—"}
          <span className="text-xs font-normal text-faint">/10</span>
        </span>
      </div>

      {profile.referenceUrl && (
        // Displayed for the recruiter's reference only; the app never requests this URL.
        <div className="mt-1 truncate text-xs text-faint">Ref: {profile.referenceUrl}</div>
      )}

      {a ? (
        <div className="mt-3 space-y-3">
          {a.reason && <p className="text-sm">{a.reason}</p>}
          <div className="grid gap-3 md:grid-cols-3">
            <List title="Platform signals" items={a.platformSignals} tone="text-primary-strong" />
            <List title="Strengths" items={a.strengths} tone="text-fit-strong" />
            <List title="Concerns" items={a.concerns} tone="text-fit-not" />
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-faint">Not analysed yet.</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {actions}
        <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => setShowText((v) => !v)}>
          {showText ? "Hide" : "Show"} pasted text
        </button>
        {onAnalyze && (
          <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={onAnalyze} disabled={analyzing}>
            {analyzing ? "Analysing…" : a ? "Analyse again" : "Analyse"}
          </button>
        )}
        <button type="button" className="btn-ghost px-2 py-1 text-xs hover:text-fit-not" onClick={onRemove} disabled={analyzing}>
          Remove
        </button>
      </div>
      {showText && <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-canvas p-3 text-xs whitespace-pre-wrap text-muted">{profile.profileText}</pre>}
    </li>
  );
}
