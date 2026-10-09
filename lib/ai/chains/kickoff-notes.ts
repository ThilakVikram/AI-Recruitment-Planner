import "server-only";
import { kickoffNotesPrompt } from "../prompts/kickoff-notes";
import { kickoffNotesSchema } from "../schemas/kickoff-notes";
import { runStructuredChain } from "../run";

/** Fills the recruitment page's structured kick-off form from pasted meeting notes. */
export async function runKickoffNotesChain(args: { roleName: string; input: string }) {
  return runStructuredChain(kickoffNotesPrompt, kickoffNotesSchema, "kickoff_notes", args);
}
