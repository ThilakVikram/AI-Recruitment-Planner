"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, isNavActive } from "./nav";
import { useSidebar } from "./sidebar-context";
import { PageHeaderSlot } from "./page-header";

export function AppHeader() {
  const pathname = usePathname();
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
        {current &&
          (pathname === current.href ? (
            <span className="font-display text-base font-semibold whitespace-nowrap">{current.label}</span>
          ) : (
            // On a detail page the section name links back to its list, breadcrumb-style.
            <Link href={current.href} className="flex items-center gap-1.5 font-display text-base font-semibold whitespace-nowrap text-muted hover:text-ink">
              {current.label}
              <span className="text-faint" aria-hidden>›</span>
            </Link>
          ))}
        <PageHeaderSlot className="flex min-w-0 flex-1 items-center empty:hidden" />
      </div>
    </header>
  );
}
