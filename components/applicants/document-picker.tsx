"use client";

import { APPLICANT_FILE_ACCEPT, APPLICANT_FILE_KINDS, APPLICANT_FILES_PER_UPLOAD, type ApplicantFileKind } from "@/lib/applicants/constants";

type Props = {
  kind: ApplicantFileKind;
  files: File[];
  onChange: (next: { kind: ApplicantFileKind; files: File[] }) => void;
  disabled?: boolean;
  /** Bump to clear the native file input after an upload. */
  resetKey?: number;
};

/** Pick a document type and up to five files of that type. */
export function DocumentPicker({ kind, files, onChange, disabled, resetKey }: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <select
        className="input cursor-pointer sm:w-44"
        value={kind}
        disabled={disabled}
        onChange={(e) => onChange({ kind: e.target.value as ApplicantFileKind, files })}
        aria-label="Document type"
      >
        {APPLICANT_FILE_KINDS.map((k) => (
          <option key={k}>{k}</option>
        ))}
      </select>
      <input
        key={resetKey}
        type="file"
        multiple
        accept={APPLICANT_FILE_ACCEPT}
        disabled={disabled}
        className="input flex-1 cursor-pointer py-1.5 file:mr-3 file:rounded-md file:border-0 file:bg-surface-3 file:px-3 file:py-1 file:text-sm file:text-ink"
        onChange={(e) => onChange({ kind, files: Array.from(e.target.files ?? []).slice(0, APPLICANT_FILES_PER_UPLOAD) })}
        aria-label="Choose files"
      />
    </div>
  );
}
