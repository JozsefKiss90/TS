/**
 * One formatter for every boundary.
 *
 * Exercise 06 had two boundary parses, and each formatted its Zod issues
 * with the same three lines, copied. Exercise 07 adds a third, at the tool
 * arguments, and three copies is one too many: a control plane whose
 * boundaries report differently is a control plane whose logs need more
 * than one parser.
 *
 *   path.join(".") — the field, or "(root)" when the path is empty
 *   issue.code     — the machine-readable reason
 *   issue.message  — the human-readable one
 */
import type { z } from "zod";

export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map(
    (issue) => `${issue.path.join(".") || "(root)"}: [${issue.code}] ${issue.message}`,
  );
}
