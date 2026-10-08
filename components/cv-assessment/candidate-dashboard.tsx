import type { CandidateDTO } from "@/lib/workflow/types";
import { FIT_CATEGORIES } from "@/lib/workflow/constants";
import { FitBadge, ScorePill, fitStyle } from "@/components/ui/fit-badge";
import { Spinner } from "@/components/ui/spinner";

export function CandidateDashboard({
  candidates,
  onRescore,
  rescoringId,
}: {
  candidates: CandidateDTO[];
  onRescore: (id: string) => void;
  rescoringId: string | null;
}) {
  const scored = candidates.filter((c) => c.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  if (!scored.length) {
    return <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-faint">No CVs scored for this role yet.</p>;
  }

  const counts = Object.fromEntries(FIT_CATEGORIES.map((c) => [c, scored.filter((s) => s.category === c).length]));
  const rankById = new Map(scored.map((c, i) => [c.id, i + 1]));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold">Ranked candidates ({scored.length})</h3>
        <div className="flex flex-wrap gap-2 text-xs">
          {FIT_CATEGORIES.map((c) => (
            <span key={c} className="flex items-center gap-1.5 text-muted">
              <span className={`h-2 w-2 rounded-full ${fitStyle(c)!.dot}`} /> {c}: {counts[c]}
            </span>
          ))}
        </div>
      </div>

      {FIT_CATEGORIES.filter((c) => counts[c] > 0).map((category) => (
        <div key={category} className="space-y-2">
          <h4 className={`text-xs font-semibold tracking-wide uppercase ${fitStyle(category)!.text}`}>{category}</h4>
          <ol className="grid gap-3 lg:grid-cols-2">
            {scored
              .filter((c) => c.category === category)
              .map((c) => {
                const style = fitStyle(c.category);
                return (
                  <li key={c.id} className={`card border-l-4 p-4 ${style?.border ?? ""}`}>
                    <div className="flex items-start gap-3">
                      <span className="font-display text-sm font-semibold text-faint">#{rankById.get(c.id)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{c.name}</span>
                          <FitBadge category={c.category} />
                        </div>
                        <div className="mt-0.5 truncate text-xs text-faint">
                          {c.cvFileNames[0]} · Tracker: {c.decision}
                        </div>
                      </div>
                      <ScorePill score={c.score} category={c.category} />
                    </div>
                    {c.summary && <p className="mt-3 text-sm">{c.summary}</p>}
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold tracking-wide text-fit-strong uppercase">Strengths</div>
                        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-muted">
                          {c.strengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                      <div>
                        <div className="text-xs font-semibold tracking-wide text-fit-not uppercase">Gaps</div>
                        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-muted">
                          {c.gaps.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button type="button" className="btn-ghost px-2 py-1 text-xs" disabled={rescoringId !== null} onClick={() => onRescore(c.id)}>
                        {rescoringId === c.id && <Spinner className="h-3 w-3" />} Rescore
                      </button>
                    </div>
                  </li>
                );
              })}
          </ol>
        </div>
      ))}
    </section>
  );
}
