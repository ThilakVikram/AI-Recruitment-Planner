"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

export function LoginForm({ next, expired }: { next: string; expired: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { data, error } = await authClient.signIn.email({ email: email.trim(), password });
    if (error) {
      setPending(false);
      setError(error.status === 429 ? "Too many attempts. Please wait a minute and try again." : "Invalid email or password.");
      return;
    }
    const mustChange = (data?.user as { mustChangePassword?: boolean } | undefined)?.mustChangePassword !== false;
    router.replace(mustChange ? "/change-password" : next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      {expired && <Alert kind="info">Session expired. Please log in again.</Alert>}
      {error && <Alert>{error}</Alert>}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="username" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="current-password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending && <Spinner />} Log in
      </button>
    </form>
  );
}
