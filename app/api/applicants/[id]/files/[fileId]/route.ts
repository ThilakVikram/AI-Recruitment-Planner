import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { deleteApplicantFile, getApplicantFile } from "@/lib/db/applicants";

type Ctx = RouteContext<"/api/applicants/[id]/files/[fileId]">;

/** Types a browser can safely preview; everything else is always downloaded. */
const INLINE_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "text/plain"]);

/** GET /api/applicants/:id/files/:fileId[?inline=1] — download (or preview) a stored document. */
export const GET = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const { id, fileId } = await ctx.params;
  const file = await getApplicantFile(id, fileId);
  if (!file) throw new ApiError(404, "File not found.");

  const inline = new URL(request.url).searchParams.get("inline") === "1" && INLINE_TYPES.has(file.mimeType);
  const asciiName = file.originalFileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return new Response(file.data, {
    headers: {
      "Content-Type": file.mimeType === "text/plain" ? "text/plain; charset=utf-8" : file.mimeType,
      "Content-Length": String(file.data.byteLength),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.originalFileName)}`,
      "Cache-Control": "private, no-store",
      // Uploaded content must never run script in our origin. (Chrome refuses to render PDFs in a sandbox;
      // PDFs are served with a fixed type and the global nosniff header instead.)
      ...(file.mimeType === "application/pdf" ? {} : { "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'" }),
    },
  });
});

/** DELETE /api/applicants/:id/files/:fileId */
export const DELETE = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const { id, fileId } = await ctx.params;
  if (!(await deleteApplicantFile(id, fileId))) throw new ApiError(404, "File not found.");
  return NextResponse.json({ ok: true });
});
