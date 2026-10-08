"use client";

import Link from "next/link";
import type { CandidateDTO } from "@/lib/workflow/types";
import { TrackerRow } from "./tracker-row";

export function TrackerTable({ roleId, initialCandidates }: { roleId: string; initialCandidates: CandidateDTO[] }) {
  const candidates = [...initialCandidates].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  if (!candidates.length) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-muted">No scored candidates for this role yet.</p>
        <Link href={`/workflow?role=${roleId}&stage=4`} className="btn-primary mt-4">
          Go to CV Assessment
        </Link>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="hidden grid-cols-[3rem_minmax(0,1.4fr)_5rem_8rem_12rem_minmax(0,2fr)] gap-4 border-b border-line bg-surface-2 px-4 py-2.5 text-xs font-medium tracking-wide text-muted uppercase lg:grid">
        <span>#</span>
        <span>Candidate</span>
        <span>Score</span>
        <span>Category</span>
        <span>Decision</span>
        <span>Recruiter notes</span>
      </div>
      <ul className="divide-y divide-line">
        {candidates.map((c, i) => (
          <TrackerRow key={c.id} roleId={roleId} rank={i + 1} candidate={c} />
        ))}
      </ul>
    </div>
  );
}
