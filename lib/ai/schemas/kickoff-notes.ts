import { z } from "zod";

const text = (what: string) => z.string().describe(`${what}. Empty string if the notes don't say.`);
const list = (what: string) => z.array(z.string()).describe(`${what}. Empty array if the notes don't say.`);
const years = (what: string) => z.number().int().min(0).max(60).nullable().describe(`${what}, as stated in the notes; null if not stated.`);

/** Full kick-off meeting notes sorted into the recruitment page's structured kick-off form. */
export const kickoffNotesSchema = z.object({
  responsibilities: z.object({
    items: list("Key responsibilities, one short item each"),
    outcomes: text("Key outcomes expected (e.g. first 6–12 months)"),
    notes: text("Anything else about the role's scope that doesn't fit above"),
  }),
  skills: z.object({
    mustHave: list("Must-have skills as short tags (e.g. \"Node.js\", \"MySQL\")"),
    niceToHave: list("Nice-to-have / bonus skills as short tags"),
    notes: text("Other skill-related notes (depth, certifications, domain knowledge)"),
  }),
  experience: z.object({
    minYears: years("Minimum years of experience"),
    maxYears: years("Maximum years of experience"),
    location: text("Work location / city"),
    workMode: z.enum(["", "Onsite", "Hybrid", "Remote"]).describe("Work mode if stated, else empty string."),
    salaryRange: text("Salary / CTC budget as written (e.g. \"18–24 LPA\")"),
    noticePeriod: text("Acceptable notice period"),
    notes: text("Other notes on seniority, location or compensation"),
  }),
  team: z.object({
    teamSize: text("Team size"),
    reportsTo: text("Who the role reports to"),
    interviewRounds: list("Interview rounds in order, one per item (e.g. \"Technical round with 2 seniors\")"),
    timeline: text("Hiring timeline / target dates"),
    notes: text("Other notes about the team or process"),
  }),
});
