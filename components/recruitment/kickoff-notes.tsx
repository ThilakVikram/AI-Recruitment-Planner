"use client";

import { useState } from "react";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { KICKOFF_TOPICS, prefillFromRole, topicFilled, type KickoffForm } from "@/lib/recruitment/kickoff";
import { WORK_MODES } from "@/lib/roles/constants";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { TagInput } from "@/components/ui/tag-input";
import { ListInput } from "@/components/ui/list-input";

type Mode = "fields" | "paste";
export type RoleDefaults = Parameters<typeof prefillFromRole>[1];

type Props = {
  recruitmentId: number;
  form: KickoffForm;
  raw: string;
  /** The role's requisition details, offered as a one-click prefill. */
  roleDefaults: RoleDefaults;
  onSaved: (next: { form: KickoffForm; raw: string }) => void;
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const anyTopic = (f: KickoffForm) => KICKOFF_TOPICS.some((t) => topicFilled(f, t.key));
const yearsValue = (v: string) => (v.trim() === "" ? null : Math.max(0, Math.min(60, Math.round(Number(v)))));

function Topic({ index, title, filled, children }: { index: number; title: string; filled: boolean; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-line p-4">
      <legend className="flex items-center gap-2 px-1.5 text-sm font-semibold">
        <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] ${filled ? "bg-fit-strong/20 text-fit-strong" : "bg-surface-3 text-muted"}`}>
          {filled ? "✓" : index}
        </span>
        {title}
      </legend>
      <div className="mt-1 space-y-3">{children}</div>
    </fieldset>
  );
}

function Field({ id, label, hint, className = "", children }: { id: string; label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="label" htmlFor={id}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-[0.7rem] text-faint">{hint}</p>}
    </div>
  );
}

/**
 * Step 1. Two ways in: fill the kick-off form topic by topic, or paste the full meeting notes
 * and let AI fill the form (which the recruiter then reviews and edits).
 */
export function KickoffNotes({ recruitmentId, form, raw, roleDefaults, onSaved }: Props) {
  const [mode, setMode] = useState<Mode>(anyTopic(form) || !raw.trim() ? "fields" : "paste");
  const [draft, setDraft] = useState(form);
  const [draftRaw, setDraftRaw] = useState(raw);
  const [busy, setBusy] = useState<"save" | "fill" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const dirty = !same(draft, form) || draftRaw !== raw;
  const disabled = busy !== null;
  const prefilled = prefillFromRole(draft, roleDefaults);
  const canPrefill = !same(prefilled, draft);

  function update<K extends keyof KickoffForm>(topic: K, patch: Partial<KickoffForm[K]>) {
    setDraft((d) => ({ ...d, [topic]: { ...d[topic], ...patch } }));
    setNotice(null);
  }

  async function save() {
    setBusy("save");
    setError(null);
    setNotice(null);
    try {
      await apiFetch(`/api/recruitments/${recruitmentId}/kickoff`, { method: "PUT", body: JSON.stringify({ fields: draft, raw: draftRaw }) });
      onSaved({ form: draft, raw: draftRaw });
      setNotice("Saved.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function fillWithAi() {
    if (anyTopic(draft) && !confirm("Replace what’s in the form with what AI finds in the full notes?")) return;
    setBusy("fill");
    setError(null);
    setNotice(null);
    try {
      const { fields } = await apiFetch<{ fields: KickoffForm }>(`/api/recruitments/${recruitmentId}/kickoff/extract`, {
        method: "POST",
        body: JSON.stringify({ raw: draftRaw }),
      });
      setDraft(fields);
      onSaved({ form: fields, raw: draftRaw });
      setMode("fields");
      setNotice("AI filled the form from your notes. Review and edit it, then save any changes.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  const tab = (value: Mode, label: string, hint: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === value}
      onClick={() => setMode(value)}
      disabled={disabled}
      className={`flex-1 rounded-lg border px-3 py-2 text-left transition ${mode === value ? "border-primary bg-primary/15" : "border-line hover:border-primary/50"}`}
    >
      <span className="block text-sm font-medium">{label}</span>
      <span className="block text-xs text-muted">{hint}</span>
    </button>
  );

  const { responsibilities: r, skills: s, experience: e, team: t } = draft;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row" role="tablist" aria-label="How to add kick-off notes">
        {tab("fields", "Fill in sections", "Complete the form topic by topic")}
        {tab("paste", "Paste full notes", "One field — AI fills the form for you")}
      </div>

      {error && <Alert>{error}</Alert>}
      {notice && <Alert kind={notice === "Saved." ? "success" : "info"}>{notice}</Alert>}

      {mode === "fields" ? (
        <>
          {canPrefill && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface-2/60 px-3 py-2 text-sm">
              <span className="text-muted">The role already has skills, experience, location or salary details.</span>
              <button type="button" className="btn-secondary px-3 py-1 text-xs" disabled={disabled} onClick={() => setDraft(prefilled)}>
                Fill empty fields from role
              </button>
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            <Topic index={1} title={KICKOFF_TOPICS[0].label} filled={topicFilled(draft, "responsibilities")}>
              <Field id="ko-resp-items" label="Key responsibilities" hint="Press Enter to add each one.">
                <ListInput id="ko-resp-items" value={r.items} onChange={(items) => update("responsibilities", { items })} placeholder="e.g. Own the payments service" disabled={disabled} />
              </Field>
              <Field id="ko-resp-outcomes" label="Key outcomes (first 6–12 months)">
                <textarea id="ko-resp-outcomes" className="input min-h-20 text-sm" maxLength={5000} value={r.outcomes} disabled={disabled} onChange={(ev) => update("responsibilities", { outcomes: ev.target.value })} />
              </Field>
              <Field id="ko-resp-notes" label="Other notes">
                <textarea id="ko-resp-notes" className="input min-h-16 text-sm" maxLength={10_000} value={r.notes} disabled={disabled} onChange={(ev) => update("responsibilities", { notes: ev.target.value })} />
              </Field>
            </Topic>

            <Topic index={2} title={KICKOFF_TOPICS[1].label} filled={topicFilled(draft, "skills")}>
              <Field id="ko-skills-must" label="Must-have skills" hint="Type a skill and press Enter or comma.">
                <TagInput id="ko-skills-must" value={s.mustHave} onChange={(mustHave) => update("skills", { mustHave })} placeholder="e.g. Node.js, MySQL, REST APIs" disabled={disabled} />
              </Field>
              <Field id="ko-skills-nice" label="Nice-to-have skills">
                <TagInput id="ko-skills-nice" value={s.niceToHave} onChange={(niceToHave) => update("skills", { niceToHave })} placeholder="e.g. Kafka, AWS" disabled={disabled} />
              </Field>
              <Field id="ko-skills-notes" label="Other notes" hint="Depth expected, certifications, domain knowledge…">
                <textarea id="ko-skills-notes" className="input min-h-16 text-sm" maxLength={10_000} value={s.notes} disabled={disabled} onChange={(ev) => update("skills", { notes: ev.target.value })} />
              </Field>
            </Topic>

            <Topic index={3} title={KICKOFF_TOPICS[2].label} filled={topicFilled(draft, "experience")}>
              <div className="grid grid-cols-2 gap-3">
                <Field id="ko-exp-min" label="Experience from (yrs)">
                  <input id="ko-exp-min" type="number" min={0} max={60} className="input" value={e.minYears ?? ""} disabled={disabled} onChange={(ev) => update("experience", { minYears: yearsValue(ev.target.value) })} />
                </Field>
                <Field id="ko-exp-max" label="Experience to (yrs)">
                  <input id="ko-exp-max" type="number" min={0} max={60} className="input" value={e.maxYears ?? ""} disabled={disabled} onChange={(ev) => update("experience", { maxYears: yearsValue(ev.target.value) })} />
                </Field>
                <Field id="ko-exp-location" label="Location">
                  <input id="ko-exp-location" className="input" maxLength={200} placeholder="e.g. Chennai" value={e.location} disabled={disabled} onChange={(ev) => update("experience", { location: ev.target.value })} />
                </Field>
                <Field id="ko-exp-mode" label="Work mode">
                  <select id="ko-exp-mode" className="input cursor-pointer" value={e.workMode} disabled={disabled} onChange={(ev) => update("experience", { workMode: ev.target.value })}>
                    <option value="">Not discussed</option>
                    {WORK_MODES.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </Field>
                <Field id="ko-exp-salary" label="Salary range">
                  <input id="ko-exp-salary" className="input" maxLength={100} placeholder="e.g. 18–24 LPA" value={e.salaryRange} disabled={disabled} onChange={(ev) => update("experience", { salaryRange: ev.target.value })} />
                </Field>
                <Field id="ko-exp-notice" label="Notice period">
                  <input id="ko-exp-notice" className="input" maxLength={100} placeholder="e.g. 30 days or less" value={e.noticePeriod} disabled={disabled} onChange={(ev) => update("experience", { noticePeriod: ev.target.value })} />
                </Field>
              </div>
              {e.minYears !== null && e.maxYears !== null && e.minYears > e.maxYears && (
                <p className="text-xs text-fit-not">“From” years can’t be more than “to” years.</p>
              )}
              <Field id="ko-exp-notes" label="Other notes">
                <textarea id="ko-exp-notes" className="input min-h-16 text-sm" maxLength={10_000} value={e.notes} disabled={disabled} onChange={(ev) => update("experience", { notes: ev.target.value })} />
              </Field>
            </Topic>

            <Topic index={4} title={KICKOFF_TOPICS[3].label} filled={topicFilled(draft, "team")}>
              <div className="grid grid-cols-2 gap-3">
                <Field id="ko-team-size" label="Team size">
                  <input id="ko-team-size" className="input" maxLength={100} placeholder="e.g. 6 engineers" value={t.teamSize} disabled={disabled} onChange={(ev) => update("team", { teamSize: ev.target.value })} />
                </Field>
                <Field id="ko-team-reports" label="Reports to">
                  <input id="ko-team-reports" className="input" maxLength={200} value={t.reportsTo} disabled={disabled} onChange={(ev) => update("team", { reportsTo: ev.target.value })} />
                </Field>
              </div>
              <Field id="ko-team-rounds" label="Interview rounds" hint="In order. Press Enter to add each round.">
                <ListInput id="ko-team-rounds" numbered maxItems={15} maxLength={300} value={t.interviewRounds} onChange={(interviewRounds) => update("team", { interviewRounds })} placeholder="e.g. Technical round with 2 seniors" disabled={disabled} />
              </Field>
              <Field id="ko-team-timeline" label="Hiring timeline">
                <input id="ko-team-timeline" className="input" maxLength={500} placeholder="e.g. Offer out within 3 weeks" value={t.timeline} disabled={disabled} onChange={(ev) => update("team", { timeline: ev.target.value })} />
              </Field>
              <Field id="ko-team-notes" label="Other notes">
                <textarea id="ko-team-notes" className="input min-h-16 text-sm" maxLength={10_000} value={t.notes} disabled={disabled} onChange={(ev) => update("team", { notes: ev.target.value })} />
              </Field>
            </Topic>
          </div>
        </>
      ) : (
        <div>
          <label className="label" htmlFor="kickoff-raw">Full kick-off meeting notes</label>
          <textarea
            id="kickoff-raw"
            className="input min-h-72 text-sm leading-relaxed"
            placeholder="Paste everything from the kick-off meeting — in any order or format. AI will fill the form: responsibilities, must-have / nice-to-have skills, experience, location, salary, team and interview rounds."
            maxLength={100_000}
            value={draftRaw}
            disabled={disabled}
            onChange={(ev) => {
              setDraftRaw(ev.target.value);
              setNotice(null);
            }}
          />
          <p className="mt-1 text-xs text-faint">These full notes are also kept and passed to Job Management for extra detail.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {dirty && !disabled && <span className="mr-auto text-xs text-fit-average">Unsaved changes</span>}
        {busy === "fill" && <span className="mr-auto text-xs text-muted">Filling the form with Claude…</span>}
        {mode === "paste" && (
          <button type="button" className="btn-primary" onClick={fillWithAi} disabled={disabled || draftRaw.trim().length < 20}>
            {busy === "fill" && <Spinner />} Fill form with AI
          </button>
        )}
        <button
          type="button"
          className={mode === "paste" ? "btn-secondary" : "btn-primary"}
          onClick={save}
          disabled={disabled || !dirty || (e.minYears !== null && e.maxYears !== null && e.minYears > e.maxYears)}
        >
          {busy === "save" && <Spinner />} {mode === "paste" ? "Save notes only" : "Save notes"}
        </button>
      </div>
    </div>
  );
}
