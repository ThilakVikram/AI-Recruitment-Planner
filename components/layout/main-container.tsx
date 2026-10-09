"use client";

import { usePathname } from "next/navigation";

/** Pages that use the full screen width (multi-column workspaces). */
const WIDE_ROUTES = [/^\/recruitment\/[^/]+$/];

export function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const wide = WIDE_ROUTES.some((r) => r.test(pathname));
  return <main className={`mx-auto w-full flex-1 px-4 py-6 sm:px-6 ${wide ? "max-w-[120rem]" : "max-w-7xl"}`}>{children}</main>;
}
