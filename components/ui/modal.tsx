"use client";

import { useEffect, useId } from "react";

type Props = {
  title: string;
  description?: React.ReactNode;
  onClose: () => void;
  /** While busy, the dialog can't be dismissed (an AI request is running). */
  busy?: boolean;
  size?: "md" | "lg" | "xl";
  footer?: React.ReactNode;
  children: React.ReactNode;
};

const WIDTHS = { md: "max-w-md", lg: "max-w-2xl", xl: "max-w-4xl" };

export function Modal({ title, description, onClose, busy = false, size = "md", footer, children }: Props) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [busy, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-[8vh]" onClick={() => !busy && onClose()}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`card flex max-h-[84vh] w-full ${WIDTHS[size]} flex-col shadow-2xl`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 id={titleId} className="font-display text-lg font-semibold">{title}</h2>
            {description && <div className="mt-0.5 text-sm text-muted">{description}</div>}
          </div>
          <button type="button" className="btn-ghost -mr-2 px-2 py-1" onClick={onClose} disabled={busy} aria-label="Close">
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
