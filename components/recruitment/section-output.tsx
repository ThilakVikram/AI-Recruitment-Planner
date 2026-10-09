"use client";

import { useState } from "react";
import type { OutputGroup } from "@/lib/recruitment/section-views";
import { Markdown } from "@/components/ui/markdown";
import { CopyButton } from "@/components/ui/copy-button";

const BADGE = {
  good: "border-fit-strong/40 bg-fit-strong/10 text-fit-strong",
  warn: "border-fit-average/40 bg-fit-average/10 text-fit-average",
  bad: "border-fit-not/40 bg-fit-not/10 text-fit-not",
};
const DOT = { good: "bg-fit-strong", warn: "bg-fit-average", bad: "bg-fit-not" };

/**
 * Tabbed section output (like the Job Management). Sections written per applicant
 * get an applicant switcher above the tabs; the selected tab carries across applicants.
 */
export function SectionOutput({ groups }: { groups: OutputGroup[] }) {
  const [groupIndex, setGroupIndex] = useState(0);
  const [tabLabel, setTabLabel] = useState<string | null>(null);
  const group = groups[Math.min(groupIndex, groups.length - 1)];
  if (!group) return null;
  const tab = group.tabs.find((t) => t.label === tabLabel) ?? group.tabs[0];

  return (
    <div>
      {groups.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto border-b border-line px-3 py-2.5" role="tablist" aria-label="Applicants">
          {groups.map((g, i) => (
            <button
              key={`${g.label}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === groupIndex}
              onClick={() => setGroupIndex(i)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition ${
                i === groupIndex ? "border-primary bg-primary/15 text-primary-strong" : "border-line text-muted hover:text-ink"
              }`}
            >
              {g.label ?? `Part ${i + 1}`}
              {g.badge && <span className={`h-1.5 w-1.5 rounded-full ${DOT[g.badge.tone]}`} title={g.badge.text} aria-hidden />}
            </button>
          ))}
        </div>
      )}

      {(group.badge || group.notice || (groups.length === 1 && group.label)) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5 text-sm">
          {groups.length === 1 && group.label && <span className="font-medium">{group.label}</span>}
          {group.badge && (
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${BADGE[group.badge.tone]}`}>Recommendation: {group.badge.text}</span>
          )}
          {group.notice && <span className="text-xs text-fit-average italic">{group.notice}</span>}
        </div>
      )}

      {group.aside && (
        <details className="group border-b border-line px-4 py-2.5 text-sm">
          <summary className="cursor-pointer text-xs font-medium text-fit-average select-none">{group.aside.title}</summary>
          <div className="mt-2"><Markdown>{group.aside.content}</Markdown></div>
        </details>
      )}

      {tab && (
        <>
          <div className="flex items-center gap-1 overflow-x-auto border-b border-line px-3" role="tablist">
            {group.tabs.map((t) => (
              <button
                key={t.label}
                type="button"
                role="tab"
                aria-selected={t === tab}
                onClick={() => setTabLabel(t.label)}
                className={`border-b-2 px-2.5 py-2 text-xs font-medium whitespace-nowrap ${
                  t === tab ? "border-primary text-ink" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
            <span className="ml-auto pl-2"><CopyButton text={tab.content} /></span>
          </div>
          <div className="p-4 sm:p-5" role="tabpanel">
            <Markdown>{tab.content}</Markdown>
          </div>
        </>
      )}
    </div>
  );
}
