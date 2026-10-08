import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders AI markdown output. Raw HTML in the markdown is not rendered. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-output">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
