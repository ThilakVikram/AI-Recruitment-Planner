import "server-only";
import { createHash } from "node:crypto";
import type { Prisma } from "@/lib/generated/prisma/client";
import { ApiError } from "@/lib/api/errors";
import { AIError } from "@/lib/ai/errors";
import { clip, formatRoleBrief } from "@/lib/ai/context";
import { mapWithConcurrency } from "@/lib/ai/run";
import { runKickoffChain } from "@/lib/ai/chains/kickoff";
import {
  runFinalDecisionStructured,
  runMarketResearchStructured,
  runOutreachStructured,
  runScreeningStructured,
  runSourcingStructured,
} from "@/lib/ai/chains/recruitment-sections";
import { runCvApplicantChain } from "@/lib/ai/chains/cv-applicant";
import { runProfileAnalyzerChain } from "@/lib/ai/chains/profile-analyzer";
import type { Platform } from "@/lib/workflow/constants";
import type { KickoffOutput } from "@/lib/ai/schemas/kickoff";
import { extractCvText } from "@/lib/cv/extract";
import type { ValidatedCvFile } from "@/lib/cv/file";
import { APPLICANT_FILE_TYPES } from "@/lib/applicants/constants";
import {
  deleteRecruitmentProfile,
  findRecruitmentProfileByName,
  linkProfileToApplicant,
  getRecruitmentProfile,
  saveRecruitmentProfileAnalysis,
  getApplicationsForPrompt,
  getRecruitmentSections,
  getRecruitmentWithRole,
  saveKickoffNotes,
  saveRecruitmentSection,
  saveScoredApplication,
  saveApplicationOutput,
} from "@/lib/db/recruitments";
import { getSection, type ApplicantOutputKind, type SectionKey } from "./constants";
import { clampKickoffForm, formatKickoffNotes, hasKickoffNotes, toKickoffForm, type KickoffForm } from "./kickoff";
import { runKickoffNotesChain } from "@/lib/ai/chains/kickoff-notes";
import { groupsToMarkdown, sectionGroups } from "./section-views";

/** Stores structured output alongside the markdown the tabs render to (used for copy and later prompts). */
function structured(key: SectionKey, data: object) {
  return {
    output: groupsToMarkdown(sectionGroups(key, data, "(structured)")),
    outputData: data as unknown as Prisma.InputJsonValue,
  };
}

const CV_PROMPT_MAX_CHARS = 40_000;
const SECTION_CONTEXT_MAX_CHARS = 30_000;

type Sections = Awaited<ReturnType<typeof getRecruitmentSections>>;

function bullets(value: unknown): string {
  return Array.isArray(value) && value.length ? value.map((v) => `- ${String(v)}`).join("\n") : "None recorded.";
}

function kickoffData(sections: Sections): Partial<KickoffOutput> | null {
  const data = sections.get("kickoff")?.outputData;
  return data && typeof data === "object" && !Array.isArray(data) ? (data as Partial<KickoffOutput>) : null;
}

/** Role requisition details + this recruitment's summary (if any) — what prompts receive as the role. */
async function loadContext(recruitmentId: number) {
  const recruitment = await getRecruitmentWithRole(recruitmentId);
  if (!recruitment) throw new ApiError(404, "Recruitment not found.");
  const sections = await getRecruitmentSections(recruitmentId);
  const kickoff = kickoffData(sections);
  const summary = recruitment.summary.trim();
  // This drive's openings replace the role's.
  const roleBrief = formatRoleBrief({ ...recruitment.role, openings: recruitment.openings });
  const brief = summary ? `${roleBrief}\n\nThis recruitment drive:\n${clip(summary, 3000)}` : roleBrief;
  return {
    recruitment,
    sections,
    brief,
    jobDescription: kickoff?.jobDescription?.trim() ?? "",
    scorecard: kickoff?.scorecard?.trim() || "No separate scorecard is available — use the job description.",
  };
}

function previousContext(sections: Sections, keys: SectionKey[]): string {
  const parts = keys
    .map((key) => {
      const output = sections.get(key)?.output?.trim();
      return output ? `### ${getSection(key)!.title}\n\n${clip(output, SECTION_CONTEXT_MAX_CHARS)}` : null;
    })
    .filter(Boolean);
  return parts.length ? parts.join("\n\n") : "No previous output is available yet.";
}

