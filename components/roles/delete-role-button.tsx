"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

/** Deleting a role wipes its whole workspace, so the user must type the role name to confirm. */
export function DeleteRoleButton({ roleId, name }: { roleId: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onDelete() {
    setPending(true);
    setError(null);
    try {
      await apiFetch(`/api/roles/${roleId}`, { method: "DELETE" });
      router.push("/roles");
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
      setPending(false);
    }
  }

  return (
    <>
      <button type="button" className="btn-danger w-full" onClick={() => setOpen(true)}>Delete role…</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[12vh]" onClick={() => !pending && setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="card w-full max-w-md space-y-4 p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="delete-role-title">
            <h2 id="delete-role-title" className="font-display text-lg font-semibold">Delete “{name}”?</h2>
            <p className="text-sm text-muted">
              Roles used by a recruitment can’t be deleted. Otherwise this permanently deletes the role. Applicants linked to it are kept but
              unlinked. This cannot be undone.
            </p>
            {error && <Alert>{error}</Alert>}
            <div>
              <label className="label" htmlFor="delete-role-confirm">Type the role name to confirm</label>
              <input id="delete-role-confirm" className="input" autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)} disabled={pending}>Cancel</button>
              <button type="button" className="btn-danger" onClick={onDelete} disabled={pending || typed.trim() !== name.trim()}>
                {pending && <Spinner />} Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
