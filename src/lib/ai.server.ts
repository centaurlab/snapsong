// Server-only AI + Nimble + ElevenLabs helpers. Never import from browser code.
export type ModelKey = "astra" | "gemini" | "opus";

export const MODEL_IDS: Record<ModelKey, string> = {
  astra: "openai/gpt-6-astra",
  gemini: "google/gemini-3.8-flash",
  opus: "anthropic/claude-opus-5-5",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

export class AppError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

function key() {
  const k = process.env.LOVABLE_API_KEY;
  if (!k) throw new AppError("AI is not configured", 401);
  return k;
}

async function readSSE(res: Response, onData: (json: any) => void) {
  if (!res.body) return;
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        onData(JSON.parse(payload));
      } catch {
        /* ignore partial */
      }
    }
  }
}

async function ensureOk(res: Response) {
  if (res.ok) return;
  const body = await res.text();
  console.error(`AI gateway error [${res.status}]: ${body}`);
  let msg = `AI request failed (${res.status})`;
  try {
    const j = JSON.parse(body);
    msg = j?.error?.message || j?.message || msg;
  } catch {
    /* noop */
  }
  if (res.status === 402) msg = "AI credits ran out. Add credits in Settings → Plans & credits.";
  if (res.status === 429) msg = "Too many requests right now — please try again in a moment.";
  throw new AppError(msg, res.status);
}

/** Streams a single prompt (optionally with an image) and returns the final text. */
export async function callModel(opts: {
  model: ModelKey;
  system: string;
  text: string;
  imageDataUrl?: string;
}): Promise<string> {
  const { model, system, text, imageDataUrl } = opts;
  const id = MODEL_IDS[model];
  const headers = {
    Authorization: `Bearer ${key()}`,
    "Lovable-API-Key": key(),
    "Content-Type": "application/json",
    "X-Lovable-AIG-SDK": "fetch",
  };
  let out = "";

  if (model === "astra") {
    const content: any[] = [{ type: "input_text", text }];
    if (imageDataUrl) content.push({ type: "input_image", image_url: imageDataUrl });
    const res = await fetch(`${GATEWAY}/responses`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: id,
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions: system,
        input: [{ role: "user", content }],
      }),
    });
    await ensureOk(res);
    await readSSE(res, (e) => {
      if (e.type === "response.output_text.delta") out += e.delta ?? "";
      if (e.type === "error" || e.type === "response.failed")
        throw new AppError(e?.error?.message || "AI request failed");
    });
  } else if (model === "gemini") {
    const content: any[] = [{ type: "text", text }];
    if (imageDataUrl) content.push({ type: "image_url", image_url: { url: imageDataUrl } });
    const res = await fetch(`${GATEWAY}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: id,
        stream: true,
        messages: [
          { role: "system", content: system },
          { role: "user", content },
        ],
      }),
    });
    await ensureOk(res);
    await readSSE(res, (e) => {
      out += e?.choices?.[0]?.delta?.content ?? "";
    });
  } else {
    const content: any[] = [];
    if (imageDataUrl) {
      const m = imageDataUrl.match(/^data:(.+?);base64,(.*)$/);
      if (m) content.push({ type: "image", source: { type: "base64", media_type: m[1], data: m[2] } });
    }
    content.push({ type: "text", text });
    const res = await fetch(`${GATEWAY}/messages`, {
      method: "POST",
      headers: { ...headers, "anthropic-version": "2023-06-01", "x-api-key": key() },
      body: JSON.stringify({
        model: id,
        max_tokens: 8000,
        stream: true,
        system,
        messages: [{ role: "user", content }],
      }),
    });
    await ensureOk(res);
    await readSSE(res, (e) => {
      if (e.type === "content_block_delta" && e.delta?.type === "text_delta") out += e.delta.text;
      if (e.type === "error") throw new AppError(e?.error?.message || "AI request failed");
    });
  }

  if (!out.trim()) throw new AppError("The AI returned an empty answer. Try another photo.");
  return out;
}

export function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/```(?:json)?/g, "").trim();
  const start = cleaned.search(/[[{]/);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    throw new AppError("Couldn't read the AI's answer. Please try again.");
  }
}

// ---------- Nimble ----------
export type WebFinding = { title: string; url: string; snippet: string };

export async function nimbleSearch(query: string): Promise<WebFinding[]> {
  const k = process.env.NIMBLE_API_KEY;
  if (!k) return [];
  try {
    const res = await fetch("https://sdk.nimbleway.com/v2/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, max_results: 4, search_depth: "lite" }),
    });
    if (!res.ok) {
      console.error(`Nimble error [${res.status}]: ${await res.text()}`);
      return [];
    }
    const j: any = await res.json();
    const list: any[] = j?.results ?? j?.data?.results ?? [];
    return list.slice(0, 4).map((r) => ({
      title: String(r.title ?? ""),
      url: String(r.url ?? r.link ?? ""),
      snippet: String(r.description ?? r.snippet ?? r.content ?? "").slice(0, 400),
    }));
  } catch (e) {
    console.error("Nimble failed", e);
    return [];
  }
}

export const nimbleEnabled = () => Boolean(process.env.NIMBLE_API_KEY);

// ---------- ElevenLabs Music ----------
export type Section = { name: string; styles: string[]; durationMs: number; lines: string[] };

export async function composeMusic(plan: {
  globalStyles: string[];
  negativeStyles: string[];
  sections: Section[];
}): Promise<string> {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) throw new AppError("ElevenLabs is not connected", 401);
  const res = await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", {
    method: "POST",
    headers: { "xi-api-key": k, "Content-Type": "application/json" },
    body: JSON.stringify({
      model_id: "music_v1",
      composition_plan: {
        positive_global_styles: plan.globalStyles,
        negative_global_styles: plan.negativeStyles,
        sections: plan.sections.map((s) => ({
          section_name: s.name,
          positive_local_styles: s.styles,
          negative_local_styles: [],
          duration_ms: s.durationMs,
          lines: s.lines,
        })),
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`ElevenLabs error [${res.status}]: ${body}`);
    let msg = `Music generation failed (${res.status})`;
    try {
      const j = JSON.parse(body);
      msg = j?.detail?.message || (typeof j?.detail === "string" ? j.detail : msg);
    } catch {
      /* noop */
    }
    throw new AppError(msg, res.status);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  }
  return btoa(bin);
}
