import type { StageDefinition } from "@/lib/workflow/stages";

export function StageHeader({ stage }: { stage: StageDefinition }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="max-w-2xl">
        <div className="text-xs font-medium tracking-wide text-primary-strong uppercase">Stage {stage.number} of 7</div>
        <h2 className="mt-1 font-display text-2xl font-semibold">{stage.title}</h2>
        <p className="mt-1.5 text-sm text-muted">{stage.description}</p>
      </div>
      <div className="rounded-lg border border-line bg-surface-2 px-4 py-3 md:max-w-xs">
        <div className="text-xs font-medium tracking-wide text-muted uppercase">This stage produces</div>
        <ul className="mt-1.5 space-y-0.5 text-sm">
          {stage.produces.map((p) => (
            <li key={p} className="flex gap-2">
              <span className="text-primary">•</span>
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
