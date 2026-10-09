"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { initialsOf } from "./initials";

/** Account button pinned to the bottom of the sidebar; the menu opens upwards. */
export function UserMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function logout() {
    await authClient.signOut().catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface-2"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary-strong">
          {initialsOf(name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="block truncate text-xs text-muted">{email}</span>
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-faint" aria-hidden>
          <path d="m7 15 5-5 5 5" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="card absolute right-0 bottom-full left-0 mb-2 p-1.5 shadow-2xl">
          <a role="menuitem" href="/change-password" className="block rounded-md px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-ink">
            Change password
          </a>
          <button role="menuitem" type="button" onClick={logout} className="block w-full rounded-md px-3 py-2 text-left text-sm text-muted hover:bg-surface-2 hover:text-ink">
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
