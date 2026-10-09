"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSection, type SectionDefinition, type SectionKey, type StepKey } from "@/lib/recruitment/constants";
import { hasKickoffNotes, type KickoffForm } from "@/lib/recruitment/kickoff";
import type { RecruitmentApplicationDTO, RecruitmentSectionDTO } from "@/lib/recruitment/dto";
import { Alert } from "@/components/ui/alert";
import { OverviewPanel, type OverviewRole } from "./overview-panel";
import { KickoffNotes, type RoleDefaults } from "./kickoff-notes";
import { AiSections } from "./ai-sections";
import { ApplicantsPanel } from "./applicants-panel";
import { ApplicantDrawer } from "./applicant-drawer";
import { PageHeader } from "@/components/layout/page-header";
import { GenerateDialog } from "./generate-dialog";
import { UploadDialog, checkCvFiles } from "./upload-dialog";
import { ProfileAnalysisDialog } from "./profile-analysis-dialog";
import type { RecruitmentProfileDTO } from "@/lib/recruitment/dto";

type Props = {
  recruitment: { id: number; summary: string; status: string; openings: number };
  role: OverviewRole;
  kickoff: { form: KickoffForm; raw: string };
  roleDefaults: RoleDefaults;
  sections: RecruitmentSectionDTO[];
  applications: RecruitmentApplicationDTO[];
  profiles: RecruitmentProfileDTO[];
  initialSection: StepKey;
  /** Title, status and created info for the app header (rendered by the page on the server). */
  header: React.ReactNode;
  deleteButton: React.ReactNode;
};

type Dialog = { kind: "generate"; def: SectionDefinition } | { kind: "upload"; files: File[] } | { kind: "profiles" } | null;

/**
 * The recruitment page: role & summary with the Applicants list below on the left,
 * and the steps (kick-off notes, then the AI sections) filling the rest.
 */
export function RecruitmentWorkspace({ recruitment, role, kickoff: initialKickoff, roleDefaults, sections: initialSections, applications, profiles: initialProfiles, initialSection, header, deleteButton }: Props) {
  const router = useRouter();
  const [kickoff, setKickoff] = useState(initialKickoff);
  const notesReady = hasKickoffNotes(kickoff.form, kickoff.raw);
  const [sections, setSections] = useState<Partial<Record<SectionKey, RecruitmentSectionDTO>>>(() =>
    Object.fromEntries(initialSections.map((s) => [s.key, s])),
  );
  const [profiles, setProfiles] = useState(initialProfiles);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [dropError, setDropError] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Looked up from the (refreshed) list, so the panel shows current data and closes if the applicant is removed.
  const selectedIndex = applications.findIndex((a) => a.id === selectedId);

  // Dragging files anywhere over the page expands a collapsed Applicants panel so it can take the drop.
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes("Files")) setMinimized(false);
    };
    window.addEventListener("dragenter", onDragEnter);
    return () => window.removeEventListener("dragenter", onDragEnter);
  }, []);
  const hasJd = Boolean((sections.kickoff?.data as { jobDescription?: string } | null)?.jobDescription);

  function openUpload(files: File[] = []) {
    const checked = checkCvFiles(files);
    setDropError(checked.error);
    if (!checked.error || checked.files.length) setDialog({ kind: "upload", files: checked.files });
  }

  return (
    <>
      <PageHeader>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
          {header}
          <div className="ml-auto flex items-center gap-2">
            <button type="button" className="btn-primary px-3 py-1.5 text-xs" onClick={() => openUpload()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4L15.5 7" />
              </svg>
              Attach applicant file
            </button>
            <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setDialog({ kind: "profiles" })}>
              Profile analysis
              {profiles.length > 0 && <span className="rounded-full bg-surface-3 px-1.5 text-[0.65rem] text-muted">{profiles.length}</span>}
            </button>
            {deleteButton}
          </div>
        </div>
      </PageHeader>

      <div className="grid items-start gap-4 lg:grid-cols-[19rem_minmax(0,1fr)] 2xl:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
          <OverviewPanel recruitmentId={recruitment.id} role={role} summary={recruitment.summary} status={recruitment.status} openings={recruitment.openings} />
          <ApplicantsPanel
            onSelect={setSelectedId}
            applications={applications}
            minimized={minimized}
            onMinimizedChange={setMinimized}
            onDropFiles={openUpload}
          />
        </div>

        <div className="min-w-0">
          {dropError && <div className="mb-4"><Alert>{dropError}</Alert></div>}
          <AiSections
            sections={sections}
            onGenerate={(def) => setDialog({ kind: "generate", def })}
            initialSection={initialSection}
            notesReady={notesReady}
            notesPanel={<KickoffNotes recruitmentId={recruitment.id} form={kickoff.form} raw={kickoff.raw} roleDefaults={roleDefaults} onSaved={setKickoff} />}
            profiles={profiles.map((p) => ({ candidateName: p.candidateName, platform: p.platform, score: p.score, verdict: p.verdict, reason: p.analysis?.reason }))}
          />
        </div>
      </div>

      {selectedIndex >= 0 && (
        <ApplicantDrawer
          key={applications[selectedIndex].id}
          recruitmentId={recruitment.id}
          app={applications[selectedIndex]}
          rank={selectedIndex + 1}
          jobManagementReady={hasJd}
          onClose={() => setSelectedId(null)}
          onChanged={() => router.refresh()}
        />
      )}
      {dialog?.kind === "generate" && (
        <GenerateDialog
          recruitmentId={recruitment.id}
          def={dialog.def}
          current={sections[dialog.def.key]}
          notesReady={notesReady}
          blockedReason={
            dialog.def.requires
              .filter((k) => !sections[k]?.output)
              .map((k) => `Generate “${getSection(k)!.title}” first.`)
              .join(" ") || null
          }
          onClose={() => setDialog(null)}
          onGenerated={(section) => {
            setSections((s) => ({ ...s, [section.key]: section }));
            router.refresh();
          }}
        />
      )}
      {dialog?.kind === "profiles" && (
        <ProfileAnalysisDialog
          recruitmentId={recruitment.id}
          hasJd={hasJd}
          profiles={profiles}
          onChange={setProfiles}
          onApplicantsChanged={() => router.refresh()}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "upload" && (
        <UploadDialog
          recruitmentId={recruitment.id}
          hasJd={hasJd}
          initialFiles={dialog.files}
          onClose={() => setDialog(null)}
          onUploaded={() => router.refresh()}
        />
      )}
    </>
  );
}
