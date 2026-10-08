/** Lower-cases, strips punctuation and collapses whitespace — used for duplicate detection. */
export function normalizeName(name: string): string {
  return name.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}
