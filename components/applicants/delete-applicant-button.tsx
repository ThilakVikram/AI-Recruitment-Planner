"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { Spinner } from "@/components/ui/spinner";

export function DeleteApplicantButton({ applicantId, name }: { applicantId: string; name: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onDelete() {
    if (!confirm(`Delete ${name}, all of their documents and their applications in any recruitment? This cannot be undone.`)) return;
    setPending(true);
    try {
      await apiFetch(`/api/applicants/${applicantId}`, { method: "DELETE" });
      router.push("/applicants");
      router.refresh();
    } catch (e) {
      alert(errorMessage(e));
      setPending(false);
    }
  }

  return (
    <button type="button" className="btn-danger" onClick={onDelete} disabled={pending}>
      {pending && <Spinner />} Delete applicant
    </button>
  );
}
