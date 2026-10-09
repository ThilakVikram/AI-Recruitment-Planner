"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { RoleSwitcher } from "@/components/roles/role-switcher";
import { NewRoleButton } from "@/components/roles/new-role-button";
import { NAV, isNavActive } from "./nav";
import { useSidebar } from "./sidebar-context";

type Props = { roles: { id: string; name: string }[] };

export function AppHeader({ roles }: Props) {
  const pathname = usePathname();
  const roleId = useSearchParams().get("role");
  const activeRole = roles.find((r) => r.id === roleId) ?? null;
  const current = NAV.find((item) => isNavActive(item.href, pathname));
  const { setOpen } = useSidebar();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
      <div className="flex min-h-16 flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
        <button type="button" className="btn-ghost -ml-1.5 px-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {current && <span className="font-display text-base font-semibold whitespace-nowrap">{current.label}</span>}

        {current?.roleScoped && (
          <div className="order-3 flex w-full items-center gap-2 sm:order-none sm:ml-auto sm:w-auto sm:flex-1 sm:justify-end">
            <RoleSwitcher roles={roles} activeRoleId={activeRole?.id ?? null} />
            <NewRoleButton />
          </div>
        )}
      </div>
    </header>
  );
}
