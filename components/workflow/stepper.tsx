"use client";

import { useEffect, useRef } from "react";
import { STAGES } from "@/lib/workflow/stages";

export function Stepper({
  current,
  completed,
  onSelect,
}: {
  current: number;
  completed: Set<number>;
  onSelect: (stage: number) => void;
}) {
  const activeRef = useRef<HTMLButtonElement>(null);

  // Keep the active step visible when the stepper scrolls horizontally (mobile).
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [current]);

  return (
    <nav aria-label="Workflow stages" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ol className="flex min-w-max gap-1.5 lg:grid lg:min-w-0 lg:grid-cols-7">
        {STAGES.map((stage) => {
          const active = stage.number === current;
          const done = completed.has(stage.number);
          return (
            <li key={stage.number}>
              <button
                ref={active ? activeRef : undefined}
                type="button"
                onClick={() => onSelect(stage.number)}
                aria-current={active ? "step" : undefined}
                className={`flex h-full w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                  active
                    ? "border-primary bg-primary/15 text-ink"
                    : "border-line bg-surface text-muted hover:border-primary/50 hover:text-ink"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    active ? "bg-primary text-primary-ink" : done ? "bg-fit-strong/20 text-fit-strong" : "bg-surface-3 text-muted"
                  }`}
                >
                  {done && !active ? "✓" : stage.number}
                </span>
                <span className="leading-tight font-medium whitespace-nowrap lg:whitespace-normal">{stage.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
