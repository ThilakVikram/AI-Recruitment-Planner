"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { ACTIVE_ROLE_COOKIE_NAME } from "./cookie";

export function NewRoleButton({ label = "+ New Role", className = "btn-secondary whitespace-nowrap py-1.5" }: { label?: string; className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const { role } = await apiFetch<{ role: { id: string } }>("/api/roles", {
        method: "POST",
        body: JSON.stringify({ name, description: description || null }),
      });
      document.cookie = `${ACTIVE_ROLE_COOKIE_NAME}=${encodeURIComponent(role.id)}; path=/; max-age=31536000; samesite=lax`;
      setOpen(false);
      setName("");
      setDescription("");
      router.push(`/workflow?role=${role.id}&stage=1`);
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[12vh]" onClick={() => !pending && setOpen(false)}>
          <form
            onSubmit={onSubmit}
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-md space-y-4 p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-role-title"
          >
            <h2 id="new-role-title" className="font-display text-lg font-semibold">New role</h2>
            {error && <Alert>{error}</Alert>}
            <div>
              <label className="label" htmlFor="role-name">Role name</label>
              <input id="role-name" className="input" required maxLength={200} autoFocus placeholder="e.g. Senior Backend Developer" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="role-desc">Description (optional)</label>
              <textarea id="role-desc" className="input min-h-20" maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)} disabled={pending}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={pending || !name.trim()}>
                {pending && <Spinner />} Create role
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
