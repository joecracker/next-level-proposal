import { GoogleGenAI, Type } from "@google/genai";

// Cloudflare Pages Function — serves POST /api/format-section
// Format raw dictation or unstructured text into clean construction scope line items.

interface Env {
  GEMINI_API_KEY?: string;
  // Older deployments set the same key under this name; accept either.
  AI_API_KEY?: string;
}

// Tried in order: the quality model first, tighter/cheaper ones behind it as
// backups. If Google retires one of these, or a free-tier quota runs out, the
// request slides to the next instead of failing outright.
// Keep this list in sync with functions/api/parse-document.ts.
const MODEL_CANDIDATES = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash",
];

// Worth retrying on a different model: retired or unknown model, quota, overload.
// Anything else (a rejected key, bad request) should fail right away.
const RETRYABLE_FAILURE =
  /not found|not supported|unsupported|deprecated|quota|rate limit|resource_exhausted|429|404|503|overloaded|unavailable/i;

type GenerateParams = Omit<Parameters<GoogleGenAI["models"]["generateContent"]>[0], "model">;

async function generateWithFallback(ai: GoogleGenAI, params: GenerateParams) {
  let lastError: unknown;

  for (const model of MODEL_CANDIDATES) {
    try {
      return await ai.models.generateContent({ ...params, model });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      lastError = error;
      if (!RETRYABLE_FAILURE.test(message)) throw error;
      console.warn(`[ai] model ${model} unavailable, trying next: ${message}`);
    }
  }

  throw lastError;
}

// Tim's proposals say "Remove", never "Demolish" / "Demo" / "Demolition". The prompt asks for that,
// and this tidies up any line where the model still slips.
const WORD_SWAPS: Record<string, string> = {
  demolish: "remove",
  demolishes: "removes",
  demolished: "removed",
  demolishing: "removing",
  demo: "remove",
  demolition: "removal",
};

export const cleanWording = (line: string): string =>
  line
    .replace(/\bdemolition\s+debris\b/gi, "debris")
    .replace(/\b(demolishing|demolishes|demolished|demolish|demolition|demo)\b/gi, (word) => {
      const swap = WORD_SWAPS[word.toLowerCase()];
      return word[0] === word[0].toUpperCase() ? swap[0].toUpperCase() + swap.slice(1) : swap;
    });

// A materials line names the material only. If the model still starts one with an action
// ("Furnish and install ...", "Supply ...", "Install ..."), drop the lead-in.
export const stripActionLead = (line: string): string => {
  const stripped = line.replace(
    /^\s*(?:furnish|supply|provide|install)(?:\s+and\s+(?:install|furnish|supply|provide))?\s+(?:new\s+)?/i,
    ""
  );
  if (!stripped || stripped === line) return line;
  return stripped[0].toUpperCase() + stripped.slice(1);
};

// Cloudflare infers the PagesFunction type at build time; we type the handler
// args inline so local tsc and Cloudflare's bundler both accept it.
export const onRequestPost = async ({
  request,
  env,
}: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  try {
    const body = (await request.json()) as {
      categoryName?: string;
      rawInput?: string;
      currentItems?: string[];
    };
    const { categoryName, rawInput, currentItems } = body;

    if (!rawInput || typeof rawInput !== "string") {
      return Response.json({ error: "Missing or invalid rawInput" }, { status: 400 });
    }

    const ai = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY || env.AI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "crackerbox-build",
        },
      },
    });

    // The proposal's materials list is just a list of materials, not a scope of work.
    const isMaterials = /material/i.test(categoryName || "");
    const materialsRules = `
MATERIALS SECTION (this overrides rules 3 and 7 above): this section is a materials list, not a scope of work.
- Each line item names ONE material or product only, with its size, type, thickness, finish or quantity when the contractor said them (for example: "1/2 in. moisture-resistant drywall, 12 sheets" or "Waterproofing membrane tape").
- Do NOT start any line with an action word such as Furnish, Install, Supply, Provide, Remove or Replace, and do not describe the work.
- Ignore tear-out and labor talk in the notes; that belongs in other sections.
`;

    const prompt = `You are an expert construction project manager and estimator.
Your job is to take raw voice dictation or casual spoken notes from a contractor and convert them into clear, professional, well-structured line items for a formal construction proposal sheet.

Category Name: ${categoryName || "General Construction Scope"}
Raw Spoken/Dictated Text: "${rawInput}"
${currentItems && currentItems.length > 0 ? `Existing Line Items in this section: ${JSON.stringify(currentItems)}` : ""}

Guidelines:
1. Break down the spoken thoughts into distinct, professional bullet points/line items.
2. DO NOT require phrases like "drop down to next line" or "bullet point" in the raw text; recognize natural pauses, action verbs, materials, dimensions, and scope changes automatically.
3. Use precise, clear construction terminology (e.g., "Install 1/2 in. moisture-resistant drywall", "Prepare subfloor and tape seams").
4. If the user mentioned quantities, materials, dimensions, or specific installation instructions, highlight them cleanly.
5. Keep each line item sharp, concise, and professional.
6. Return an array of formatted line item strings.
7. Wording rule: never use the words "demolish", "demolition" or "demo" in a line item. Say "Remove" instead (for example: "Remove existing bathtub and tub surround."). Do not repeat the section name inside the line items.
${isMaterials ? materialsRules : ""}
Return JSON in this format:
{
  "formattedItems": [
    "Line item 1...",
    "Line item 2..."
  ],
  "summary": "Brief 1-sentence summary of changes made"
}`;

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            formattedItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of cleanly formatted line items",
            },
            summary: {
              type: Type.STRING,
              description: "Summary of formatting applied",
            },
          },
          required: ["formattedItems"],
        },
      },
    });

    const resultText = response.text || "{}";
    const parsed = JSON.parse(resultText);

    return Response.json({
      success: true,
      formattedItems: (parsed.formattedItems || []).map((item: string) => {
        const cleaned = cleanWording(String(item));
        return isMaterials ? stripActionLead(cleaned) : cleaned;
      }),
      summary: parsed.summary || "Items formatted successfully",
    });
  } catch (error) {
    console.error("Error formatting scope section:", error);
    return Response.json(
      { error: "Failed to format text with AI", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
};