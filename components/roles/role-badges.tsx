const STATUS_STYLES: Record<string, string> = {
  Open: "border-fit-strong/40 bg-fit-strong/10 text-fit-strong",
  "On hold": "border-fit-average/40 bg-fit-average/10 text-fit-average",
  Filled: "border-fit-good/40 bg-fit-good/10 text-fit-good",
  Closed: "border-line bg-surface-2 text-faint",
};

const PRIORITY_STYLES: Record<string, string> = {
  Urgent: "text-fit-not",
  High: "text-fit-average",
  Medium: "text-muted",
  Low: "text-faint",
};

export function RoleStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_STYLES[status] ?? "border-line text-muted"}`}>
      {status}
    </span>
  );
}

export function PriorityLabel({ priority }: { priority: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap ${PRIORITY_STYLES[priority] ?? "text-muted"}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {priority} priority
    </span>
  );
}
