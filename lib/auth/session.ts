import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { ApiError } from "@/lib/api/errors";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  mustChangePassword: boolean;
};

function toAppUser(user: { id: string; name: string; email: string; mustChangePassword?: boolean | null }): AppUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mustChangePassword: user.mustChangePassword !== false,
  };
}

/** Reads and validates the Better Auth session for the current request. */
export async function getCurrentUser(requestHeaders?: Headers): Promise<AppUser | null> {
  const session = await auth.api.getSession({ headers: requestHeaders ?? (await headers()) });
  return session ? toAppUser(session.user) : null;
}

/** For application pages: requires a session and a completed first-login password change. */
export async function requirePageUser(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");
  return user;
}

/**
 * For Route Handlers: requires a valid session. Unless `allowPasswordChange` is set,
 * users who still have to change their temporary password are rejected.
 */
export async function requireApiUser(
  request: Request,
  { allowPasswordChange = false }: { allowPasswordChange?: boolean } = {},
): Promise<AppUser> {
  const user = await getCurrentUser(request.headers);
  if (!user) throw new ApiError(401, "Session expired. Please log in again.");
  if (user.mustChangePassword && !allowPasswordChange) {
    throw new ApiError(403, "You must change your temporary password before continuing.");
  }
  return user;
}
