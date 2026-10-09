"use client";

import { useRef, useState } from "react";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { CV_MAX_FILE_BYTES } from "@/lib/workflow/constants";
import { RECRUITMENT_CV_MAX_FILES } from "@/lib/recruitment/constants";
import { formatBytes } from "@/lib/applicants/dto";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { FitBadge } from "@/components/ui/fit-badge";

type Result =
  | { fileName: string; ok: true; applicantName: string; score: number; category: string; isNewApplicant: boolean }
  | { fileName: string; ok: false; error: string };

/** Checks type and size in the browser; the server re-validates everything. */
export function checkCvFiles(incoming: File[], existing: File[] = []): { files: File[]; error: string | null } {
  const bad = incoming.find((f) => !/\.(pdf|txt)$/i.test(f.name));
  if (bad) return { files: existing, error: `“${bad.name}” isn’t a PDF or TXT file.` };
  const big = incoming.find((f) => f.size > CV_MAX_FILE_BYTES);
  if (big) return { files: existing, error: `“${big.name}” is larger than ${CV_MAX_FILE_BYTES / 1024 / 1024} MB.` };
  const merged = [...existing, ...incoming.filter((f) => !existing.some((e) => e.name === f.name && e.size === f.size))];
  return {
    files: merged.slice(0, RECRUITMENT_CV_MAX_FILES),
    error: merged.length > RECRUITMENT_CV_MAX_FILES ? `Upload at most ${RECRUITMENT_CV_MAX_FILES} CVs at a time.` : null,
  };
}

export function UploadDialog({ recruitmentId, hasJd, initialFiles, onClose, onUploaded }: { recruitmentId: number; hasJd: boolean; initialFiles: File[]; onClose: () => void; onUploaded: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState(initialFiles);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[] | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState(false);

  function add(list: FileList | null) {
    if (!list) return;
    const next = checkCvFiles(Array.from(list), files);
    setFiles(next.files);
    setError(next.error);
    setResults(null);
  }

  async function upload() {
    setPending(true);
    setError(null);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      const { results } = await apiFetch<{ results: Result[] }>(`/api/recruitments/${recruitmentId}/applications`, { method: "POST", body: form });
      setResults(results);
      setFiles([]);
      onUploaded();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      title="Attach applicant files"
      description="Each CV is saved to the applicant’s record, scored against this recruitment’s job description and added to the list."
      onClose={onClose}
      busy={pending}
      size="lg"
      footer={
        <>
          {pending && <span className="mr-auto text-xs text-muted">Scoring {files.length} CV{files.length === 1 ? "" : "s"} with Claude…</span>}
          <button type="button" className="btn-ghost" onClick={onClose} disabled={pending}>{results ? "Done" : "Cancel"}</button>
          <button type="button" className="btn-primary" onClick={upload} disabled={pending || !files.length || !hasJd}>
            {pending && <Spinner />} Upload &amp; score {files.length ? `(${files.length})` : ""}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {!hasJd && <Alert>No job description yet. Add kick-off notes and generate “Job Management” first — CVs are scored against that JD.</Alert>}
        {error && <Alert>{error}</Alert>}

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); add(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${dragOver ? "border-primary bg-primary/10" : "border-line hover:border-primary/60"}`}
        >
          <p className="text-sm font-medium">Drop CVs here or click to browse</p>
          <p className="mt-1 text-xs text-muted">PDF or TXT · up to {CV_MAX_FILE_BYTES / 1024 / 1024} MB each · {RECRUITMENT_CV_MAX_FILES} per upload</p>
          <input ref={inputRef} type="file" multiple accept=".pdf,.txt,application/pdf,text/plain" className="hidden" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
        </div>

        {files.length > 0 && (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {files.map((f) => (
              <li key={f.name + f.size} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <span className="text-xs text-faint">{formatBytes(f.size)}</span>
                <button type="button" className="text-faint hover:text-fit-not" disabled={pending} onClick={() => setFiles((fs) => fs.filter((x) => x !== f))} aria-label={`Remove ${f.name}`}>×</button>
              </li>
            ))}
          </ul>
        )}

        {results && (
          <div>
            <h3 className="label">Results</h3>
            <ul className="divide-y divide-line rounded-lg border border-line">
              {results.map((r) => (
                <li key={r.fileName} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
                  {r.ok ? (
                    <>
                      <span className="min-w-0 flex-1 truncate font-medium">{r.applicantName}</span>
                      <span className="text-xs text-faint">{r.isNewApplicant ? "New applicant" : "Existing applicant"}</span>
                      <span className="font-display font-semibold tabular-nums">{r.score}</span>
                      <FitBadge category={r.category} />
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate">{r.fileName}</span>
                      <span className="text-xs text-fit-not">{r.error}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
