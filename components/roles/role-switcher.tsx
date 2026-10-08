"use client";

import { usePathname, useRouter } from "next/navigation";
import { ACTIVE_ROLE_COOKIE_NAME } from "./cookie";

export function RoleSwitcher({ roles, activeRoleId }: { roles: { id: string; name: string }[]; activeRoleId: string | null }) {
  const router = useRouter();
  const pathname = usePathname();

  if (!roles.length) return <span className="text-sm text-muted">No roles yet</span>;

  return (
    <label className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-sm">
      <span className="text-xs font-medium tracking-wide text-muted uppercase">Role</span>
      <select
        className="input min-w-0 flex-1 cursor-pointer py-1.5 font-medium"
        value={activeRoleId ?? ""}
        onChange={(e) => {
          const id = e.target.value;
          document.cookie = `${ACTIVE_ROLE_COOKIE_NAME}=${encodeURIComponent(id)}; path=/; max-age=31536000; samesite=lax`;
          // Navigating to the new ?role= re-renders the whole role workspace from the server.
          router.push(`${pathname}?role=${encodeURIComponent(id)}`);
        }}
        aria-label="Current role"
      >
        {!activeRoleId && <option value="">Select a role…</option>}
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
    </label>
  );
}
