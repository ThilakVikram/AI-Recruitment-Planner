"use client";

import { useState } from "react";
import { apiFetch, errorMessage } from "@/lib/api/client";
import type { SectionDefinition } from "@/lib/recruitment/constants";
import type { RecruitmentSectionDTO } from "@/lib/recruitment/dto";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  recruitmentId: number;
  def: SectionDefinition;
  current: RecruitmentSectionDTO | undefined;
  /** Whether step 1 (kick-off notes) has content. */
  notesReady: boolean;
  /** Set when a prerequisite section hasn't been generated yet. */
  blockedReason?: string | null;
  onClose: () => void;
  onGenerated: (section: RecruitmentSectionDTO) => void;
};

/** Pop-up for running one AI section with optional/required instructions. */
export function GenerateDialog({ recruitmentId, def, current, notesReady, blockedReason, onClose, onGenerated }: Props) {
  const [input, setInput] = useState(current?.input ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inputOk = !def.inputMin || input.trim().length >= def.inputMin;
  const kickoffOk = def.key !== "kickoff" || notesReady;

  async function generate() {
    setPending(true);
    setError(null);
    try {
      const { section } = await apiFetch<{ section: RecruitmentSectionDTO }>(`/api/recruitments/${recruitmentId}/generate`, {
        method: "POST",
        body: JSON.stringify({ section: def.key, input }),
      });
      onGenerated(section);
      onClose();
    } catch (e) {
      setError(errorMessage(e));
      setPending(false);
    }
  }

  return (
    <Modal
      title={current?.output ? `Regenerate: ${def.title}` : def.title}
      description={def.description}
      onClose={onClose}
      busy={pending}
      size="lg"
      footer={
        <>
          {pending && <span className="mr-auto text-xs text-muted">Generating with Claude — this can take a minute or two…</span>}
          <button type="button" className="btn-ghost" onClick={onClose} disabled={pending}>Cancel</button>
          <button type="button" className="btn-primary" onClick={generate} disabled={pending || !inputOk || !kickoffOk || Boolean(blockedReason)}>
            {pending && <Spinner />} {current?.output ? "Regenerate" : "Generate"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert>{error}</Alert>}
        {blockedReason && <Alert>{blockedReason}</Alert>}
        {current?.output && (
          <Alert kind="info">This replaces the current output.</Alert>
        )}
        {def.key === "kickoff" && (
          <p className="rounded-lg border border-line bg-surface-2/60 px-3 py-2 text-sm text-muted">
            {notesReady ? "Uses your kick-off meeting notes from step 1 (the kick-off form, plus the full notes if you pasted them) and the role details." : "Add kick-off meeting notes in step 1 first."}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {def.produces.map((p) => <span key={p} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">{p}</span>)}
        </div>

        <div>
          <label className="label" htmlFor="generate-input">{def.inputLabel}</label>
          <textarea
            id="generate-input"
            className="input min-h-28"
            placeholder={def.inputPlaceholder}
            maxLength={100_000}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          {def.inputMin && <p className="mt-1 text-xs text-faint">Required — at least {def.inputMin} characters.</p>}
        </div>
      </div>
    </Modal>
  );
}
