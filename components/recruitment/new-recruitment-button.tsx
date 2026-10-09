"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { roleOptionLabel } from "@/lib/roles/constants";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";

type Role = { id: string; name: string; status: string; openings: number };

/** A recruitment needs a role and its number of openings (prefilled from the role); the summary can be added later. */
export function NewRecruitmentButton({ roles, defaultRoleId = "", className = "btn-primary" }: { roles: Role[]; defaultRoleId?: string; className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roleId, setRoleId] = useState(defaultRoleId);
  const [openings, setOpenings] = useState(() => String(roles.find((r) => r.id === defaultRoleId)?.openings ?? 1));
  const openingsCount = Math.round(Number(openings));
  const openingsOk = Number.isFinite(openingsCount) && openingsCount >= 1 && openingsCount <= 999;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const { recruitment } = await apiFetch<{ recruitment: { slug: string } }>("/api/recruitments", {
        method: "POST",
        body: JSON.stringify({ roleId, openings: openingsCount }),
      });
      router.push(`/recruitment/${recruitment.slug}`);
    } catch (e) {
      setError(errorMessage(e));
      setPending(false);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>+ New recruitment</button>
      {open && (
        <Modal title="New recruitment" description="Pick the role you’re hiring for and how many positions to fill." onClose={() => setOpen(false)} busy={pending}>
          {roles.length ? (
            <form id="new-recruitment" onSubmit={onSubmit} className="space-y-4">
              {error && <Alert>{error}</Alert>}
              <div>
                <label className="label" htmlFor="recruitment-role">Role *</label>
                <select id="recruitment-role" className="input cursor-pointer" required value={roleId} onChange={(e) => {
                    setRoleId(e.target.value);
                    setOpenings(String(roles.find((r) => r.id === e.target.value)?.openings ?? 1));
                  }} autoFocus>
                  <option value="" disabled>Select a role…</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{roleOptionLabel(r)}</option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-faint">
                  Not listed? <Link href="/roles/new" className="text-primary-strong hover:underline">Create the role first</Link>.
                </p>
              </div>
              <div>
                <label className="label" htmlFor="recruitment-openings">Openings *</label>
                <input
                  id="recruitment-openings"
                  type="number"
                  className="input w-32"
                  required
                  min={1}
                  max={999}
                  value={openings}
                  onChange={(e) => setOpenings(e.target.value)}
                />
                <p className="mt-1 text-xs text-faint">Number of positions to fill in this recruitment — defaults to the role’s openings.</p>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" className="btn-ghost" onClick={() => setOpen(false)} disabled={pending}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={pending || !roleId || !openingsOk}>
                  {pending && <Spinner />} Create recruitment
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 text-sm text-muted">
              <p>A recruitment is always for a role, and you don’t have any roles yet.</p>
              <Link href="/roles/new" className="btn-primary">Create a role</Link>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
