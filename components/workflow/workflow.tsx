"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { getStage, STAGE_COUNT } from "@/lib/workflow/stages";
import type { CandidateDTO, SourcingProfileDTO, StageDTO } from "@/lib/workflow/types";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Stepper } from "./stepper";
import { StageHeader } from "./stage-header";
import { StageOutput } from "./stage-output";
import { CandidatePicker } from "./candidate-picker";
import { SourcingProfiles } from "@/components/sourcing/sourcing-profiles";
import { CvAssessment } from "@/components/cv-assessment/cv-assessment";

type Props = {
  role: { id: string; name: string; description: string | null };
  initialStage: number;
  stages: StageDTO[];
  candidates: CandidateDTO[];
  profiles: SourcingProfileDTO[];
  defaultJd: string;
};

type ApiStage = { stageNumber: number; input: string | null; inputData: { candidateIds?: string[] } | null; output: string | null; updatedAt: string };

function fromApi(s: ApiStage): StageDTO {
  return {
    stageNumber: s.stageNumber,
    input: s.input ?? "",
    candidateIds: s.inputData?.candidateIds ?? [],
    output: s.output ?? "",
    updatedAt: s.output ? s.updatedAt : null,
  };
}

export function Workflow({ role, initialStage, stages: initialStages, candidates, profiles, defaultJd }: Props) {
  const router = useRouter();
  const [current, setCurrent] = useState(initialStage);
  const [stages, setStages] = useState<Record<number, StageDTO>>(() =>
    Object.fromEntries(initialStages.map((s) => [s.stageNumber, s])),
  );
  const [drafts, setDrafts] = useState<Record<number, string>>(() =>
    Object.fromEntries(initialStages.map((s) => [s.stageNumber, s.input])),
  );
  const [selections, setSelections] = useState<Record<number, string[]>>(() => {
    const initial = Object.fromEntries(initialStages.map((s) => [s.stageNumber, s.candidateIds]));
    // Stage 7 defaults to candidates marked "Reject" in the tracker.
    if (!initial[7]?.length) initial[7] = candidates.filter((c) => c.decision === "Reject").map((c) => c.id);
    return initial;
  });
  const [generating, setGenerating] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<number, string | null>>({});

  const stage = getStage(current);
  const record = stages[current];
  const completed = useMemo(
    () => new Set(Object.values(stages).filter((s) => s.output || (s.stageNumber === 4 && candidates.some((c) => c.score !== null))).map((s) => s.stageNumber)),
    [stages, candidates],
  );
  const scoredCandidates = useMemo(() => candidates.filter((c) => c.score !== null), [candidates]);
  const validSelection = (selections[current] ?? []).filter((id) => scoredCandidates.some((c) => c.id === id));

  const goTo = useCallback(
    (n: number) => {
      setCurrent(n);
      const url = new URL(window.location.href);
      url.searchParams.set("stage", String(n));
      window.history.replaceState(null, "", url);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [],
  );

  const setError = (n: number, message: string | null) => setErrors((e) => ({ ...e, [n]: message }));

  /** Persists the input draft (on blur) so nothing typed is lost when switching stages. */
  async function saveDraft(n: number, candidateIds?: string[]) {
    const input = drafts[n] ?? "";
    if (input === (stages[n]?.input ?? "") && candidateIds === undefined) return;
    try {
      const { stage: saved } = await apiFetch<{ stage: ApiStage }>("/api/stages", {
        method: "PUT",
        body: JSON.stringify({ roleId: role.id, stageNumber: n, input, ...(candidateIds ? { candidateIds } : {}) }),
      });
      setStages((s) => ({ ...s, [n]: { ...fromApi(saved), output: s[n]?.output ?? "", updatedAt: s[n]?.updatedAt ?? null } }));
    } catch (e) {
      setError(n, errorMessage(e));
    }
  }

  async function generate() {
    const n = current;
    setGenerating(n);
    setError(n, null);
    try {
      const { stage: saved } = await apiFetch<{ stage: ApiStage }>("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          roleId: role.id,
          stageNumber: n,
          input: drafts[n] ?? "",
          ...(n >= 5 ? { candidateIds: validSelection } : {}),
        }),
      });
      setStages((s) => ({ ...s, [n]: fromApi(saved) }));
      if (n === 1) router.refresh(); // refresh the Stage 4 default JD
    } catch (e) {
      setError(n, errorMessage(e));
    } finally {
      setGenerating(null);
    }
  }

  const isCandidateStage = current >= 5;
  const busy = generating !== null;
  const canGenerate =
    !busy &&
    (current === 1 ? (drafts[1] ?? "").trim().length >= 20 : true) &&
    (current === 6 ? validSelection.length === 1 && (drafts[6] ?? "").trim().length >= 20 : true) &&
    (isCandidateStage && current !== 6 ? validSelection.length > 0 : true);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-lg font-semibold">
          <span className="text-muted">Workflow · </span>
          {role.name}
        </h1>
        {role.description && <p className="text-sm text-faint">{role.description}</p>}
      </div>

      <Stepper current={current} completed={completed} onSelect={goTo} />

      <section className="card space-y-5 p-4 sm:p-6">
        <StageHeader stage={stage} />

        {errors[current] && <Alert>{errors[current]}</Alert>}

        {current === 4 ? (
          <CvAssessment
            roleId={role.id}
            jd={drafts[4] || defaultJd}
            onJdChange={(v) => setDrafts((d) => ({ ...d, 4: v }))}
            onJdBlur={() => saveDraft(4)}
            jdIsDefault={!drafts[4] && Boolean(defaultJd)}
            candidates={candidates}
          />
        ) : (
          <>
            {isCandidateStage && (
              <CandidatePicker
                candidates={scoredCandidates}
                selected={validSelection}
                single={current === 6}
                disabled={busy}
                onChange={(ids) => {
                  setSelections((s) => ({ ...s, [current]: ids }));
                  void saveDraft(current, ids);
                }}
              />
            )}

            <div>
              <label className="label" htmlFor={`stage-input-${current}`}>{stage.inputLabel}</label>
              <textarea
                id={`stage-input-${current}`}
                className="input min-h-36 font-[inherit] leading-relaxed"
                placeholder={stage.inputPlaceholder}
                value={drafts[current] ?? ""}
                disabled={busy}
                onChange={(e) => setDrafts((d) => ({ ...d, [current]: e.target.value }))}
                onBlur={() => saveDraft(current)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn-primary" onClick={generate} disabled={!canGenerate}>
                {generating === current && <Spinner />}
                {record?.output ? "Regenerate" : "Generate"}
              </button>
              {current > 1 && current < 5 && !stages[1]?.output && (
                <span className="text-xs text-fit-average">Tip: generate Stage 1 first — later stages build on it.</span>
              )}
            </div>

            <StageOutput output={record?.output ?? ""} updatedAt={record?.updatedAt ?? null} generating={generating === current} />

            {current === 3 && <SourcingProfiles roleId={role.id} initialProfiles={profiles} />}
          </>
        )}

        <div className="flex items-center justify-between border-t border-line pt-4">
          <button type="button" className="btn-secondary" disabled={current === 1} onClick={() => goTo(current - 1)}>
            ← Previous
          </button>
          <span className="text-xs text-faint">
            {current} / {STAGE_COUNT}
          </span>
          <button type="button" className="btn-secondary" disabled={current === STAGE_COUNT} onClick={() => goTo(current + 1)}>
            Next →
          </button>
        </div>
      </section>
    </div>
  );
}
