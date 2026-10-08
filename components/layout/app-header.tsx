"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { RoleSwitcher } from "@/components/roles/role-switcher";
import { NewRoleButton } from "@/components/roles/new-role-button";
import { UserMenu } from "./user-menu";

type Props = { user: { name: string; email: string }; roles: { id: string; name: string }[] };

const NAV = [
  { href: "/workflow", label: "Workflow" },
  { href: "/tracker", label: "Candidate Tracker" },
];

export function AppHeader({ user, roles }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const roleId = searchParams.get("role");
  const activeRole = roles.find((r) => r.id === roleId) ?? null;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
        <Link href={roleId ? `/workflow?role=${roleId}` : "/workflow"} className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display font-bold text-primary-ink">R</span>
          <span className="font-display text-base font-semibold whitespace-nowrap">Recruiter AI Co-Pilot</span>
        </Link>

        <div className="order-3 flex w-full items-center gap-2 sm:order-none sm:ml-4 sm:w-auto sm:flex-1">
          <RoleSwitcher roles={roles} activeRoleId={activeRole?.id ?? null} />
          <NewRoleButton />
        </div>

        <div className="ml-auto">
          <UserMenu name={user.name} email={user.email} />
        </div>
      </div>

      <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6" aria-label="Main">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={roleId ? `${item.href}?role=${roleId}` : item.href}
              className={`border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition ${
                active ? "border-primary text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
