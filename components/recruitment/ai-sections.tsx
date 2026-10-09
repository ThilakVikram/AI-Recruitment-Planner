"use client";

import { useState } from "react";
import { NOTES_STEP, SECTIONS, getSection, type SectionDefinition, type SectionKey, type StepKey } from "@/lib/recruitment/constants";
import type { RecruitmentSectionDTO } from "@/lib/recruitment/dto";
import { sectionGroups, type ShortlistProfile } from "@/lib/recruitment/section-views";
import { CopyButton } from "@/components/ui/copy-button";
import { SectionOutput } from "./section-output";

const timeFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

type Props = {
  sections: Partial<Record<SectionKey, RecruitmentSectionDTO>>;
  onGenerate: (def: SectionDefinition) => void;
  /** From ?section= — the open step is kept in the URL. */
  initialSection: StepKey;
  /** Analysed profiles — shown in the sourcing section's “Ranked profile shortlist”. */
  profiles: ShortlistProfile[];
  /** Step 1: the kick-off notes editor, and whether it has enough to unlock the AI sections. */
  notesPanel: React.ReactNode;
  notesReady: boolean;
};

function blockedReason(def: SectionDefinition, sections: Props["sections"]): string | null {
  const missing = def.requires.filter((k) => !sections[k]?.output);
  if (missing.length) return `Generate ${missing.map((k) => `“${getSection(k)!.title}”`).join(", ")} first — this section builds on it.`;
  return null;
}

const STEPS: { key: StepKey; title: string }[] = [NOTES_STEP, ...SECTIONS];

/**
 * The recruitment steps as a horizontal stepper: kick-off notes first,
 * then the AI sections — which stay locked until at least one note has been added.
 */
export function AiSections({ sections, onGenerate, initialSection, profiles, notesPanel, notesReady }: Props) {
  const [current, setCurrent] = useState<StepKey>(initialSection);
  const locked = !notesReady;
  // With no notes, only step 1 can be open.
  const active: StepKey = locked ? NOTES_STEP.key : current;
  const index = STEPS.findIndex((s) => s.key === active);
  const def = active === NOTES_STEP.key ? null : getSection(active)!;
  const section = def ? sections[def.key] : undefined;
  const blocked = def ? blockedReason(def, sections) : null;
  const header = def ?? NOTES_STEP;

  function goTo(key: StepKey) {
    setCurrent(key);
    const url = new URL(window.location.href);
    url.searchParams.set("section", key);
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="space-y-4">
      <nav aria-label="Recruitment steps" className="overflow-x-auto">
        <ol className="flex min-w-max gap-1.5 2xl:grid 2xl:min-w-0 2xl:grid-cols-4">
          {STEPS.map((s, i) => {
            const isActive = s.key === active;
            const isLocked = locked && s.key !== NOTES_STEP.key;
            const done = s.key === NOTES_STEP.key ? notesReady : Boolean(sections[s.key as SectionKey]?.output);
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => goTo(s.key)}
                  disabled={isLocked}
                  title={isLocked ? "Add kick-off meeting notes first" : undefined}
                  aria-current={isActive ? "step" : undefined}
                  className={`flex h-full w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-45 ${
                    isActive ? "border-primary bg-primary/15 text-ink" : "border-line bg-surface text-muted enabled:hover:border-primary/50 enabled:hover:text-ink"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      isActive ? "bg-primary text-primary-ink" : done ? "bg-fit-strong/20 text-fit-strong" : "bg-surface-3 text-muted"
                    }`}
                  >
                    {isLocked ? <span aria-hidden>🔒</span> : done && !isActive ? "✓" : i + 1}
                  </span>
                  <span className="leading-tight font-medium whitespace-nowrap 2xl:whitespace-normal">{s.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <section className="card space-y-5 p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <div className="text-xs font-medium tracking-wide text-primary-strong uppercase">Step {index + 1} of {STEPS.length}</div>
            <h2 className="mt-1 font-display text-2xl font-semibold">{header.title}</h2>
            <p className="mt-1.5 text-sm text-muted">{header.description}</p>
          </div>
          <div className="rounded-lg border border-line bg-surface-2 px-4 py-3 md:max-w-xs">
            <div className="text-xs font-medium tracking-wide text-muted uppercase">{def ? "This section produces" : "Notes cover"}</div>
            <ul className="mt-1.5 space-y-0.5 text-sm">
              {header.produces.map((p) => (
                <li key={p} className="flex gap-2"><span className="text-primary">•</span>{p}</li>
              ))}
            </ul>
          </div>
        </div>

        {def ? (
          <>
            {blocked && <p className="rounded-lg border border-fit-average/40 bg-fit-average/10 px-3 py-2 text-sm text-fit-average">{blocked}</p>}

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn-primary" disabled={Boolean(blocked)} onClick={() => onGenerate(def)}>
                {section?.output ? "Regenerate" : "Generate"}
              </button>
              {section?.output && (
                <span className="text-xs text-faint" suppressHydrationWarning>Saved {timeFormat.format(new Date(section.updatedAt))}</span>
              )}
            </div>

            <div className="card overflow-hidden" aria-live="polite">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <h3 className="text-sm font-semibold">Output</h3>
                {section?.output && <CopyButton text={section.output} />}
              </div>
              {section?.output ? (
                // Keyed by section + save time so tab selection resets when switching sections or regenerating.
                <SectionOutput key={`${def.key}-${section.updatedAt}`} groups={sectionGroups(def.key, section.data, section.output, { profiles })} />
              ) : (
                <p className="px-4 py-8 text-sm text-faint">Nothing generated yet. Click Generate to create it.</p>
              )}
            </div>
          </>
        ) : (
          <>
            {notesPanel}
            {locked && (
              <p className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary-strong">
                Save your kick-off notes to unlock Job Management and the other sections.
              </p>
            )}
          </>
        )}

        <div className="flex items-center justify-between border-t border-line pt-4">
          <button type="button" className="btn-secondary" disabled={index === 0} onClick={() => goTo(STEPS[index - 1].key)}>← Previous</button>
          <button type="button" className="btn-secondary" disabled={index === STEPS.length - 1 || locked} onClick={() => goTo(STEPS[index + 1].key)}>
            {index === 0 && !locked ? `Continue to ${STEPS[1].title} →` : "Next →"}
          </button>
        </div>
      </section>
    </div>
  );
}
