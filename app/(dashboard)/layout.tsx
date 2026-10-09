import { Suspense } from "react";
import { requirePageUser } from "@/lib/auth/session";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { MainContainer } from "@/components/layout/main-container";
import { PageHeaderProvider } from "@/components/layout/page-header";

/** Every page in this group requires a valid Better Auth session (checked server-side). */
export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const user = await requirePageUser();

  return (
    <SidebarProvider>
      <PageHeaderProvider>
      <div className="flex min-h-screen">
        <Suspense fallback={<div className="hidden w-64 shrink-0 border-r border-line bg-surface lg:block" />}>
          <AppSidebar user={{ name: user.name, email: user.email }} />
        </Suspense>
        <div className="flex min-w-0 flex-1 flex-col">
          <Suspense fallback={<div className="h-16 border-b border-line bg-surface/80" />}>
            <AppHeader />
          </Suspense>
          <MainContainer>{children}</MainContainer>
        </div>
      </div>
      </PageHeaderProvider>
    </SidebarProvider>
  );
}
