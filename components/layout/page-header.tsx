"use client";

import { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";

type Slot = { node: HTMLElement | null; setNode: (node: HTMLElement | null) => void };

const PageHeaderContext = createContext<Slot | null>(null);

/** Lets a page put its own title/actions into the sticky app header (next to the page name). */
export function PageHeaderProvider({ children }: { children: React.ReactNode }) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  return <PageHeaderContext value={{ node, setNode }}>{children}</PageHeaderContext>;
}

/** Rendered by the app header: where page header content appears. */
export function PageHeaderSlot({ className }: { className?: string }) {
  const ctx = useContext(PageHeaderContext);
  return <div ref={ctx?.setNode} className={className} />;
}

/** Rendered by a page: its children are shown in the app header instead of the page body. */
export function PageHeader({ children }: { children: React.ReactNode }) {
  const node = useContext(PageHeaderContext)?.node;
  return node ? createPortal(children, node) : null;
}
