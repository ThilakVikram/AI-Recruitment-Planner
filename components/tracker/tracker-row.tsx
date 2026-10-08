"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { DECISIONS } from "@/lib/workflow/constants";
import type { CandidateDTO } from "@/lib/workflow/types";
import { FitBadge, ScorePill } from "@/components/ui/fit-badge";

type Status = { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "error"; message: string };

const NOTES_DEBOUNCE_MS = 800;

export function TrackerRow({ roleId, rank, candidate }: { roleId: string; rank: number; candidate: CandidateDTO }) {
  const [decision, setDecision] = useState(candidate.decision);
  const [notes, setNotes] = useState(candidate.recruiterNotes);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingNotes = useRef<string | null>(null);
  const requestSeq = useRef(0);

  async function save(data: { decision?: string; recruiterNotes?: string }) {
    const seq = ++requestSeq.current;
    setStatus({ kind: "saving" });
    try {
      await apiFetch(`/api/candidates/${candidate.id}`, { method: "PATCH", body: JSON.stringify({ roleId, ...data }) });
      if (seq === requestSeq.current) setStatus({ kind: "saved" });
    } catch (e) {
      if (seq === requestSeq.current) setStatus({ kind: "error", message: errorMessage(e) });
    }
  }

  function flushNotes() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (pendingNotes.current !== null) {
      const value = pendingNotes.current;
      pendingNotes.current = null;
      void save({ recruiterNotes: value });
    }
  }

  function onNotesChange(value: string) {
    setNotes(value);
    pendingNotes.current = value;
    setStatus({ kind: "saving" });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flushNotes, NOTES_DEBOUNCE_MS);
  }

  // Save any unsent notes if the row unmounts (e.g. role switch / navigation).
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (pendingNotes.current !== null) {
        void fetch(`/api/candidates/${candidate.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleId, recruiterNotes: pendingNotes.current }),
          keepalive: true,
        });
      }
    };
  }, [candidate.id, roleId]);

  return (
    <li className="grid grid-cols-[2rem_minmax(0,1fr)_auto] gap-x-3 gap-y-3 px-4 py-4 lg:grid-cols-[3rem_minmax(0,1.4fr)_5rem_8rem_12rem_minmax(0,2fr)] lg:items-start lg:gap-4">
      <span className="pt-1 font-display text-sm font-semibold text-faint">#{rank}</span>
      <div className="min-w-0 pt-0.5">
        <div className="truncate font-medium">{candidate.name}</div>
        {candidate.summary && <div className="mt-0.5 line-clamp-2 text-xs text-faint">{candidate.summary}</div>}
      </div>
      <div className="lg:pt-0.5">
        <ScorePill score={candidate.score} category={candidate.category} />
      </div>
      <div className="col-span-3 col-start-2 lg:col-span-1 lg:col-start-auto lg:pt-1">
        <FitBadge category={candidate.category} />
      </div>
      <div className="col-span-3 col-start-2 lg:col-span-1 lg:col-start-auto">
        <label className="sr-only" htmlFor={`decision-${candidate.id}`}>Decision for {candidate.name}</label>
        <select
          id={`decision-${candidate.id}`}
          className="input py-1.5"
          value={decision}
          onChange={(e) => {
            setDecision(e.target.value);
            void save({ decision: e.target.value });
          }}
        >
          {DECISIONS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>
      <div className="col-span-3 col-start-2 lg:col-span-1 lg:col-start-auto">
        <label className="sr-only" htmlFor={`notes-${candidate.id}`}>Recruiter notes for {candidate.name}</label>
        <textarea
          id={`notes-${candidate.id}`}
          className="input min-h-16 py-1.5 text-sm"
          placeholder="Recruiter notes (internal)…"
          maxLength={20000}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          onBlur={flushNotes}
        />
        <div className="mt-1 h-4 text-xs" aria-live="polite">
          {status.kind === "saving" && <span className="text-muted">Saving...</span>}
          {status.kind === "saved" && <span className="text-fit-strong">Saved</span>}
          {status.kind === "error" && <span className="text-fit-not">{status.message}</span>}
        </div>
      </div>
    </li>
  );
}
