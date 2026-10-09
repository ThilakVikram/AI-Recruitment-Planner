"use client";

import { createContext, useContext, useState } from "react";

type SidebarState = { open: boolean; setOpen: (open: boolean) => void };

const SidebarContext = createContext<SidebarState | null>(null);

/** Shares the mobile drawer state between the header's menu button and the sidebar. */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <SidebarContext value={{ open, setOpen }}>{children}</SidebarContext>;
}

export function useSidebar(): SidebarState {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used inside <SidebarProvider>");
  return ctx;
}
