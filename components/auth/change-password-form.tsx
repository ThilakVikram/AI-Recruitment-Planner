"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

const MIN_LENGTH = 8;

export function ChangePasswordForm({ email, required }: { email: string; required: boolean }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (newPassword.length < MIN_LENGTH) return setError(`New password must be at least ${MIN_LENGTH} characters.`);
    if (newPassword !== confirm) return setError("New passwords do not match.");
    if (newPassword === currentPassword) return setError("The new password must be different from the current password.");

    setPending(true);
    try {
      await apiFetch("/api/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <div>
        <h2 className="font-display text-lg font-semibold">{required ? "Set a new password" : "Change password"}</h2>
        <p className="mt-1 text-sm text-muted">
          {required ? "For security, replace your temporary password before continuing." : `Signed in as ${email}.`}
        </p>
      </div>
      {error && <Alert>{error}</Alert>}
      <input type="email" autoComplete="username" value={email} readOnly hidden />
      <div>
        <label className="label" htmlFor="current">{required ? "Temporary password" : "Current password"}</label>
        <input id="current" type="password" autoComplete="current-password" required className="input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="new">New password</label>
        <input id="new" type="password" autoComplete="new-password" required minLength={MIN_LENGTH} className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <p className="mt-1 text-xs text-faint">At least {MIN_LENGTH} characters.</p>
      </div>
      <div>
        <label className="label" htmlFor="confirm">Confirm new password</label>
        <input id="confirm" type="password" autoComplete="new-password" required className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending && <Spinner />} Update password
      </button>
      {!required && (
        <Link href="/" className="block text-center text-sm text-muted hover:text-ink">Cancel</Link>
      )}
    </form>
  );
}
