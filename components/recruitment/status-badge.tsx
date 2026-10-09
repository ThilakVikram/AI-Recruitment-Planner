const STYLES: Record<string, string> = {
  Open: "border-primary/40 bg-primary/10 text-primary-strong",
  "In progress": "border-fit-good/40 bg-fit-good/10 text-fit-good",
  "On hold": "border-fit-average/40 bg-fit-average/10 text-fit-average",
  Completed: "border-fit-strong/40 bg-fit-strong/10 text-fit-strong",
  Cancelled: "border-line bg-surface-2 text-faint",
};

export function RecruitmentStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STYLES[status] ?? "border-line text-muted"}`}>
      {status}
    </span>
  );
}