/** Runs one AI section for a recruitment and stores its latest output. */
export async function generateRecruitmentSection(
  recruitmentId: number,
  key: SectionKey,
  input: string,
) {
  const def = getSection(key)!;
  const ctx = await loadContext(recruitmentId);

  for (const required of def.requires) {
    if (!ctx.sections.get(required)?.output) throw new ApiError(400, `Generate “${getSection(required)!.title}” first.`);
  }
  if (def.inputMin && input.trim().length < def.inputMin) throw new ApiError(400, `Please enter the ${def.inputLabel.toLowerCase()}.`);

  switch (key) {
    case "kickoff": {
      const fields = toKickoffForm(ctx.recruitment.kickoffFields);
      const raw = ctx.recruitment.kickoffRaw ?? "";
      if (!hasKickoffNotes(fields, raw)) throw new ApiError(400, "Add the kick-off meeting notes first (step 1).");
      const notesText = formatKickoffNotes(fields, raw);
      const combined = input.trim() ? `${notesText}\n\nAdditional instructions from the recruiter:\n${input.trim()}` : notesText;
      const { markdown, data } = await runKickoffChain({ roleName: ctx.brief, input: combined });
      return saveRecruitmentSection(recruitmentId, key, { input, output: markdown, outputData: data as unknown as Prisma.InputJsonValue });
    }
    case "market-research": {
      const data = await runMarketResearchStructured({ roleName: ctx.brief, previousContext: previousContext(ctx.sections, ["kickoff"]), input });
      return saveRecruitmentSection(recruitmentId, key, { input, ...structured(key, data) });
    }
    case "sourcing": {
      const data = await runSourcingStructured({
        roleName: ctx.brief,
        previousContext: previousContext(ctx.sections, ["kickoff", "market-research"]),
        input,
      });
      return saveRecruitmentSection(recruitmentId, key, { input, ...structured(key, data) });
    }
  }
}

/** Where each applicant-panel output is stored on the application. */
const APPLICANT_OUTPUT_FIELD = {
  outreach: "outreachMessages",
  screening: "screeningReport",
  "final-decision": "finalDecisionMessages",
} as const;

/** Writes one applicant-panel output (outreach, screening report or final decision messages) for one applicant. */
export async function generateApplicantOutput(recruitmentId: number, applicationId: string, kind: ApplicantOutputKind, input: string) {
  const ctx = await loadContext(recruitmentId);
  const [a] = await getApplicationsForPrompt(recruitmentId, [applicationId]);
  if (!a) throw new ApiError(404, "Application not found.");
  const name = a.applicant.fullName;
  const cvText = clip(a.cvFile?.extractedText ?? "No CV on file.", CV_PROMPT_MAX_CHARS);
  const score = a.score === null ? "Not scored" : `${a.score}/100`;
  const kickoffTitle = getSection("kickoff")!.title;

  let fields: object;
  if (kind === "outreach") {
    if (a.decision !== "Proceed to interview") throw new ApiError(400, "Set the decision to “Proceed to interview” first.");
    if (!ctx.jobDescription) throw new ApiError(400, `Generate “${kickoffTitle}” first — outreach is written from its job description.`);
    const profile = await findRecruitmentProfileByName(recruitmentId, name);
    const sourcingInfo = profile ? `Platform: ${profile.platform}\n${clip(profile.profileText, 8_000)}` : "Applied with a CV upload.";
    fields = await runOutreachStructured({
      roleName: ctx.brief,
      jobDescription: ctx.jobDescription,
      scorecard: ctx.scorecard,
      candidateName: name,
      score,
      summary: a.summary ?? "Not available.",
      strengths: bullets(a.strengths),
      sourcingInfo,
      cvText,
      input,
    });
  } else if (kind === "screening") {
    if (!ctx.sections.get("kickoff")?.output) throw new ApiError(400, `Generate “${kickoffTitle}” first — the report is scored against its scorecard.`);
    if (a.decision !== "Proceed to interview") throw new ApiError(400, "Set the decision to “Proceed to interview” first.");
    const notes = a.screeningNotes?.trim();
    if (!notes) throw new ApiError(400, "Add the interview screening notes first.");
    fields = await runScreeningStructured({
      roleName: ctx.brief,
      scorecard: ctx.scorecard,
      candidateName: name,
      score,
      category: a.category ?? "Not scored",
      summary: a.summary ?? "Not available.",
      cvText,
      input: input.trim() ? `${notes}\n\nAdditional instructions from the recruiter:\n${input.trim()}` : notes,
    });
  } else {
    if (a.finalDecision !== "Rejected") throw new ApiError(400, "Final decision messages are for rejected applicants — set the final decision to Rejected first.");
    // Candidate-facing: scores, decisions and recruiter notes are deliberately not passed.
    fields = await runFinalDecisionStructured({ roleName: ctx.brief, candidateName: name, strengths: bullets(a.strengths), gaps: bullets(a.gaps), input });
  }

  const data = { ...fields, generatedAt: new Date().toISOString() };
  await saveApplicationOutput(recruitmentId, applicationId, APPLICANT_OUTPUT_FIELD[kind], data as unknown as Prisma.InputJsonValue);
  return data;
}

