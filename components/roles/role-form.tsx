"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { EMPLOYMENT_TYPES, ROLE_PRIORITIES, ROLE_STATUSES, WORK_MODES } from "@/lib/roles/constants";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { TagInput } from "@/components/ui/tag-input";
import { FormField, FormSection } from "@/components/ui/form-section";

export type RoleFormValues = {
  name: string;
  description: string;
  department: string;
  location: string;
  workMode: string;
  employmentType: string;
  openings: string;
  experienceMin: string;
  experienceMax: string;
  salaryRange: string;
  hiringManager: string;
  targetDate: string;
  priority: string;
  status: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
};

export const EMPTY_ROLE: RoleFormValues = {
  name: "",
  description: "",
  department: "",
  location: "",
  workMode: "",
  employmentType: "Full-time",
  openings: "1",
  experienceMin: "",
  experienceMax: "",
  salaryRange: "",
  hiringManager: "",
  targetDate: "",
  priority: "Medium",
  status: "Open",
  requiredSkills: [],
  niceToHaveSkills: [],
};

type Props = { initial: RoleFormValues } & ({ mode: "create" } | { mode: "edit"; roleId: string });

const optionalInt = (v: string) => (v.trim() === "" ? null : Number(v));

export function RoleForm(props: Props) {
  const router = useRouter();
  const [values, setValues] = useState(props.initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  const set = <K extends keyof RoleFormValues>(key: K, value: RoleFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  };
  const text = (key: keyof RoleFormValues) => ({
    id: `role-${key}`,
    value: values[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(key, e.target.value as never),
  });

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const body = JSON.stringify({
      ...values,
      openings: Number(values.openings) || 1,
      experienceMin: optionalInt(values.experienceMin),
      experienceMax: optionalInt(values.experienceMax),
    });
    try {
      if (props.mode === "edit") {
        await apiFetch(`/api/roles/${props.roleId}`, { method: "PUT", body });
        setSaved(true);
        router.refresh();
        return;
      }
      const { role } = await apiFetch<{ role: { id: string } }>("/api/roles", { method: "POST", body });
      router.push(`/roles/${role.id}`);
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

      <FormSection title="Role">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="role-name" label="Role title *" className="sm:col-span-2">
            <input className="input" required maxLength={200} autoFocus={props.mode === "create"} placeholder="e.g. Senior Backend Developer" {...text("name")} />
          </FormField>
          <FormField id="role-department" label="Department / team">
            <input className="input" maxLength={100} placeholder="e.g. Engineering" {...text("department")} />
          </FormField>
          <FormField id="role-hiringManager" label="Hiring manager">
            <input className="input" maxLength={200} {...text("hiringManager")} />
          </FormField>
          <FormField id="role-description" label="Summary" className="sm:col-span-2">
            <textarea className="input min-h-24" maxLength={5000} placeholder="What this person will do and why the role is open" {...text("description")} />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Requirements" description="Used by the AI in every recruitment for this role, and to help match applicants.">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="role-experienceMin" label="Experience from (years)">
            <input className="input" type="number" min={0} max={60} {...text("experienceMin")} />
          </FormField>
          <FormField id="role-experienceMax" label="Experience to (years)">
            <input className="input" type="number" min={0} max={60} {...text("experienceMax")} />
          </FormField>
          <FormField id="role-requiredSkills" label="Must-have skills" className="sm:col-span-2">
            <TagInput id="role-requiredSkills" value={values.requiredSkills} onChange={(v) => set("requiredSkills", v)} />
          </FormField>
          <FormField id="role-niceToHaveSkills" label="Nice-to-have skills" className="sm:col-span-2">
            <TagInput id="role-niceToHaveSkills" value={values.niceToHaveSkills} onChange={(v) => set("niceToHaveSkills", v)} placeholder="e.g. Kafka, AWS" />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Position">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="role-location" label="Location">
            <input className="input" maxLength={200} placeholder="e.g. Chennai" {...text("location")} />
          </FormField>
          <FormField id="role-workMode" label="Work mode">
            <select className="input cursor-pointer" {...text("workMode")}>
              <option value="">Not specified</option>
              {WORK_MODES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </FormField>
          <FormField id="role-employmentType" label="Employment type">
            <select className="input cursor-pointer" {...text("employmentType")}>
              <option value="">Not specified</option>
              {EMPLOYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField id="role-openings" label="Openings">
            <input className="input" type="number" min={1} max={999} required {...text("openings")} />
          </FormField>
          <FormField id="role-salaryRange" label="Salary range">
            <input className="input" maxLength={100} placeholder="e.g. 18–24 LPA" {...text("salaryRange")} />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Tracking">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField id="role-status" label="Status">
            <select className="input cursor-pointer" {...text("status")}>
              {ROLE_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField id="role-priority" label="Priority">
            <select className="input cursor-pointer" {...text("priority")}>
              {ROLE_PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </FormField>
          <FormField id="role-targetDate" label="Target fill date">
            <input className="input" type="date" {...text("targetDate")} />
          </FormField>
        </div>
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t border-line bg-canvas/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        {saved && <span className="mr-auto text-sm text-fit-strong">Saved</span>}
        <Link href="/roles" className="btn-ghost">{props.mode === "edit" ? "Back to roles" : "Cancel"}</Link>
        <button type="submit" className="btn-primary" disabled={pending || !values.name.trim()}>
          {pending && <Spinner />} {props.mode === "edit" ? "Save changes" : "Create role"}
        </button>
      </div>
    </form>
  );
}
