import { GoogleGenAI, Type } from "@google/genai";

// Cloudflare Pages Function — serves POST /api/parse-document
// Parse pasted document text or imported template content into structured proposal sections.

interface Env {
  GEMINI_API_KEY?: string;
  // Older deployments set the same key under this name; accept either.
  AI_API_KEY?: string;
}

// Tried in order: the quality model first, tighter/cheaper ones behind it as
// backups. If Google retires one of these, or a free-tier quota runs out, the
// request slides to the next instead of failing outright.
// Keep this list in sync with functions/api/format-section.ts.
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
    const body = (await request.json()) as { documentText?: string };
    const { documentText } = body;

    if (!documentText || typeof documentText !== "string") {
      return Response.json({ error: "Missing documentText" }, { status: 400 });
    }

    const ai = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY || env.AI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "crackerbox-build",
        },
      },
    });

    const prompt = `You are an AI assistant for a generic construction proposal generator.
Parse the following unstructured or imported document text into a structured construction proposal object.

Document Content:
"""
${documentText}
"""

Extract as much as possible:
- Client Name
- Client Address / Site Location
- Phone Number / Email
- Proposal Date / Project Title
- Scope categories (e.g., Demolition, Framing, Roofing, Electrical, Finishes, Cleanup) with their bullet points
- Special Terms / Legal Clauses if present

Return JSON in this format:
{
  "clientName": "...",
  "siteAddress": "...",
  "phone": "...",
  "email": "...",
  "projectName": "...",
  "categories": [
    {
      "name": "Category Name",
      "items": ["Item 1", "Item 2"]
    }
  ],
  "legalTerms": "..."
}`;

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clientName: { type: Type.STRING },
            siteAddress: { type: Type.STRING },
            phone: { type: Type.STRING },
            email: { type: Type.STRING },
            projectName: { type: Type.STRING },
            categories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  items: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ["name", "items"],
              },
            },
            legalTerms: { type: Type.STRING },
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return Response.json({ success: true, parsedData: parsed });
  } catch (error) {
    console.error("Error parsing document:", error);
    return Response.json(
      { error: "Failed to parse document text", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
};