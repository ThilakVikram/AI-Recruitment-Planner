"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { CV_MAX_FILE_BYTES, CV_MAX_FILES_PER_UPLOAD } from "@/lib/workflow/constants";
import type { CandidateDTO } from "@/lib/workflow/types";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { CandidateDashboard } from "./candidate-dashboard";

type ScoreResult =
  | { fileName: string; ok: true; candidateName: string; score: number; category: string; isNew: boolean }
  | { fileName: string; ok: false; error: string };

const ACCEPT = ".pdf,.txt,application/pdf,text/plain";

export function CvAssessment({
  roleId,
  jd,
  onJdChange,
  onJdBlur,
  jdIsDefault,
  candidates,
}: {
  roleId: string;
  jd: string;
  onJdChange: (v: string) => void;
  onJdBlur: () => void;
  jdIsDefault: boolean;
  candidates: CandidateDTO[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [scoring, setScoring] = useState(false);
  const [rescoring, setRescoring] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScoreResult[]>([]);
  const [dragOver, setDragOver] = useState(false);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    const incoming = Array.from(list);
    const bad = incoming.find((f) => !/\.(pdf|txt)$/i.test(f.name));
    if (bad) return setError(`Invalid CV file type: "${bad.name}". Only PDF and TXT files are accepted.`);
    const big = incoming.find((f) => f.size > CV_MAX_FILE_BYTES);
    if (big) return setError(`"${big.name}" is larger than ${CV_MAX_FILE_BYTES / 1024 / 1024} MB.`);
    setFiles((prev) => {
      const merged = [...prev, ...incoming.filter((f) => !prev.some((p) => p.name === f.name && p.size === f.size))];
      if (merged.length > CV_MAX_FILES_PER_UPLOAD) setError(`Upload at most ${CV_MAX_FILES_PER_UPLOAD} CVs at a time.`);
      return merged.slice(0, CV_MAX_FILES_PER_UPLOAD);
    });
  }

  async function score() {
    setScoring(true);
    setError(null);
    setResults([]);
    try {
      onJdBlur(); // persist any JD edits first
      const form = new FormData();
      form.set("roleId", roleId);
      files.forEach((f) => form.append("files", f));
      const { results } = await apiFetch<{ results: ScoreResult[] }>("/api/score", { method: "POST", body: form });
      setResults(results);
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setScoring(false);
    }
  }

  async function rescore(candidateId: string) {
    setRescoring(candidateId);
    setError(null);
    try {
      await apiFetch("/api/score", { method: "POST", body: JSON.stringify({ roleId, candidateId }) });
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setRescoring(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <label className="label" htmlFor="cv-jd">Job description used for scoring</label>
          {jdIsDefault && <span className="text-xs text-primary-strong">Auto-filled from Stage 1</span>}
        </div>
        <textarea
          id="cv-jd"
          className="input min-h-40 leading-relaxed"
          placeholder="Generate Stage 1 to auto-fill the JD, or paste one here."
          value={jd}
          disabled={scoring}
          onChange={(e) => onJdChange(e.target.value)}
          onBlur={onJdBlur}
        />
        <p className="mt-1 text-xs text-faint">The Stage 1 role scorecard is also used for scoring when available.</p>
      </div>

      <div
        className={`rounded-xl border-2 border-dashed p-6 text-center transition ${dragOver ? "border-primary bg-primary/10" : "border-line bg-surface-2/40"}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <p className="text-sm">
          Drag &amp; drop CVs here, or{" "}
          <button type="button" className="font-medium text-primary-strong underline" onClick={() => inputRef.current?.click()}>
            browse
          </button>
        </p>
        <p className="mt-1 text-xs text-faint">
          PDF or TXT · up to {CV_MAX_FILE_BYTES / 1024 / 1024} MB each · {CV_MAX_FILES_PER_UPLOAD} files per batch
        </p>
        <input ref={inputRef} type="file" accept={ACCEPT} multiple hidden onChange={(e) => addFiles(e.target.files)} />

        {files.length > 0 && (
          <ul className="mx-auto mt-4 max-w-md space-y-1 text-left text-sm">
            {files.map((f) => (
              <li key={f.name + f.size} className="flex items-center justify-between gap-2 rounded-md bg-surface-2 px-3 py-1.5">
                <span className="truncate">{f.name}</span>
                <button type="button" className="text-xs text-faint hover:text-fit-not" disabled={scoring} onClick={() => setFiles((p) => p.filter((x) => x !== f))}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary" disabled={!files.length || scoring || !jd.trim()} onClick={score}>
          {scoring && <Spinner />} {scoring ? `Scoring ${files.length} CV(s)…` : `Score ${files.length || ""} CV${files.length === 1 ? "" : "s"}`}
        </button>
        {!jd.trim() && <span className="text-xs text-fit-average">A job description is required before scoring.</span>}
      </div>

      {error && <Alert>{error}</Alert>}
      {results.length > 0 && (
        <ul className="space-y-1.5 text-sm">
          {results.map((r) => (
            <li key={r.fileName}>
              {r.ok ? (
                <Alert kind="success">
                  {r.fileName}: {r.candidateName} — {r.score}/100 ({r.category}){r.isNew ? "" : " · existing candidate updated, tracker decision & notes kept"}
                </Alert>
              ) : (
                <Alert>
                  {r.fileName}: {r.error}
                </Alert>
              )}
            </li>
          ))}
        </ul>
      )}

      <CandidateDashboard candidates={candidates} onRescore={rescore} rescoringId={rescoring} />
    </div>
  );
}
