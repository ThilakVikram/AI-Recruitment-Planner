"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { NAV, isNavActive } from "./nav";
import { useSidebar } from "./sidebar-context";
import { UserMenu } from "./user-menu";

export function AppSidebar({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname();
  const roleId = useSearchParams().get("role");
  const { open, setOpen } = useSidebar();
  const close = () => setOpen(false);

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={close} aria-hidden />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-surface transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Sidebar"
      >
        <Link href="/" onClick={close} className="flex h-16 shrink-0 items-center gap-2.5 border-b border-line px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display font-bold text-primary-ink">R</span>
          <span className="font-display text-base font-semibold whitespace-nowrap">Recruiter AI Co-Pilot</span>
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main">
          <div className="px-3 pt-2 pb-1.5 text-[0.7rem] font-medium tracking-wider text-faint uppercase">Navigation</div>
          {NAV.map((item) => {
            const active = isNavActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.roleScoped && roleId ? `${item.href}?role=${roleId}` : item.href}
                onClick={close}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-primary/15 text-primary-strong" : "text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-line p-3">
          <UserMenu name={user.name} email={user.email} />
        </div>
      </aside>
    </>
  );
}
