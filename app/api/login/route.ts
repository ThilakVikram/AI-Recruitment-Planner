import { auth } from "@/lib/auth/auth";
import { apiHandler, readJson } from "@/lib/api/handler";
import { jsonWithAuthHeaders, mapAuthError } from "@/lib/api/auth-response";
import { loginSchema } from "@/lib/validation/requests";

/** POST /api/login — thin wrapper over Better Auth email/password sign-in. */
export const POST = apiHandler(async (request) => {
  const body = loginSchema.parse(await readJson(request));
  try {
    const { headers, response } = await auth.api.signInEmail({
      body: { email: body.email, password: body.password },
      headers: request.headers,
      returnHeaders: true,
    });
    const user = response.user as { mustChangePassword?: boolean };
    return jsonWithAuthHeaders({ ok: true, mustChangePassword: user.mustChangePassword !== false }, headers);
  } catch (error) {
    mapAuthError(error, "Invalid email or password.");
  }
});
