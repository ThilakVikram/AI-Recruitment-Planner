/** Display helpers for role requisition fields (safe for client and server). */

export function formatExperience(min: number | null, max: number | null): string | null {
  if (min !== null && max !== null) return min === max ? `${min} yrs` : `${min}–${max} yrs`;
  if (min !== null) return `${min}+ yrs`;
  if (max !== null) return `Up to ${max} yrs`;
  return null;
}

export function asSkillList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
