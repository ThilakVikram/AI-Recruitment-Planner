"use client";

import { useId, useState } from "react";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { DECISIONS, FINAL_DECISIONS } from "@/lib/workflow/constants";
import type { RecruitmentApplicationDTO } from "@/lib/recruitment/dto";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { FitBadge, fitStyle } from "@/components/ui/fit-badge";
import { initialsOf } from "@/components/layout/initials";
import { ApplicantAiOutput } from "./applicant-ai-output";

/**
 * One applicant's application to a recruitment — score, decisions, the per-applicant AI outputs
 * (outreach, screening, final decision messages) and what was read from their CV. Shared by the
 * recruitment page's applicant panel and the applicant's detail page.
 */

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 py-1.5 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

const missing = <span className="text-faint">Not in CV</span>;

/** Selected colour for each final decision button. */
const FINAL_STYLE: Record<(typeof FINAL_DECISIONS)[number], string> = {
  Selected: "border-fit-strong bg-fit-strong/15 text-fit-strong",
  "On hold": "border-fit-average bg-fit-average/15 text-fit-average",
  Rejected: "border-fit-not bg-fit-not/15 text-fit-not",
};

/** Decision + final decision for one application, saved as they change. */
export function useApplicationDecisions(recruitmentId: number, app: RecruitmentApplicationDTO, onChanged: () => void) {
  const [decision, setDecision] = useState(app.decision);
  const [finalDecision, setFinalDecision] = useState(app.finalDecision);
  const [error, setError] = useState<string | null>(null);
  const url = `/api/recruitments/${recruitmentId}/applications/${app.id}`;

  async function changeDecision(next: string) {
    const previous = decision;
    setDecision(next);
    setError(null);
    try {
      await apiFetch(url, { method: "PATCH", body: JSON.stringify({ decision: next }) });
      onChanged();
    } catch (e) {
      setDecision(previous);
      setError(errorMessage(e));
    }
  }

  /** Clicking the current final decision again clears it. */
  async function changeFinalDecision(next: string) {
    const previous = finalDecision;
    const value = next === previous ? null : next;
    setFinalDecision(value);
    setError(null);
    try {
      await apiFetch(url, { method: "PATCH", body: JSON.stringify({ finalDecision: value }) });
      onChanged();
    } catch (e) {
      setFinalDecision(previous);
      setError(errorMessage(e));
    }
  }

  /** Removes the application from the recruitment (the applicant and CV stay). Returns whether it was removed. */
  async function remove(): Promise<boolean> {
    if (!confirm(`Remove ${app.name} from this recruitment? They stay in Applicants with their CV.`)) return false;
    try {
      await apiFetch(url, { method: "DELETE" });
      onChanged();
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    }
  }

  return { decision, finalDecision, error, setError, changeDecision, changeFinalDecision, remove };
}

export type ApplicationDecisions = ReturnType<typeof useApplicationDecisions>;