export type RecruitmentCvResult =
  | { fileName: string; ok: true; applicationId: string; applicantId: string; applicantName: string; score: number; category: string; isNewApplicant: boolean }
  | { fileName: string; ok: false; error: string };

const nullable = (v: string) => (v.trim() ? v.trim() : null);

/** CVs often write "linkedin.com/in/x" without a scheme. */
function toUrl(value: string): string | null {
  const v = value.trim();
  if (/^https?:\/\/\S+$/i.test(v)) return v.slice(0, 2048);
  if (/^(www\.)?[\w-]+(\.[\w-]+)+\/\S*$/i.test(v)) return `https://${v}`.slice(0, 2048);
  return null;
}

/**
 * For each CV: extract text → score against the recruitment's JD and pull out the
 * applicant's details → create/update the applicant, store the CV, save the score.
 * Files are processed independently so one bad CV doesn't fail the batch.
 */
export async function scoreRecruitmentCvs(recruitmentId: number, files: ValidatedCvFile[], createdById: string): Promise<RecruitmentCvResult[]> {
  const ctx = await loadContext(recruitmentId);
  if (!ctx.jobDescription) {
    throw new ApiError(400, "No job description yet. Add kick-off notes and generate the “Job Management” section first.");
  }

  return mapWithConcurrency(files, 3, async (file): Promise<RecruitmentCvResult> => {
    try {
      const cvText = await extractCvText(file.bytes, file.fileType, file.originalFileName);
      const saved = await scoreAndSaveApplicant(ctx, {
        createdById,
        text: cvText,
        fileName: file.originalFileName,
        file: { mimeType: APPLICANT_FILE_TYPES[file.fileType], bytes: file.bytes, fileHash: file.fileHash },
        fallbackName: file.normalizedFileName.replace(/\b\p{L}/gu, (c) => c.toUpperCase()),
        source: "CV upload",
        fileKind: "CV",
      });
      return { fileName: file.originalFileName, ok: true, ...saved };
    } catch (error) {
      if (error instanceof ApiError || error instanceof AIError) return { fileName: file.originalFileName, ok: false, error: error.message };
      console.error("[recruitment-cv] Unexpected error", { file: file.originalFileName, message: (error as Error)?.message });
      return { fileName: file.originalFileName, ok: false, error: "Scoring failed. Please try again." };
    }
  });
}

type Context = Awaited<ReturnType<typeof loadContext>>;

/**
 * Scores a CV (or pasted profile) against the JD, extracts the applicant's details, and saves
 * applicant + document + application. Shared by CV upload and “Add profile to applicants”.
 */
async function scoreAndSaveApplicant(
  ctx: Context,
  args: {
    createdById: string;
    text: string;
    fileName: string;
    file: { mimeType: string; bytes: Uint8Array; fileHash: string };
    /** Recruiter-entered name, which wins over the name the AI reads from the text. */
    nameOverride?: string;
    fallbackName: string;
    source: string;
    fileKind: string;
    linkedinFallback?: string | null;
  },
) {
  const r = await runCvApplicantChain({ jobDescription: ctx.jobDescription, scorecard: ctx.scorecard, fileName: args.fileName, cvText: args.text });
  const fullName = args.nameOverride?.trim() || r.candidateName.trim() || args.fallbackName || "Unnamed applicant";
  const email = nullable(r.email)?.toLowerCase() ?? null;

  const saved = await saveScoredApplication({
    recruitmentId: ctx.recruitment.id,
    roleId: ctx.recruitment.roleId,
    createdById: args.createdById,
    source: args.source,
    fileKind: args.fileKind,
    file: {
      originalFileName: args.fileName,
      mimeType: args.file.mimeType,
      sizeBytes: args.file.bytes.byteLength,
      fileHash: args.file.fileHash,
      bytes: args.file.bytes,
      extractedText: args.text,
    },
    profile: {
      fullName,
      email: email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null,
      phone: nullable(r.phone),
      location: nullable(r.location),
      currentTitle: nullable(r.currentTitle),
      currentCompany: nullable(r.currentCompany),
      experienceYears: r.experienceYears,
      skills: Array.from(new Set(r.skills)),
      linkedinUrl: toUrl(r.linkedinUrl) ?? args.linkedinFallback ?? null,
    },
    score: { score: r.score, category: r.category, summary: r.summary, strengths: r.strengths, gaps: r.gaps },
  });

  return {
    applicationId: saved.applicationId,
    applicantId: saved.applicantId,
    applicantName: fullName,
    score: r.score,
    category: r.category,
    isNewApplicant: saved.isNewApplicant,
  };
}

