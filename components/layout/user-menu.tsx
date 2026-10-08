"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";

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

  const initials = name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex items-center gap-2 rounded-full border border-line bg-surface-2 py-1 pr-3 pl-1 text-sm hover:bg-surface-3"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary-strong">{initials}</span>
        <span className="hidden max-w-32 truncate sm:inline">{name}</span>
      </button>
      {open && (
        <div role="menu" className="card absolute right-0 mt-2 w-60 p-1.5 shadow-2xl">
          <div className="px-3 py-2">
            <div className="truncate text-sm font-medium">{name}</div>
            <div className="truncate text-xs text-muted">{email}</div>
          </div>
          <div className="my-1 border-t border-line" />
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
