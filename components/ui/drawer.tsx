"use client";

import { useEffect, useId, useRef, useState } from "react";

type Props = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  /** Controls shown under the title, e.g. a status picker. */
  headerActions?: React.ReactNode;
  children: React.ReactNode;
};

const WIDTH_KEY = "drawer-width";
const DEFAULT_WIDTH = 512;
const MIN_WIDTH = 360;
const KEY_STEP = 32;

/** Keeps the panel between MIN_WIDTH and 95% of the window. */
function clampWidth(px: number) {
  return Math.round(Math.min(Math.max(px, MIN_WIDTH), window.innerWidth * 0.95));
}

/**
 * Panel that slides in from the right over the page. Esc or a click outside closes it.
 * Drag its left edge (or focus the edge and use ← / →) to resize; the width is remembered.
 */
export function Drawer({ title, subtitle, onClose, footer, headerActions, children }: Props) {
  const titleId = useId();
  // Drawers only open after a click, so the saved width can be read on first render.
  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_WIDTH;
    try {
      const saved = Number(localStorage.getItem(WIDTH_KEY));
      return saved ? clampWidth(saved) : DEFAULT_WIDTH;
    } catch {
      return DEFAULT_WIDTH;
    }
  });
  // Set while dragging so the pointer-up that ends a drag over the backdrop doesn't close the panel.
  const resizing = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  function commit(px: number) {
    const next = clampWidth(px);
    setWidth(next);
    try {
      localStorage.setItem(WIDTH_KEY, String(next));
    } catch {}
  }

  function startResize(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    resizing.current = true;
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    const cursor = document.body.style.cursor;
    document.body.style.cursor = "col-resize";
    let latest = width;
    const onMove = (ev: PointerEvent) => {
      latest = clampWidth(window.innerWidth - ev.clientX);
      setWidth(latest);
    };
    const onUp = () => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
      document.body.style.cursor = cursor;
      commit(latest);
      setTimeout(() => (resizing.current = false));
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  }

  function onHandleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") commit(width + KEY_STEP);
    else if (e.key === "ArrowRight") commit(width - KEY_STEP);
    else return;
    e.preventDefault();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => !resizing.current && onClose()}>
      <aside
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ width }}
        className="relative flex h-full max-w-full animate-[drawer-in_160ms_ease-out] flex-col border-l border-line bg-surface shadow-2xl"
      >
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panel"
          aria-valuenow={width}
          aria-valuemin={MIN_WIDTH}
          tabIndex={0}
          onPointerDown={startResize}
          onKeyDown={onHandleKey}
          onDoubleClick={() => commit(DEFAULT_WIDTH)}
          title="Drag to resize · double-click to reset"
          className="group absolute inset-y-0 -left-1.5 z-10 hidden w-3 cursor-col-resize touch-none sm:block"
        >
          <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-transparent transition group-hover:bg-primary/60 group-focus-visible:bg-primary group-active:bg-primary" />
        </div>
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-display text-lg font-semibold">{title}</h2>
            {subtitle && <div className="mt-0.5 text-sm text-muted">{subtitle}</div>}
            {headerActions && <div className="mt-3">{headerActions}</div>}
          </div>
          <button type="button" className="btn-ghost -mr-2 px-2 py-1" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </aside>
    </div>
  );
}
