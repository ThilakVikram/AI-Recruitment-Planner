import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler, readJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { jsonWithAuthHeaders, mapAuthError } from "@/lib/api/auth-response";
import { changePasswordSchema } from "@/lib/validation/requests";

/**
 * POST /api/change-password — uses Better Auth's changePassword (verifies the current
 * password, hashes the new one, revokes other sessions), then clears mustChangePassword.
 */
export const POST = apiHandler(async (request) => {
  const user = await requireApiUser(request, { allowPasswordChange: true });
  const body = changePasswordSchema.parse(await readJson(request));
  if (body.newPassword === body.currentPassword) {
    throw new ApiError(400, "The new password must be different from the current password.");
  }

  let authHeaders: Headers;
  try {
    const result = await auth.api.changePassword({
      body: { currentPassword: body.currentPassword, newPassword: body.newPassword, revokeOtherSessions: true },
      headers: request.headers,
      returnHeaders: true,
    });
    authHeaders = result.headers;
  } catch (error) {
    mapAuthError(error, "Current password is incorrect.");
  }

  // Application flag only — authentication data itself is managed by Better Auth.
  await prisma.user.update({ where: { id: user.id }, data: { mustChangePassword: false } });
  return jsonWithAuthHeaders({ ok: true }, authHeaders);
});
