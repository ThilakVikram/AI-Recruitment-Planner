const STYLES: Record<string, string> = {
  New: "border-primary/40 bg-primary/10 text-primary-strong",
  Screening: "border-fit-good/40 bg-fit-good/10 text-fit-good",
  Interviewing: "border-fit-good/40 bg-fit-good/10 text-fit-good",
  Offered: "border-fit-strong/40 bg-fit-strong/10 text-fit-strong",
  Hired: "border-fit-strong/40 bg-fit-strong/15 text-fit-strong",
  Rejected: "border-fit-not/40 bg-fit-not/10 text-fit-not",
  "On hold": "border-fit-average/40 bg-fit-average/10 text-fit-average",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STYLES[status] ?? "border-line text-muted"}`}>
      {status}
    </span>
  );
}
