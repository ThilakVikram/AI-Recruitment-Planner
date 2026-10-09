"use client";

import { useState } from "react";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { PLATFORMS, type Platform } from "@/lib/workflow/constants";
import type { RecruitmentProfileDTO } from "@/lib/recruitment/dto";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { ProfileCard } from "@/components/sourcing/profile-card";

const rank = (profiles: RecruitmentProfileDTO[]) => [...profiles].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

type Props = {
  recruitmentId: number;
  hasJd: boolean;
  profiles: RecruitmentProfileDTO[];
  onChange: (profiles: RecruitmentProfileDTO[]) => void;
  /** Called after a profile is added to the applicants, so the Applicants list refreshes. */
  onApplicantsChanged: () => void;
  onClose: () => void;
};

/** Pop-up for pasting LinkedIn / Naukri profiles and analysing each one against the JD. */
export function ProfileAnalysisDialog({ recruitmentId, hasJd, profiles, onChange, onApplicantsChanged, onClose }: Props) {
  const [platform, setPlatform] = useState<Platform>("LinkedIn");
  const [candidateName, setCandidateName] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [profileText, setProfileText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const base = `/api/recruitments/${recruitmentId}/profiles`;
  const canSubmit = hasJd && candidateName.trim() && profileText.trim().length >= 20 && !busy;

  async function addAndAnalyse(event: React.FormEvent) {
    event.preventDefault();
    setBusy("add");
    setError(null);
    try {
      const { profile, error: aiError } = await apiFetch<{ profile: RecruitmentProfileDTO; error?: string }>(base, {
        method: "POST",
        body: JSON.stringify({ platform, candidateName, referenceUrl: referenceUrl || null, profileText }),
      });
      onChange(rank([...profiles, profile]));
      setCandidateName("");
      setReferenceUrl("");
      setProfileText("");
      if (aiError) setError(`Profile saved, but the analysis failed: ${aiError} Use “Analyse” on the profile to retry.`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function analyse(id: string) {
    setBusy(id);
    setError(null);
    try {
      const { profile } = await apiFetch<{ profile: RecruitmentProfileDTO }>(`${base}/${id}`, { method: "POST" });
      onChange(rank(profiles.map((p) => (p.id === id ? profile : p))));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function addToApplicants(profile: RecruitmentProfileDTO, move: boolean) {
    setBusy(profile.id);
    setError(null);
    setNotice(null);
    try {
      const { result } = await apiFetch<{ result: { applicantId: string; applicantName: string; score: number; isNewApplicant: boolean } }>(
        `${base}/${profile.id}/applicant`,
        { method: "POST", body: JSON.stringify({ move }) },
      );
      onChange(move ? profiles.filter((p) => p.id !== profile.id) : profiles.map((p) => (p.id === profile.id ? { ...p, applicantId: result.applicantId } : p)));
      onApplicantsChanged();
      setNotice(
        `${result.applicantName} ${move ? "moved" : "added"} to applicants${result.isNewApplicant ? "" : " (matched an existing applicant)"} — scored ${result.score}/100 against the JD.`,
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    setBusy(id);
    setError(null);
    try {
      await apiFetch(`${base}/${id}`, { method: "DELETE" });
      onChange(profiles.filter((p) => p.id !== id));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal
      title="Profile analysis"
      description="Paste a LinkedIn or Naukri profile to score it out of 10 against this recruitment’s job description. Links are kept for reference only and are never opened."
      onClose={onClose}
      busy={busy !== null}
      size="xl"
    >
      <div className="space-y-5">
        {!hasJd && <Alert>No job description yet. Add kick-off notes and generate “Job Management” first — profiles are analysed against that JD.</Alert>}
        {error && <Alert>{error}</Alert>}
        {notice && <Alert kind="success">{notice}</Alert>}

        <form onSubmit={addAndAnalyse} className="space-y-3 rounded-xl border border-line p-4">
          <div className="grid gap-3 sm:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <label className="label" htmlFor="profile-platform">Platform</label>
              <select id="profile-platform" className="input cursor-pointer" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
                {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="profile-name">Candidate name *</label>
              <input id="profile-name" className="input" required maxLength={200} value={candidateName} onChange={(e) => setCandidateName(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="profile-url">Profile link (optional)</label>
              <input id="profile-url" className="input" type="url" maxLength={2048} placeholder="https://…" value={referenceUrl} onChange={(e) => setReferenceUrl(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="profile-text">Profile text *</label>
            <textarea
              id="profile-text"
              className="input min-h-36"
              required
              minLength={20}
              maxLength={50_000}
              placeholder="Copy the whole profile (headline, about, experience, skills…) and paste it here."
              value={profileText}
              onChange={(e) => setProfileText(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            {busy === "add" && <span className="mr-auto text-xs text-muted">Analysing with Claude…</span>}
            <button type="submit" className="btn-primary" disabled={!canSubmit}>
              {busy === "add" && <Spinner />} Add &amp; analyse
            </button>
          </div>
        </form>

        <div>
          <h3 className="label">Analysed profiles · best fit first ({profiles.length})</h3>
          {profiles.length ? (
            <ol className="space-y-3">
              {profiles.map((p, i) => (
                <ProfileCard
                  key={p.id}
                  profile={p}
                  rank={p.score === null ? null : i + 1}
                  onRemove={() => remove(p.id)}
                  onAnalyze={hasJd ? () => analyse(p.id) : undefined}
                  analyzing={busy === p.id}
                  actions={
                    p.applicantId ? (
                      <a href={`/applicants/${p.applicantId}`} className="rounded-full border border-fit-strong/40 bg-fit-strong/10 px-2 py-0.5 text-xs font-medium text-fit-strong hover:underline">
                        ✓ In applicants
                      </a>
                    ) : (
                      <>
                        <button type="button" className="btn-primary px-2.5 py-1 text-xs" disabled={busy !== null || !hasJd} onClick={() => addToApplicants(p, false)} title="Create an applicant from this profile and keep it here">
                          {busy === p.id ? <Spinner className="h-3 w-3" /> : "+"} Add to applicants
                        </button>
                        <button type="button" className="btn-secondary px-2.5 py-1 text-xs" disabled={busy !== null || !hasJd} onClick={() => addToApplicants(p, true)} title="Create an applicant from this profile and remove it from this list">
                          Move to applicants
                        </button>
                      </>
                    )
                  }
                />
              ))}
            </ol>
          ) : (
            <p className="text-sm text-faint">No profiles yet.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
