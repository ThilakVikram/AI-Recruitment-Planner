import { Suspense } from "react";
import { requirePageUser } from "@/lib/auth/session";
import { listRoles } from "@/lib/db/roles";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-context";

/** Every page in this group requires a valid Better Auth session (checked server-side). */
export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const user = await requirePageUser();
  const roles = await listRoles();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Suspense fallback={<div className="hidden w-64 shrink-0 border-r border-line bg-surface lg:block" />}>
          <AppSidebar user={{ name: user.name, email: user.email }} />
        </Suspense>
        <div className="flex min-w-0 flex-1 flex-col">
          <Suspense fallback={<div className="h-16 border-b border-line bg-surface/80" />}>
            <AppHeader roles={roles.map((r) => ({ id: r.id, name: r.name }))} />
          </Suspense>
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
