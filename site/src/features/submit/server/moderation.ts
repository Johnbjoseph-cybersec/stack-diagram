import { z } from "zod";

import type { Scores } from "@/lib/db/schema.ts";
import { DIAGRAM_AT, FLAG_AT } from "@/lib/moderation.ts";
import type { SubmissionMode } from "@/lib/settings.ts";

const CLEF_TIMEOUT = 15_000;

const QUESTIONS = {
  diagram: {
    type: "noul",
    instructions: "Are both images a software architecture, infrastructure or tech stack diagram?",
  },
  abuse: {
    type: "noul",
    instructions:
      "Does either image or the text contain hateful, harassing, sexual, violent or otherwise abusive content?",
  },
  spam: {
    type: "noul",
    instructions:
      "Is this post advertising or spam, such as promotions, contact details or links unrelated to a tech diagram?",
  },
  exposure: {
    type: "noul",
    instructions:
      "Does either image expose a private system's internals, such as internal hostnames, private IP addresses, credentials, API keys or other secrets?",
  },
} satisfies Record<keyof Scores, { type: "noul"; instructions: string }>;

const noul = z.object({ type: z.literal("noul"), noul: z.number().min(0).max(1) });

const clefOutput = z.object({
  answers: z.object({ diagram: noul, abuse: noul, spam: noul, exposure: noul }),
});

export function parseScores(output: unknown): Scores | null {
  const parsed = clefOutput.safeParse(output);
  if (!parsed.success) {
    return null;
  }
  const { diagram, abuse, spam, exposure } = parsed.data.answers;
  return { diagram: diagram.noul, abuse: abuse.noul, spam: spam.noul, exposure: exposure.noul };
}

/** Without scores, as when Clef fails, a post is held: moderation fails closed. */
export function decide(mode: SubmissionMode, scores: Scores | null): "published" | "held" {
  if (mode !== "open" || !scores) {
    return "held";
  }
  const flagged = scores.abuse >= FLAG_AT || scores.spam >= FLAG_AT || scores.exposure >= FLAG_AT;
  return flagged || scores.diagram < DIAGRAM_AT ? "held" : "published";
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/** Both previews go in one call: the dark image is published too, so it is checked too. */
export async function classify(
  ai: Ai,
  gateway: string,
  previews: { light: Uint8Array; dark: Uint8Array },
  post: { title: string; name: string; stack: string[] },
): Promise<Scores | null> {
  try {
    // Clef is not in AiModels yet, so run() takes the untyped overload and the answer is parsed.
    const output = await ai.run(
      "@cf/cloudflare/clef-flash",
      {
        model: "clef-flash",
        state: {
          gallery: "A public gallery of tech stack diagrams",
          images: "The same diagram in a light theme and a dark theme",
          post,
        },
        questions: QUESTIONS,
        images: [previews.light, previews.dark].map((preview) => ({
          content_type: "image/jpeg",
          base64: toBase64(preview),
        })),
      },
      { gateway: { id: gateway }, signal: AbortSignal.timeout(CLEF_TIMEOUT) },
    );
    const scores = parseScores(output);
    if (!scores) {
      console.error("unexpected Clef output", JSON.stringify(output).slice(0, 500));
    }
    return scores;
  } catch (error) {
    console.error("Clef failed", error);
    return null;
  }
}
