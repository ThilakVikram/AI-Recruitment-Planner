"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, errorMessage } from "@/lib/api/client";
import type { ApplicantFileKind } from "@/lib/applicants/constants";
import { formatBytes, type ApplicantFileDTO } from "@/lib/applicants/dto";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { DocumentPicker } from "./document-picker";

const PREVIEWABLE = new Set(["application/pdf", "image/png", "image/jpeg", "text/plain"]);
const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function ApplicantFiles({ applicantId, initialFiles, initialError }: { applicantId: string; initialFiles: ApplicantFileDTO[]; initialError?: string }) {
  const router = useRouter();
  const [files, setFiles] = useState(initialFiles);
  const [docs, setDocs] = useState<{ kind: ApplicantFileKind; files: File[] }>({ kind: "CV", files: [] });
  const [resetKey, setResetKey] = useState(0);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [busy, setBusy] = useState<string | null>(null);

  async function upload() {
    setBusy("upload");
    setError(null);
    const form = new FormData();
    form.set("kind", docs.kind);
    docs.files.forEach((f) => form.append("files", f));
    try {
      const { files: next } = await apiFetch<{ files: ApplicantFileDTO[] }>(`/api/applicants/${applicantId}/files`, { method: "POST", body: form });
      setFiles(next);
      setDocs((d) => ({ ...d, files: [] }));
      setResetKey((k) => k + 1);
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function remove(file: ApplicantFileDTO) {
    if (!confirm(`Delete "${file.originalFileName}"? This cannot be undone.`)) return;
    setBusy(file.id);
    setError(null);
    try {
      await apiFetch(`/api/applicants/${applicantId}/files/${file.id}`, { method: "DELETE" });
      setFiles((fs) => fs.filter((f) => f.id !== file.id));
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  const base = `/api/applicants/${applicantId}/files`;

  return (
    <section className="card p-5">
      <h2 className="font-display text-base font-semibold">Documents</h2>
      <p className="mt-0.5 text-sm text-muted">CVs, cover letters, certificates and other files. PDF, DOC, DOCX, TXT, PNG or JPG up to 10 MB.</p>

      {error && <div className="mt-3"><Alert>{error}</Alert></div>}

      {files.length ? (
        <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
          {files.map((file) => (
            <li key={file.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2.5">
              <span className="rounded-md bg-surface-3 px-2 py-0.5 text-xs text-muted">{file.kind}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium" title={file.originalFileName}>{file.originalFileName}</span>
              <span className="text-xs text-faint">
                {formatBytes(file.sizeBytes)} · {dateFormat.format(new Date(file.createdAt))}
              </span>
              <span className="flex gap-1">
                {PREVIEWABLE.has(file.mimeType) && (
                  <a href={`${base}/${file.id}?inline=1`} target="_blank" rel="noopener noreferrer" className="btn-ghost px-2 py-1 text-xs">View</a>
                )}
                <a href={`${base}/${file.id}`} className="btn-ghost px-2 py-1 text-xs">Download</a>
                <button type="button" className="btn-ghost px-2 py-1 text-xs hover:text-fit-not" disabled={busy !== null} onClick={() => remove(file)}>
                  {busy === file.id ? <Spinner /> : "Delete"}
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-line px-3 py-5 text-center text-sm text-muted">No documents yet.</p>
      )}

      <div className="mt-4 space-y-2">
        <DocumentPicker kind={docs.kind} files={docs.files} onChange={setDocs} disabled={busy !== null} resetKey={resetKey} />
        <div className="flex justify-end">
          <button type="button" className="btn-secondary" disabled={!docs.files.length || busy !== null} onClick={upload}>
            {busy === "upload" && <Spinner />} Upload {docs.files.length > 1 ? `${docs.files.length} files` : "file"}
          </button>
        </div>
      </div>
    </section>
  );
}