export function FinalDecisionPicker({ value, onChange }: { value: string | null; onChange: (next: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium tracking-wide text-muted uppercase">Final decision</span>
      <div className="flex gap-1.5" role="radiogroup" aria-label="Final decision">
        {FINAL_DECISIONS.map((d) => (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={value === d}
            onClick={() => onChange(d)}
            title={value === d ? "Click again to clear" : undefined}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${value === d ? FINAL_STYLE[d] : "border-line text-muted hover:border-primary/50 hover:text-ink"}`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

type Props = {
  recruitmentId: number;
  app: RecruitmentApplicationDTO;
  state: ApplicationDecisions;
  /** Whether Job Management (JD + scorecard) has been generated — outreach and screening build on it. */
  jobManagementReady: boolean;
  onChanged: () => void;
  /** Position in the recruitment's ranking, when known. */
  rank?: number;
  /** "wide" puts the AI tools beside the score and assessment (detail page); "stacked" is one column (side panel). */
  layout?: "stacked" | "wide";
  /** The CV contact details and skills — hidden where the page already shows them. */
  showCvDetails?: boolean;
};

export function ApplicationDetails({ recruitmentId, app, state, jobManagementReady, onChanged, rank, layout = "stacked", showCvDetails = true }: Props) {
  const uid = useId();
  const { decision, finalDecision, error, setError, changeDecision } = state;
  const [notes, setNotes] = useState(app.screeningNotes);
  const [savedNotes, setSavedNotes] = useState(app.screeningNotes);
  const [savingNotes, setSavingNotes] = useState(false);
  const needsJobManagement = jobManagementReady ? null : "Generate Job Management first — this builds on its job description and scorecard.";
  const rejected = finalDecision === "Rejected";
  const style = fitStyle(app.category);

  async function persistNotes() {
    await apiFetch(`/api/recruitments/${recruitmentId}/applications/${app.id}`, { method: "PATCH", body: JSON.stringify({ screeningNotes: notes }) });
    setSavedNotes(notes);
  }

  async function saveNotes() {
    setSavingNotes(true);
    setError(null);
    try {
      await persistNotes();
      onChanged();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSavingNotes(false);
    }
  }

  const link = (url: string | null) =>
    url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary-strong hover:underline">{url.replace(/^https?:\/\/(www\.)?/, "")}</a> : missing;

  const overview = (
    <>
      {/* Score */}
      <div className="flex items-center gap-4 rounded-xl border border-line bg-surface-2/60 p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20 font-display font-semibold text-primary-strong">
          {initialsOf(app.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <FitBadge category={app.category} />
            {rank !== undefined && <span className="text-xs text-faint">Rank #{rank}</span>}
          </div>
          {app.scoredAt && <p className="mt-1 text-xs text-faint">Scored {dateFormat.format(new Date(app.scoredAt))}</p>}
        </div>
        <span className={`font-display text-3xl font-semibold tabular-nums ${style?.text ?? "text-muted"}`}>
          {app.score ?? "—"}
          <span className="text-sm font-normal text-faint">/100</span>
        </span>
      </div>

      <div>
        <label className="label" htmlFor={`${uid}-decision`}>Decision</label>
        <select id={`${uid}-decision`} className="input cursor-pointer" value={decision} onChange={(e) => changeDecision(e.target.value)}>
          {DECISIONS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>
    </>
  );

  const toInterview = decision === "Proceed to interview";

  const aiTools = (
    <>
      {!toInterview && !rejected && (
        <p className="rounded-lg border border-dashed border-line px-3 py-2 text-xs text-muted">
          Set the decision to <span className="font-medium text-ink">Proceed to interview</span> to write outreach messages and the screening report.
        </p>
      )}
      {/* Outreach and recruiter screening — only once the applicant is going to interview */}
      {toInterview && (
        <ApplicantAiOutput
          recruitmentId={recruitmentId}
          applicationId={app.id}
          kind="outreach"
          title="Outreach messages"
          description="Personalised LinkedIn InMail, email and WhatsApp messages for this applicant, based on their CV."
          initial={app.outreachMessages}
          blocked={needsJobManagement}
          instructionsPlaceholder="e.g. keep it under 120 words, mention hybrid work, invite for a 20-minute call this week…"
          onGenerated={onChanged}
        />
      )}

      {toInterview && (
        <ApplicantAiOutput
          recruitmentId={recruitmentId}
          applicationId={app.id}
          kind="screening"
          title="Recruiter screening"
          description="Add your interview screening notes, then generate a screening report against the scorecard."
          initial={app.screeningReport}
          blocked={needsJobManagement ?? (!notes.trim() ? "Add interview screening notes first." : null)}
          instructionsPlaceholder="e.g. focus on stakeholder management…"
          beforeGenerate={notes !== savedNotes ? persistNotes : undefined}
          onGenerated={onChanged}
        >
          <div>
            <label className="label" htmlFor={`${uid}-screening-notes`}>Interview screening notes</label>
            <textarea
              id={`${uid}-screening-notes`}
              className="input min-h-36"
              placeholder="Notes from the screening call…"
              maxLength={100_000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="mt-2 flex items-center gap-2">
              <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={saveNotes} disabled={savingNotes || notes === savedNotes}>
                {savingNotes && <Spinner />} Save notes
              </button>
              <span className="text-xs text-faint">{notes === savedNotes ? (savedNotes.trim() ? "Notes saved" : "No notes yet") : "Unsaved changes — saved when you generate"}</span>
            </div>
          </div>
        </ApplicantAiOutput>
      )}

      {/* Final decision messages — candidate-facing rejection, only when the final decision is Rejected */}
      {rejected && (
        <ApplicantAiOutput
          recruitmentId={recruitmentId}
          applicationId={app.id}
          kind="final-decision"
          title="Final decision messages"
          description="A kind rejection email with constructive feedback. Scores and internal notes are never included."
          initial={app.finalDecisionMessages}
          instructionsPlaceholder="e.g. warm and brief, invite them to apply for future roles…"
          onGenerated={onChanged}
        />
      )}
    </>
  );

  const details = (
    <>
      {showCvDetails && (
        <section>
          <h3 className="label">Details from CV</h3>
          <dl className="divide-y divide-line rounded-lg border border-line px-3">
            <Row label="Email">{app.email ? <a href={`mailto:${app.email}`} className="text-primary-strong hover:underline">{app.email}</a> : missing}</Row>
            <Row label="Phone">{app.phone ? <a href={`tel:${app.phone.replace(/\s+/g, "")}`} className="hover:underline">{app.phone}</a> : missing}</Row>
            <Row label="Location">{app.location ?? missing}</Row>
            <Row label="Current title">{app.currentTitle ?? missing}</Row>
            <Row label="Current company">{app.currentCompany ?? missing}</Row>
            <Row label="Experience">{app.experienceYears !== null ? `${app.experienceYears} years` : missing}</Row>
            <Row label="LinkedIn">{link(app.linkedinUrl)}</Row>
            {app.portfolioUrl && <Row label="Portfolio">{link(app.portfolioUrl)}</Row>}
            <Row label="Source">{app.source ?? "—"}</Row>
            <Row label="CV file">{app.cvFileName ?? missing}</Row>
          </dl>
        </section>
      )}

      {showCvDetails && app.skills.length > 0 && (
        <section>
          <h3 className="label">Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {app.skills.map((s) => <span key={s} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs">{s}</span>)}
          </div>
        </section>
      )}

      {/* Assessment */}
      {app.summary && (
        <section>
          <h3 className="label">Assessment</h3>
          <p className="text-sm leading-relaxed">{app.summary}</p>
        </section>
      )}
      {app.strengths.length > 0 && (
        <section>
          <h3 className="label text-fit-strong">Strengths</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink/90">{app.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
        </section>
      )}
      {app.gaps.length > 0 && (
        <section>
          <h3 className="label text-fit-not">Gaps</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink/90">{app.gaps.map((g) => <li key={g}>{g}</li>)}</ul>
        </section>
      )}
    </>
  );

  if (layout === "wide") {
    return (
      <div className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <div className="grid items-start gap-5 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="space-y-5">
            {overview}
            {details}
          </div>
          <div className="min-w-0 space-y-5">{aiTools}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && <Alert>{error}</Alert>}
      {overview}
      {aiTools}
      {details}
    </div>
  );
}
