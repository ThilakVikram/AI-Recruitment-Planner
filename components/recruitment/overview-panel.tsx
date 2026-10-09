"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { RECRUITMENT_STATUSES } from "@/lib/recruitment/constants";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { RoleStatusBadge } from "@/components/roles/role-badges";

export type OverviewRole = { id: string; name: string; status: string; facts: [string, string][]; requiredSkills: string[] };

export function OverviewPanel({
  recruitmentId,
  role,
  summary: initialSummary,
  status: initialStatus,
  openings: initialOpenings,
}: {
  recruitmentId: number;
  role: OverviewRole;
  summary: string;
  status: string;
  openings: number;
}) {
  const router = useRouter();
  const [summary, setSummary] = useState(initialSummary);
  const [draft, setDraft] = useState(initialSummary);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [openings, setOpenings] = useState(String(initialOpenings));
  const [savedOpenings, setSavedOpenings] = useState(initialOpenings);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save(patch: { summary?: string; status?: string; openings?: number }) {
    setPending(true);
    setError(null);
    try {
      await apiFetch(`/api/recruitments/${recruitmentId}`, { method: "PATCH", body: JSON.stringify(patch) });
      if (patch.summary !== undefined) {
        setSummary(patch.summary);
        setEditing(false);
      }
      if (patch.status !== undefined) setStatus(patch.status);
      if (patch.openings !== undefined) setSavedOpenings(patch.openings);
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="card p-4">
      {error && <div className="mb-3"><Alert>{error}</Alert></div>}

      <div className="flex items-center justify-between gap-2">
        <h2 className="label mb-0">Status</h2>
        <select
          className="input w-auto cursor-pointer py-1 text-xs"
          value={status}
          disabled={pending}
          onChange={(e) => save({ status: e.target.value })}
          aria-label="Recruitment status"
        >
          {RECRUITMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <label className="label mb-0" htmlFor="recruitment-openings">Openings</label>
        <input
          id="recruitment-openings"
          type="number"
          min={1}
          max={999}
          className="input w-20 py-1 text-right text-xs"
          value={openings}
          disabled={pending}
          onChange={(e) => setOpenings(e.target.value)}
          onBlur={() => {
            const n = Math.round(Number(openings));
            if (Number.isFinite(n) && n >= 1 && n <= 999 && n !== savedOpenings) save({ openings: n });
            else setOpenings(String(savedOpenings));
          }}
        />
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="label">Role</h2>
          <RoleStatusBadge status={role.status} />
        </div>
        <Link href={`/roles/${role.id}`} className="font-semibold hover:text-primary-strong">{role.name}</Link>
        {role.facts.length > 0 && (
          <dl className="mt-2 space-y-1 text-xs">
            {role.facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        {role.requiredSkills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {role.requiredSkills.map((s) => <span key={s} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[0.7rem] text-muted">{s}</span>)}
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <div className="flex items-center justify-between">
          <h2 className="label">Summary</h2>
          {!editing && (
            <button type="button" className="text-xs text-primary-strong hover:underline" onClick={() => { setDraft(summary); setEditing(true); }}>
              {summary.trim() ? "Edit" : "Add"}
            </button>
          )}
        </div>
        {editing ? (
          <div className="space-y-2">
            <textarea className="input min-h-28 text-sm" maxLength={5000} placeholder="e.g. Backfill for Arun’s team in Chennai — 2 hires needed before Q1, focus on payments experience." value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus aria-label="Summary" />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost px-2.5 py-1 text-xs" onClick={() => setEditing(false)} disabled={pending}>Cancel</button>
              <button type="button" className="btn-primary px-2.5 py-1 text-xs" disabled={pending} onClick={() => save({ summary: draft })}>
                {pending && <Spinner className="h-3 w-3" />} Save
              </button>
            </div>
          </div>
        ) : (
          summary.trim() ? <p className="text-sm whitespace-pre-wrap text-ink/90">{summary}</p> : <p className="text-sm text-faint">No summary yet.</p>
        )}
      </div>
    </section>
  );
}
