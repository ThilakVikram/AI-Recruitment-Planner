import { Markdown } from "@/components/ui/markdown";
import { CopyButton } from "@/components/ui/copy-button";
import { Spinner } from "@/components/ui/spinner";

export function StageOutput({
  output,
  updatedAt,
  generating,
  emptyText = "Nothing generated yet. Add your input and click Generate.",
}: {
  output: string;
  updatedAt: string | null;
  generating: boolean;
  emptyText?: string;
}) {
  return (
    <section className="card overflow-hidden" aria-live="polite">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <h3 className="text-sm font-semibold">Output</h3>
        <div className="flex items-center gap-2 text-xs text-faint">
          {updatedAt && !generating && <span>Saved {new Date(updatedAt).toLocaleString()}</span>}
          {output && !generating && <CopyButton text={output} />}
        </div>
      </div>
      <div className="p-4 sm:p-5">
        {generating ? (
          <div className="flex items-center gap-3 py-8 text-sm text-muted">
            <Spinner className="h-5 w-5 text-primary" />
            Generating with Claude… this can take a minute or two.
          </div>
        ) : output ? (
          <Markdown>{output}</Markdown>
        ) : (
          <p className="py-6 text-sm text-faint">{emptyText}</p>
        )}
      </div>
    </section>
  );
}
