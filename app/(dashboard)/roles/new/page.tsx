import Link from "next/link";
import { requirePageUser } from "@/lib/auth/session";
import { EMPTY_ROLE, RoleForm } from "@/components/roles/role-form";

export const metadata = { title: "New role · Recruiter AI Co-Pilot" };

export default async function NewRolePage() {
  await requirePageUser();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link href="/roles" className="text-sm text-muted hover:text-ink">← Roles</Link>
        <h1 className="mt-1 font-display text-lg font-semibold">New role</h1>
        <p className="mt-1 text-sm text-muted">Only the title is required — you can fill in the rest later.</p>
      </div>
      <RoleForm mode="create" initial={EMPTY_ROLE} />
    </div>
  );
}
