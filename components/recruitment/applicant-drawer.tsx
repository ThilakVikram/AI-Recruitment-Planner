"use client";

import Link from "next/link";
import type { RecruitmentApplicationDTO } from "@/lib/recruitment/dto";
import { Drawer } from "@/components/ui/drawer";
import { ApplicationDetails, FinalDecisionPicker, useApplicationDecisions } from "./application-details";

/** Side panel with everything about an applicant's application: score, decisions, AI outputs and CV details. */
export function ApplicantDrawer({
  recruitmentId,
  app,
  rank,
  jobManagementReady,
  onClose,
  onChanged,
}: {
  recruitmentId: number;
  app: RecruitmentApplicationDTO;
  rank: number;
  /** Whether Job Management (JD + scorecard) has been generated — outreach and screening build on it. */
  jobManagementReady: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const state = useApplicationDecisions(recruitmentId, app, onChanged);

  return (
    <Drawer
      title={app.name}
      subtitle={app.headline ?? "Current role not in CV"}
      onClose={onClose}
      headerActions={<FinalDecisionPicker value={state.finalDecision} onChange={state.changeFinalDecision} />}
      footer={
        <>
          <Link href={`/applicants/${app.applicantId}`} className="btn-secondary px-3 py-1.5 text-xs">Open full profile</Link>
          {app.cvFileId && (
            <a href={`/api/applicants/${app.applicantId}/files/${app.cvFileId}?inline=1`} target="_blank" rel="noopener noreferrer" className="btn-secondary px-3 py-1.5 text-xs">
              View CV
            </a>
          )}
          <button type="button" className="btn-ghost ml-auto px-3 py-1.5 text-xs hover:text-fit-not" onClick={async () => (await state.remove()) && onClose()}>
            Remove from recruitment
          </button>
        </>
      }
    >
      <ApplicationDetails recruitmentId={recruitmentId} app={app} state={state} rank={rank} jobManagementReady={jobManagementReady} onChanged={onChanged} />
    </Drawer>
  );
}
