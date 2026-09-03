/* ─────────────────────────────────────────────────────────────
   Post AI assistant (directive §27).

   Grounding contract (explicit in the directive):
   • The AI works ONLY from the supplied draft (title/excerpt/
     content/tags/category) — it must NEVER invent claims,
     numbers, statistics, client names or promises.
   • The prompt forbids adding any fact not present in the draft.
   • Output is strict JSON validated before use; any LLM failure
     falls back to deterministic derivations (never blocks the
     editor).
   • POST_AI_NO_LLM=1 opts out entirely (PII/policy switch, same
     pattern as the import mapper's CRM_IMPORT_NO_LLM).
   ───────────────────────────────────────────────────────────── */

import ZAI from "z-ai-web-dev-sdk";

export type PostAssistanceInput = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
};

export type PostAssistance = {
  headlineSuggestions: string[]; // 3 §26 title upgrades
  excerptSuggestions: string[]; // 2 §26 subtitle/excerpt upgrades
  structureNotes: string[]; // 3 structure/clarity notes
  grammarNotes: string[]; // up to 3 grammar fixes
  seoTitle: string; // §26 SEO metadata
  seoDescription: string; // §26 SEO metadata (≤155 chars)
  socialCaption: string; // §27 social caption
  subscriberSubject: string; // §27 subscriber announcement subject
  subscriberAnnouncement: string; // §27 subscriber announcement body
  ctaSuggestion: string; // §27 CTA
  usedFallback: boolean;
};

function fallback(input: PostAssistanceInput): PostAssistance {
  const plain = input.content.replace(/[#*`>\-]/g, " ").replace(/\s+/g, " ").trim();
  const firstSentences = plain.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
  const excerptBase = (input.excerpt || firstSentences || input.title).slice(0, 155);
  return {
    headlineSuggestions: [],
    excerptSuggestions: [],
    structureNotes: [],
    grammarNotes: [],
    seoTitle: input.title.slice(0, 60),
    seoDescription: excerptBase,
    socialCaption: `New from Okomba Insights: ${input.title}`,
    subscriberSubject: `New from Okomba Insights — ${input.title}`.slice(0, 120),
    subscriberAnnouncement: `We just published "${input.title}". ${excerptBase}`,
    ctaSuggestion: "Read the full article",
    usedFallback: true,
  };
}

function buildPrompt(input: PostAssistanceInput): string {
  const draft = input.content.slice(0, 8000);
  return [
    `Draft post (work ONLY from this material — never invent facts, numbers, statistics, client names, prices or promises that are not present below):`,
    ``,
    `TITLE: ${input.title}`,
    `EXCERPT: ${input.excerpt}`,
    `CATEGORY: ${input.category}`,
    `TAGS: ${input.tags.join(", ") || "(none)"}`,
    `CONTENT:`,
    draft,
    ``,
    `Return STRICT JSON only (no markdown fences):`,
    `{`,
    `  "headlineSuggestions": ["3 improved titles — same meaning, clearer/more compelling"],`,
    `  "excerptSuggestions": ["2 improved excerpts — max 200 chars each, same substance"],`,
    `  "structureNotes": ["3 concrete structural improvements grounded in the draft"],`,
    `  "grammarNotes": ["up to 3 grammar/clarity fixes quoting the draft"],`,
    `  "seoTitle": "≤60 chars search-optimized title",`,
    `  "seoDescription": "≤155 chars meta description",`,
    `  "socialCaption": "one-line social share caption",`,
    `  "subscriberSubject": "email subject for the subscriber announcement",`,
    `  "subscriberAnnouncement": "2-3 sentence subscriber email body announcing this post",`,
    `  "ctaSuggestion": "short call-to-action phrase"`,
    `}`,
    ``,
    `Rules: every suggestion must stay faithful to the draft. If the draft gives no basis for something, keep it generic. English, professional tone, no emojis.`,
  ].join("\n");
}

function coerceStringArray(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim().slice(0, 300))
    .slice(0, max);
}

function coerceString(v: unknown, max: number): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim().slice(0, max) : null;
}

export async function generatePostAssistance(
  input: PostAssistanceInput
): Promise<PostAssistance> {
  if (process.env.POST_AI_NO_LLM === "1" || process.env.CRM_IMPORT_NO_LLM === "1") {
    return fallback(input);
  }

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content:
            "You are the editorial assistant of Okomba Insights (a Nigerian digital products & analytics studio). You improve drafts WITHOUT inventing anything. You output strict JSON only.",
        },
        { role: "user", content: buildPrompt(input) },
      ],
      thinking: { type: "disabled" },
    });
    const text = completion.choices[0]?.message?.content ?? "";
    const cleaned = text.replace(/```(?:json)?/gi, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) return fallback(input);

    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    const fb = fallback(input);

    const seoDescription = coerceString(parsed.seoDescription, 160) ?? fb.seoDescription;
    const result: PostAssistance = {
      headlineSuggestions: coerceStringArray(parsed.headlineSuggestions, 3),
      excerptSuggestions: coerceStringArray(parsed.excerptSuggestions, 2),
      structureNotes: coerceStringArray(parsed.structureNotes, 3),
      grammarNotes: coerceStringArray(parsed.grammarNotes, 3),
      seoTitle: coerceString(parsed.seoTitle, 70) ?? fb.seoTitle,
      seoDescription,
      socialCaption: coerceString(parsed.socialCaption, 200) ?? fb.socialCaption,
      subscriberSubject:
        coerceString(parsed.subscriberSubject, 120) ?? fb.subscriberSubject,
      subscriberAnnouncement:
        coerceString(parsed.subscriberAnnouncement, 500) ?? fb.subscriberAnnouncement,
      ctaSuggestion: coerceString(parsed.ctaSuggestion, 80) ?? fb.ctaSuggestion,
      usedFallback: false,
    };

    // If nothing usable came back, use the full fallback
    if (
      result.headlineSuggestions.length === 0 &&
      result.structureNotes.length === 0 &&
      result.usedFallback === false &&
      coerceString(parsed.seoTitle, 70) === null
    ) {
      return fb;
    }
    return result;
  } catch (err) {
    console.error("[post-ai] assistance generation failed, using fallback:", err);
    return fallback(input);
  }
}
