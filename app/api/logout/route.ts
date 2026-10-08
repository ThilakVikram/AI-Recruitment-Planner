import { auth } from "@/lib/auth/auth";
import { apiHandler } from "@/lib/api/handler";
import { jsonWithAuthHeaders } from "@/lib/api/auth-response";

/** POST /api/logout — revokes the Better Auth session and clears its cookies. */
export const POST = apiHandler(async (request) => {
  try {
    const { headers } = await auth.api.signOut({ headers: request.headers, returnHeaders: true });
    return jsonWithAuthHeaders({ ok: true }, headers);
  } catch {
    // No/invalid session: treat as already logged out.
    return jsonWithAuthHeaders({ ok: true }, null);
  }
});
