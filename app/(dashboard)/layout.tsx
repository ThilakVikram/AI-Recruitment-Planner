import { Suspense } from "react";
import { requirePageUser } from "@/lib/auth/session";
import { listRoles } from "@/lib/db/roles";
import { AppHeader } from "@/components/layout/app-header";

/** Every page in this group requires a valid Better Auth session (checked server-side). */
export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const user = await requirePageUser();
  const roles = await listRoles();

  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="h-[113px] border-b border-line bg-surface/80" />}>
        <AppHeader user={{ name: user.name, email: user.email }} roles={roles.map((r) => ({ id: r.id, name: r.name }))} />
      </Suspense>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
