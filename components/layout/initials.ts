/** Up to two upper-case initials for an avatar (safe for client and server). */
export function initialsOf(name: string): string {
  return name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "U";
}
