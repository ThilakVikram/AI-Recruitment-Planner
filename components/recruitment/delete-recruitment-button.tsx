"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { Spinner } from "@/components/ui/spinner";

export function DeleteRecruitmentButton({ recruitmentId, code }: { recruitmentId: number; code: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onDelete() {
    if (!confirm(`Delete ${code}? Its kick-off notes, AI output and application scores are removed. Applicants and their CVs are kept.`)) return;
    setPending(true);
    try {
      await apiFetch(`/api/recruitments/${recruitmentId}`, { method: "DELETE" });
      router.push("/recruitment");
      router.refresh();
    } catch (e) {
      alert(errorMessage(e));
      setPending(false);
    }
  }

  return (
    <button type="button" className="btn-ghost text-xs hover:text-fit-not" onClick={onDelete} disabled={pending}>
      {pending && <Spinner className="h-3 w-3" />} Delete
    </button>
  );
}
