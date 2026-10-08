import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { listRoles, type RoleSummary } from "@/lib/db/roles";

import { ACTIVE_ROLE_COOKIE_NAME } from "@/components/roles/cookie";

export const ACTIVE_ROLE_COOKIE = ACTIVE_ROLE_COOKIE_NAME;

/**
 * Resolves the role whose workspace a page shows: ?role= → last-used role cookie → first role.
 * Always canonicalises the URL to carry ?role= so the header and page agree.
 */
export async function resolveActiveRole(
  pathname: string,
  searchParams: Record<string, string | string[] | undefined>,
): Promise<{ roles: RoleSummary[]; role: RoleSummary | null }> {
  const roles = await listRoles();
  if (!roles.length) return { roles, role: null };

  const requested = typeof searchParams.role === "string" ? searchParams.role : undefined;
  const fromUrl = requested ? roles.find((r) => r.id === requested) : undefined;
  if (fromUrl) return { roles, role: fromUrl };

  const remembered = (await cookies()).get(ACTIVE_ROLE_COOKIE)?.value;
  const fallback = roles.find((r) => r.id === remembered) ?? roles[0];

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string" && key !== "role") params.set(key, value);
  }
  params.set("role", fallback.id);
  redirect(`${pathname}?${params.toString()}`);
}