/**
 * “Add to applicants” from Profile analysis: scores the pasted profile against the JD like a CV,
 * creates (or links) the applicant with the profile text saved as a document, and adds them to
 * this recruitment. With `move`, the profile is then removed from the profile list.
 */
export async function addProfileAsApplicant(recruitmentId: number, profileId: string, createdById: string, move: boolean) {
  const ctx = await loadContext(recruitmentId);
  if (!ctx.jobDescription) {
    throw new ApiError(400, "No job description yet. Add kick-off notes and generate the “Job Management” section first.");
  }
  const profile = await getRecruitmentProfile(recruitmentId, profileId);
  if (!profile) throw new ApiError(404, "Profile not found.");

  const header = [`${profile.candidateName} — ${profile.platform} profile`, profile.referenceUrl ? `Profile link: ${profile.referenceUrl}` : null]
    .filter(Boolean)
    .join("\n");
  const text = `${header}\n\n${profile.profileText}`;
  const bytes = new TextEncoder().encode(text);
  const safeName = profile.candidateName.replace(/[^\p{L}\p{N} ._-]/gu, "").trim() || "Candidate";

  const saved = await scoreAndSaveApplicant(ctx, {
    createdById,
    text,
    fileName: `${safeName} - ${profile.platform} profile.txt`,
    file: { mimeType: "text/plain", bytes, fileHash: createHash("sha256").update(bytes).digest("hex") },
    nameOverride: profile.candidateName,
    fallbackName: profile.candidateName,
    source: profile.platform,
    fileKind: "Other",
    linkedinFallback: profile.platform === "LinkedIn" && profile.referenceUrl ? profile.referenceUrl : null,
  });

  if (move) await deleteRecruitmentProfile(recruitmentId, profileId);
  else await linkProfileToApplicant(recruitmentId, profileId, saved.applicantId);
  return { ...saved, moved: move };
}

/** Analyses one pasted profile against the recruitment's JD. */
export async function analyzeRecruitmentProfile(recruitmentId: number, profileId: string) {
  const ctx = await loadContext(recruitmentId);
  if (!ctx.jobDescription) {
    throw new ApiError(400, "No job description yet. Add kick-off notes and generate the “Job Management” section first.");
  }
  const profile = await getRecruitmentProfile(recruitmentId, profileId);
  if (!profile) throw new ApiError(404, "Profile not found.");

  const analysis = await runProfileAnalyzerChain({
    jobDescription: ctx.jobDescription,
    scorecard: ctx.scorecard,
    candidateName: profile.candidateName,
    platform: profile.platform as Platform,
    profileText: profile.profileText,
  });
  return saveRecruitmentProfileAnalysis(profileId, {
    analysis: analysis as unknown as Prisma.InputJsonValue,
    score: analysis.fitScore,
    verdict: analysis.verdict,
  });
}

/** Whether profiles can be analysed yet (they need the kick-off JD). */
export async function recruitmentHasJd(recruitmentId: number) {
  return Boolean((await loadContext(recruitmentId)).jobDescription);
}

/**
 * Saves the full pasted kick-off notes and has Claude fill the structured kick-off form from them.
 * The form is replaced; the recruiter reviews and edits it afterwards.
 */
export async function fillKickoffFromNotes(recruitmentId: number, raw: string): Promise<KickoffForm> {
  const ctx = await loadContext(recruitmentId);
  const fields = await runKickoffNotesChain({ roleName: ctx.brief, input: raw });
  // Normalise through the same reader as stored data (drops blanks, unknown work modes…) and the API's limits.
  const cleaned = clampKickoffForm(toKickoffForm(fields));
  await saveKickoffNotes(recruitmentId, { fields: cleaned, raw });
  return cleaned;
}
