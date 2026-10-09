"use client";

import { useState } from "react";
import type { RecruitmentApplicationDTO } from "@/lib/recruitment/dto";
import { fitStyle } from "@/components/ui/fit-badge";

type Props = {
  /** Opens the applicant's details panel. */
  onSelect: (applicationId: string) => void;
  applications: RecruitmentApplicationDTO[];
  onDropFiles: (files: File[]) => void;
};

function ApplicationRow({ app, rank, onSelect }: { app: RecruitmentApplicationDTO; rank: number; onSelect: () => void }) {
  const style = fitStyle(app.category);
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface-2/50 p-2.5 text-left transition hover:border-primary/60 hover:bg-surface-2"
      >
        <span className="w-5 shrink-0 text-center text-xs text-faint">{rank}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{app.name}</span>
          <span className="block truncate text-xs text-muted">{app.headline ?? app.email ?? "—"}</span>
        </span>
        <span className={`font-display text-lg font-semibold tabular-nums ${style?.text ?? "text-muted"}`}>{app.score ?? "—"}</span>
      </button>
    </li>
  );
}

/**
 * Applicants card in the left column, below the role & summary. Can be collapsed to its header.
 * Uploading and profile analysis live in the page header; CVs can still be dropped on this card.
 */
export function ApplicantsPanel({
  onSelect,
  applications,
  minimized,
  onMinimizedChange,
  onDropFiles,
}: Props & { minimized: boolean; onMinimizedChange: (minimized: boolean) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const top = applications.find((a) => a.score !== null);

  return (
    <section
      aria-label="Applicants"
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) onDropFiles(Array.from(e.dataTransfer.files));
      }}
      className={`card transition ${dragOver ? "border-primary ring-2 ring-primary/30" : ""}`}
    >
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
        onClick={() => onMinimizedChange(!minimized)}
        aria-expanded={!minimized}
      >
        <h2 className="font-display text-sm font-semibold">Applicants</h2>
        <span className="rounded-full bg-surface-3 px-1.5 text-xs text-muted">{applications.length}</span>
        <span className="min-w-0 flex-1 truncate text-xs text-faint">
          {dragOver ? "Drop CVs to upload" : minimized && top ? `Top: ${top.name} · ${top.score}` : "by score"}
        </span>
        <span className={`text-faint transition ${minimized ? "" : "rotate-180"}`} aria-hidden>▾</span>
      </button>

      {!minimized && (
        <div className="border-t border-line p-4">
          {applications.length ? (
            <ol className="space-y-2">
              {applications.map((app, i) => (
                <ApplicationRow key={app.id} app={app} rank={i + 1} onSelect={() => onSelect(app.id)} />
              ))}
            </ol>
          ) : (
            <p className="py-2 text-center text-xs text-faint">
              No applicants yet. Use <span className="text-muted">Attach applicant file</span> at the top, or drop CVs on this card.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
