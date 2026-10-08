"use client";

import { useState } from "react";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { PLATFORMS, type Platform } from "@/lib/workflow/constants";
import type { SourcingProfileDTO } from "@/lib/workflow/types";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { ProfileCard } from "./profile-card";

type ApiProfile = Omit<SourcingProfileDTO, "analysis"> & { analysis: SourcingProfileDTO["analysis"] };

function rank(profiles: SourcingProfileDTO[]) {
  return [...profiles].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

export function SourcingProfiles({ roleId, initialProfiles }: { roleId: string; initialProfiles: SourcingProfileDTO[] }) {
  const [profiles, setProfiles] = useState(() => rank(initialProfiles));
  const [platform, setPlatform] = useState<Platform>("LinkedIn");
  const [candidateName, setCandidateName] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [profileText, setProfileText] = useState("");
  const [adding, setAdding] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function addProfile(event: React.FormEvent) {
    event.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const { profile } = await apiFetch<{ profile: ApiProfile }>("/api/sourcing-profiles", {
        method: "POST",
        body: JSON.stringify({ roleId, platform, candidateName, referenceUrl: referenceUrl || null, profileText }),
      });
      setProfiles((p) => rank([...p, { ...profile, analysis: null }]));
      setCandidateName("");
      setReferenceUrl("");
      setProfileText("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await apiFetch(`/api/sourcing-profiles/${id}?roleId=${encodeURIComponent(roleId)}`, { method: "DELETE" });
      setProfiles((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function analyze() {
    setAnalyzing(true);
    setError(null);
    setNotice(null);
    try {
      const { results, profiles: updated } = await apiFetch<{
        results: { id: string; ok: boolean; error?: string }[];
        profiles: ApiProfile[];
      }>("/api/sourcing-profiles/analyze", { method: "POST", body: JSON.stringify({ roleId }) });
      setProfiles(rank(updated));
      const failed = results.filter((r) => !r.ok);
      if (failed.length) setError(`${failed.length} profile(s) could not be analysed: ${failed[0].error}`);
      else setNotice(`Analysed ${results.length} profile(s).`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setAnalyzing(false);
    }
  }

  const analysed = profiles.filter((p) => p.score !== null);

  return (
    <section className="space-y-4 border-t border-line pt-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Profile Analyzer</h3>
          <p className="text-sm text-muted">
            Paste LinkedIn or Naukri profiles. Only the pasted text is analysed — reference URLs are never opened or fetched.
          </p>
        </div>
        <button type="button" className="btn-primary" disabled={!profiles.length || analyzing} onClick={analyze}>
          {analyzing && <Spinner />} Analyse {profiles.length || ""} profile{profiles.length === 1 ? "" : "s"}
        </button>
      </div>

      {error && <Alert>{error}</Alert>}
      {notice && <Alert kind="success">{notice}</Alert>}

      <form onSubmit={addProfile} className="grid gap-3 rounded-xl border border-line bg-surface-2/50 p-4 md:grid-cols-3">
        <div>
          <label className="label" htmlFor="sp-platform">Platform</label>
          <select id="sp-platform" className="input" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
            {PLATFORMS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="sp-name">Candidate name</label>
          <input id="sp-name" className="input" required maxLength={200} value={candidateName} onChange={(e) => setCandidateName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="sp-url">Reference URL (optional)</label>
          <input id="sp-url" className="input" type="url" maxLength={2048} placeholder="https://…" value={referenceUrl} onChange={(e) => setReferenceUrl(e.target.value)} />
        </div>
        <div className="md:col-span-3">
          <label className="label" htmlFor="sp-text">Profile text</label>
          <textarea
            id="sp-text"
            className="input min-h-32"
            required
            minLength={20}
            placeholder="Paste the headline, about, experience, skills… exactly as shown on the profile."
            value={profileText}
            onChange={(e) => setProfileText(e.target.value)}
          />
        </div>
        <div className="md:col-span-3">
          <button type="submit" className="btn-secondary" disabled={adding}>
            {adding && <Spinner />} + Add profile
          </button>
        </div>
      </form>

      {profiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">
            {analysed.length ? "Ranked shortlist" : "Profiles"} <span className="font-normal text-faint">({profiles.length})</span>
          </h4>
          <ol className="space-y-3">
            {profiles.map((p, i) => (
              <ProfileCard key={p.id} profile={p} rank={p.score !== null ? i + 1 : null} onRemove={() => remove(p.id)} />
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
