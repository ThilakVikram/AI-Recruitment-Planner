import type { FitCategory } from "@/lib/workflow/constants";

export const FIT_STYLES: Record<FitCategory, { text: string; bg: string; border: string; dot: string }> = {
  "Strong Fit": { text: "text-fit-strong", bg: "bg-fit-strong/10", border: "border-fit-strong/40", dot: "bg-fit-strong" },
  "Good Fit": { text: "text-fit-good", bg: "bg-fit-good/10", border: "border-fit-good/40", dot: "bg-fit-good" },
  "Average Fit": { text: "text-fit-average", bg: "bg-fit-average/10", border: "border-fit-average/40", dot: "bg-fit-average" },
  "Not Fit": { text: "text-fit-not", bg: "bg-fit-not/10", border: "border-fit-not/40", dot: "bg-fit-not" },
};

export function fitStyle(category: string | null | undefined) {
  return FIT_STYLES[(category ?? "") as FitCategory] ?? null;
}

export function FitBadge({ category }: { category: string | null }) {
  const style = fitStyle(category);
  if (!style) return <span className="text-xs text-faint">Not scored</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${style.text} ${style.bg} ${style.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {category}
    </span>
  );
}

export function ScorePill({ score, category, outOf = 100 }: { score: number | null; category: string | null; outOf?: number }) {
  const style = fitStyle(category);
  return (
    <span className={`font-display text-lg font-semibold tabular-nums ${style?.text ?? "text-muted"}`}>
      {score ?? "—"}
      <span className="text-xs font-normal text-faint">/{outOf}</span>
    </span>
  );
}
