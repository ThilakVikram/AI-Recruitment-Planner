"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { APPLICANT_STATUSES, type ApplicantFileKind } from "@/lib/applicants/constants";
import type { ApplicantFormValues } from "@/lib/applicants/dto";
import { roleOptionLabel } from "@/lib/roles/constants";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { TagInput } from "@/components/ui/tag-input";
import { FormField, FormSection } from "@/components/ui/form-section";
import { MetadataEditor } from "./metadata-editor";
import { DocumentPicker } from "./document-picker";

type Props = {
  roles: { id: string; name: string; status: string }[];
  initial: ApplicantFormValues;
} & ({ mode: "create" } | { mode: "edit"; applicantId: string });

export const EMPTY_APPLICANT: ApplicantFormValues = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  currentTitle: "",
  currentCompany: "",
  experienceYears: "",
  noticePeriod: "",
  currentCtc: "",
  expectedCtc: "",
  source: "",
  status: "New",
  linkedinUrl: "",
  portfolioUrl: "",
  skills: [],
  metadata: [],
  notes: "",
  roleId: "",
};

export function ApplicantForm(props: Props) {
  const router = useRouter();
  const [values, setValues] = useState(props.initial);
  const [docs, setDocs] = useState<{ kind: ApplicantFileKind; files: File[] }>({ kind: "CV", files: [] });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  const set = <K extends keyof ApplicantFormValues>(key: K, value: ApplicantFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  };
  const text = (key: keyof ApplicantFormValues) => ({
    id: `applicant-${key}`,
    value: values[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(key, e.target.value as never),
  });

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const body = JSON.stringify({
      ...values,
      experienceYears: values.experienceYears === "" ? null : Number(values.experienceYears),
      metadata: values.metadata.filter((m) => m.key.trim()),
      roleId: values.roleId || null,
    });

    try {
      if (props.mode === "edit") {
        await apiFetch(`/api/applicants/${props.applicantId}`, { method: "PUT", body });
        setSaved(true);
        router.refresh();
        return;
      }

      const { applicant } = await apiFetch<{ applicant: { id: string } }>("/api/applicants", { method: "POST", body });
      if (docs.files.length) {
        const form = new FormData();
        form.set("kind", docs.kind);
        docs.files.forEach((f) => form.append("files", f));
        try {
          await apiFetch(`/api/applicants/${applicant.id}/files`, { method: "POST", body: form });
        } catch (e) {
          // The applicant exists now — land on their page so the upload can be retried there.
          router.push(`/applicants/${applicant.id}?uploadError=${encodeURIComponent(errorMessage(e))}`);
          return;
        }
      }
      router.push(`/applicants/${applicant.id}`);
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <Alert>{error}</Alert>}

      <FormSection title="Personal details">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="applicant-fullName" label="Full name *">
            <input className="input" required maxLength={200} autoFocus={props.mode === "create"} {...text("fullName")} />
          </FormField>
          <FormField id="applicant-email" label="Email">
            <input className="input" type="email" maxLength={255} {...text("email")} />
          </FormField>
          <FormField id="applicant-phone" label="Phone">
            <input className="input" type="tel" maxLength={50} {...text("phone")} />
          </FormField>
          <FormField id="applicant-location" label="Location">
            <input className="input" maxLength={200} placeholder="City, country" {...text("location")} />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Professional profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="applicant-currentTitle" label="Current title">
            <input className="input" maxLength={200} {...text("currentTitle")} />
          </FormField>
          <FormField id="applicant-currentCompany" label="Current company">
            <input className="input" maxLength={200} {...text("currentCompany")} />
          </FormField>
          <FormField id="applicant-experienceYears" label="Experience (years)">
            <input className="input" type="number" min={0} max={60} step={0.5} {...text("experienceYears")} />
          </FormField>
          <FormField id="applicant-noticePeriod" label="Notice period">
            <input className="input" maxLength={100} placeholder="e.g. 30 days" {...text("noticePeriod")} />
          </FormField>
          <FormField id="applicant-currentCtc" label="Current CTC">
            <input className="input" maxLength={100} placeholder="e.g. 18 LPA" {...text("currentCtc")} />
          </FormField>
          <FormField id="applicant-expectedCtc" label="Expected CTC">
            <input className="input" maxLength={100} {...text("expectedCtc")} />
          </FormField>
          <FormField id="applicant-skills" label="Skills" className="sm:col-span-2">
            <TagInput id="applicant-skills" value={values.skills} onChange={(skills) => set("skills", skills)} />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Application">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="applicant-status" label="Status">
            <select className="input cursor-pointer" {...text("status")}>
              {APPLICANT_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </FormField>
          <FormField id="applicant-roleId" label="Applied for role">
            <select className="input cursor-pointer" {...text("roleId")}>
              <option value="">Not linked to a role</option>
              {props.roles.map((r) => (
                <option key={r.id} value={r.id}>{roleOptionLabel(r)}</option>
              ))}
            </select>
          </FormField>
          <FormField id="applicant-source" label="Source">
            <input className="input" maxLength={100} placeholder="e.g. LinkedIn, Referral, Naukri" list="applicant-sources" {...text("source")} />
            <datalist id="applicant-sources">
              {["LinkedIn", "Naukri", "Referral", "Company website", "Job fair", "Agency"].map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </FormField>
          <div className="hidden sm:block" />
          <FormField id="applicant-linkedinUrl" label="LinkedIn URL">
            <input className="input" type="url" maxLength={2048} placeholder="https://linkedin.com/in/…" {...text("linkedinUrl")} />
          </FormField>
          <FormField id="applicant-portfolioUrl" label="Portfolio / website">
            <input className="input" type="url" maxLength={2048} placeholder="https://…" {...text("portfolioUrl")} />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Additional details" description="Any other information worth keeping — visa status, preferred shift, languages, referral name…">
        <MetadataEditor value={values.metadata} onChange={(metadata) => set("metadata", metadata)} />
      </FormSection>

      <FormSection title="Notes">
        <textarea className="input min-h-28" maxLength={20_000} aria-label="Notes" placeholder="Internal recruiter notes" {...text("notes")} />
      </FormSection>

      {props.mode === "create" && (
        <FormSection title="Documents" description="Attach a CV now, or add more documents later from the applicant's page. PDF, DOC, DOCX, TXT, PNG or JPG up to 10 MB.">
          <DocumentPicker kind={docs.kind} files={docs.files} onChange={setDocs} disabled={pending} />
        </FormSection>
      )}

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t border-line bg-canvas/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        {saved && <span className="mr-auto text-sm text-fit-strong">Saved</span>}
        <Link href="/applicants" className="btn-ghost">
          {props.mode === "edit" ? "Back to list" : "Cancel"}
        </Link>
        <button type="submit" className="btn-primary" disabled={pending || !values.fullName.trim()}>
          {pending && <Spinner />} {props.mode === "edit" ? "Save changes" : "Add applicant"}
        </button>
      </div>
    </form>
  );
}
