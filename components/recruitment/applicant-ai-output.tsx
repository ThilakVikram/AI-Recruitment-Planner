"use client";

import { useState } from "react";
import { apiFetch, errorMessage } from "@/lib/api/client";
import type { ApplicantOutputKind } from "@/lib/recruitment/constants";
import { applicantOutputGroup } from "@/lib/recruitment/section-views";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { SectionOutput } from "./section-output";

type Props = {
  recruitmentId: number;
  applicationId: string;
  kind: ApplicantOutputKind;
  title: string;
  description: string;
  /** The stored output (structured + generatedAt), if generated before. */
  initial: unknown;
  /** Why it can't be generated yet, if so. */
  blocked?: string | null;
  instructionsPlaceholder: string;
  /** Runs before generating (e.g. saving unsaved notes). */
  beforeGenerate?: () => Promise<void>;
  onGenerated: () => void;
  /** Extra inputs shown above the Generate button (e.g. interview notes). */
  children?: React.ReactNode;
};

/** One AI output written for a single applicant, inside the applicant panel. */
export function ApplicantAiOutput({ recruitmentId, applicationId, kind, title, description, initial, blocked, instructionsPlaceholder, beforeGenerate, onGenerated, children }: Props) {
  const [output, setOutput] = useState(initial);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const group = applicantOutputGroup(kind, output);

  async function generate() {
    setPending(true);
    setError(null);
    try {
      await beforeGenerate?.();
      const res = await apiFetch<{ output: unknown }>(`/api/recruitments/${recruitmentId}/applications/${applicationId}/generate`, {
        method: "POST",
        body: JSON.stringify({ kind, input }),
      });
      setOutput(res.output);
      onGenerated();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-line p-4">
      <div>
        <h3 className="font-display text-base font-semibold">{title}</h3>
        <p className="text-xs text-muted">{description}</p>
      </div>
      {error && <Alert>{error}</Alert>}
      {children}
      <div>
        <label className="label" htmlFor={`${kind}-instructions`}>Extra instructions (optional)</label>
        <textarea
          id={`${kind}-instructions`}
          className="input min-h-16"
          placeholder={instructionsPlaceholder}
          maxLength={100_000}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={pending}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-primary px-3 py-1.5 text-xs" onClick={generate} disabled={pending || Boolean(blocked)} title={blocked ?? undefined}>
          {pending && <Spinner />} {group ? "Regenerate" : "Generate"}
        </button>
        {pending && <span className="text-xs text-muted">Generating with Claude — this can take a minute…</span>}
      </div>
      {blocked && <p className="text-xs text-fit-average">{blocked}</p>}
      {group && (
        <div className="card overflow-hidden" aria-live="polite">
          <SectionOutput key={String((output as { generatedAt?: string }).generatedAt)} groups={[group]} />
        </div>
      )}
    </section>
  );
}
