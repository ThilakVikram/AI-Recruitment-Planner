/** Shared domain constants (safe for client and server). */

export const FIT_CATEGORIES = ["Strong Fit", "Good Fit", "Average Fit", "Not Fit"] as const;
export type FitCategory = (typeof FIT_CATEGORIES)[number];

/** 85–100 Strong · 70–84 Good · 50–69 Average · 0–49 Not Fit */
export function categoryForScore(score: number): FitCategory {
  if (score >= 85) return "Strong Fit";
  if (score >= 70) return "Good Fit";
  if (score >= 50) return "Average Fit";
  return "Not Fit";
}

export const DECISIONS = ["Pending", "Proceed to interview", "Hold", "Reject"] as const;
export type Decision = (typeof DECISIONS)[number];

export const PLATFORMS = ["LinkedIn", "Naukri"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PROFILE_VERDICTS = ["Reach out", "Hold", "Pass"] as const;
export type ProfileVerdict = (typeof PROFILE_VERDICTS)[number];

export const CV_MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB per file
export const CV_MAX_FILES_PER_UPLOAD = 10;
export const CV_ALLOWED_EXTENSIONS = ["pdf", "txt"] as const;
