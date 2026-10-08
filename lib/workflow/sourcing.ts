import "server-only";
import { ApiError } from "@/lib/api/errors";
import { AIError } from "@/lib/ai/errors";
import { loadRoleContext } from "@/lib/ai/context";
import { mapWithConcurrency } from "@/lib/ai/run";
import { runProfileAnalyzerChain } from "@/lib/ai/chains/profile-analyzer";
import { getSourcingProfilesForAnalysis, saveProfileAnalysis } from "@/lib/db/sourcing";
import type { Platform } from "./constants";

/** Analyses pasted LinkedIn/Naukri profiles for a role and stores score/verdict per profile. */
export async function analyzeSourcingProfiles(roleId: string, profileIds?: string[]) {
  const profiles = await getSourcingProfilesForAnalysis(roleId, profileIds);
  if (!profiles.length) throw new ApiError(400, "Add at least one profile to analyse.");

  const ctx = await loadRoleContext(roleId, 3);
  if (!ctx.hasJobDescription) throw new ApiError(400, "Generate the Stage 1 kick-off output first.");

  const results = await mapWithConcurrency(profiles, 3, async (p) => {
    try {
      const analysis = await runProfileAnalyzerChain({
        jobDescription: ctx.jobDescription,
        scorecard: ctx.scorecard,
        candidateName: p.candidateName,
        platform: p.platform as Platform,
        profileText: p.profileText,
      });
      await saveProfileAnalysis(roleId, p.id, { analysis, score: analysis.fitScore, verdict: analysis.verdict });
      return { id: p.id, ok: true as const };
    } catch (error) {
      const message = error instanceof AIError || error instanceof ApiError ? error.message : "Analysis failed.";
      if (!(error instanceof ApiError)) console.error("[sourcing] analysis failed", { profileId: p.id, message: (error as Error)?.message });
      return { id: p.id, ok: false as const, error: message };
    }
  });
  return results;
}
