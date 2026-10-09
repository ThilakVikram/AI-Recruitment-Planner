"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { recruitmentCode, recruitmentSlug } from "@/lib/recruitment/constants";
import type { RecruitmentApplicationDTO } from "@/lib/recruitment/dto";
import { ApplicationDetails, FinalDecisionPicker, useApplicationDecisions } from "./application-details";
import { RecruitmentStatusBadge } from "./status-badge";

export type ApplicantRecruitmentItem = {
  recruitmentId: number;
  status: string;
  role: { id: string; name: string };
  jobManagementReady: boolean;
  rank?: number;
  total: number;
  app: RecruitmentApplicationDTO;
};

/** The applicant detail page's “Recruitments” section — the same details and tools as the recruitment page's applicant panel. */
export function ApplicantRecruitments({ items }: { items: ApplicantRecruitmentItem[] }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-lg font-semibold">Recruitments</h2>
        <p className="text-sm text-muted">
          {items.length
            ? "Score, decisions, outreach, screening and final decision messages for each recruitment this applicant is part of."
            : "Not part of any recruitment yet. Attach their CV from a recruitment page to score them against its job description."}
        </p>
      </div>
      {items.map((item, i) => <RecruitmentCard key={item.app.id} item={item} defaultOpen={i === 0} />)}
    </section>
  );
}

function RecruitmentCard({ item, defaultOpen }: { item: ApplicantRecruitmentItem; defaultOpen: boolean }) {
  const router = useRouter();
  const { app } = item;
  const onChanged = () => router.refresh();
  const state = useApplicationDecisions(item.recruitmentId, app, onChanged);
  const href = `/recruitment/${recruitmentSlug(item.recruitmentId)}`;

  return (
    <details className="card group overflow-hidden" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 select-none hover:bg-surface-2/50">
        <span className="text-muted transition group-open:rotate-90" aria-hidden>›</span>
        <span className="font-mono text-sm text-primary-strong">{recruitmentCode(item.recruitmentId)}</span>
        <span className="min-w-0 font-semibold">{item.role.name}</span>
        <RecruitmentStatusBadge status={item.status} />
        <span className="text-xs text-muted">
          {app.score ?? "—"}/100{item.rank !== undefined && ` · rank #${item.rank} of ${item.total}`} · {state.decision}
        </span>
        {state.finalDecision && <span className="ml-auto text-xs font-medium">{state.finalDecision}</span>}
      </summary>

      <div className="space-y-4 border-t border-line p-4">
        <div className="flex flex-wrap items-center gap-2">
          <FinalDecisionPicker value={state.finalDecision} onChange={state.changeFinalDecision} />
          <div className="ml-auto flex flex-wrap gap-2">
            <Link href={href} className="btn-secondary px-3 py-1.5 text-xs">Open recruitment</Link>
            {app.cvFileId && (
              <a href={`/api/applicants/${app.applicantId}/files/${app.cvFileId}?inline=1`} target="_blank" rel="noopener noreferrer" className="btn-secondary px-3 py-1.5 text-xs">
                View CV
              </a>
            )}
            <button type="button" className="btn-ghost px-3 py-1.5 text-xs hover:text-fit-not" onClick={() => state.remove()}>Remove from recruitment</button>
          </div>
        </div>
        <ApplicationDetails
          recruitmentId={item.recruitmentId}
          app={app}
          state={state}
          rank={item.rank}
          jobManagementReady={item.jobManagementReady}
          onChanged={onChanged}
          layout="wide"
          showCvDetails={false}
        />
      </div>
    </details>
  );
}
