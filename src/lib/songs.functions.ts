import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ContextItem, PlannedSection } from "./song-plan";
import { normalizeSections } from "./song-plan";

const modelSchema = z.enum(["astra", "gemini", "opus"]);

export const analyzePhoto = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      image: z.string().startsWith("data:image/").max(8_000_000),
      model: modelSchema,
      gps: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).nullable().optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { callModel, parseJson, nimbleSearch, nimbleEnabled } = await import("./ai.server");
    try {
      const place = data.gps ? await reverseGeocode(data.gps.lat, data.gps.lng) : null;
      const vision = parseJson<{
        summary: string;
        mood: string;
        details: { title: string; detail: string }[];
        searchQueries: string[];
      }>(
        await callModel({
          model: data.model,
          system:
            "You are a perceptive photo analyst who finds the emotional story in pictures for songwriters. Reply with JSON only.",
          text: `${place ? `This photo was taken at ${place.full}. ` : ""}Study this photo. Return JSON: {"summary": one evocative sentence, "mood": 2-4 words, "details": 6 items of {"title": short label, "detail": one vivid sentence} covering people, place, objects, light, season, emotion, any visible text/landmarks, "searchQueries": 2 short web search queries that could reveal real-world context (landmark, event, culture, place) — empty array if nothing identifiable}.`,
          imageDataUrl: data.image,
        }),
      );

      const queries = [...(place ? [`${place.short} history and culture`] : []), ...(vision.searchQueries ?? [])].slice(0, 2);
      const web = (await Promise.all(queries.map(nimbleSearch))).flat();

      let webItems: ContextItem[] = [];
      if (web.length) {
        const distilled = parseJson<{ items: { title: string; detail: string }[] }>(
          await callModel({
            model: data.model,
            system: "You turn web research into song inspiration. Reply with JSON only.",
            text: `Photo: ${vision.summary}\nWeb findings:\n${web
              .map((w) => `- ${w.title}: ${w.snippet}`)
              .join("\n")}\n\nReturn JSON {"items": up to 4 of {"title": short label, "detail": one sentence of real-world context useful for lyrics}}.`,
          }),
        );
        webItems = (distilled.items ?? []).slice(0, 4).map((d, i) => ({
          id: `w${i}`,
          title: String(d.title),
          detail: String(d.detail),
          source: "web",
        }));
      }

      const items: ContextItem[] = [
        ...(place
          ? [{ id: "loc", title: `Taken in ${place.short}`, detail: `This photo was taken at ${place.full}.`, source: "location" as const }]
          : []),
        ...(vision.details ?? []).slice(0, 6).map((d, i) => ({
          id: `p${i}`,
          title: String(d.title),
          detail: String(d.detail),
          source: "photo" as const,
        })),
        ...webItems,
      ];
      return {
        ok: true as const,
        summary: String(vision.summary ?? ""),
        mood: String(vision.mood ?? ""),
        items,
        webSearched: nimbleEnabled(),
        location: place ? { lat: data.gps!.lat, lng: data.gps!.lng, name: place.full } : null,
        sources: web.filter((w) => w.url).map((w) => ({ title: w.title, url: w.url })),
      };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? "Something went wrong" };
    }
  });

export const createSong = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      model: modelSchema,
      summary: z.string().max(2000),
      picked: z.array(z.object({ title: z.string(), detail: z.string() })).max(12),
      names: z.string().max(300),
      mood: z.string().max(200),
      genre: z.string().max(200),
      notes: z.string().max(1000),
      length: z.enum(["short", "medium", "long"]),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { callModel, parseJson, composeMusic } = await import("./ai.server");
    try {
      const seconds = { short: 45, medium: 90, long: 150 }[data.length];
      const plan = parseJson<{
        title: string;
        globalStyles: string[];
        negativeStyles: string[];
        sections: PlannedSection[];
      }>(
        await callModel({
          model: data.model,
          system:
            "You are a hit songwriter and producer. Write original, singable, specific lyrics. Never reference real artists. Reply with JSON only.",
          text: `Write a song inspired by a photo.
Photo: ${data.summary}
Chosen inspiration:
${data.picked.map((p) => `- ${p.title}: ${p.detail}`).join("\n")}
Names to include: ${data.names || "none"}
Mood: ${data.mood || "match the photo"}
Genre/style: ${data.genre || "your choice that fits the photo"}
Extra notes: ${data.notes || "none"}
Total length about ${seconds} seconds.

Return JSON {"title": string, "globalStyles": 3-6 short music style tags (genre, instruments, vocal type, tempo), "negativeStyles": 0-3 tags to avoid, "sections": array of {"name": e.g. "Intro","Verse 1","Chorus","Bridge","Outro", "styles": 1-3 tags, "durationMs": integer, "lines": lyric lines (empty array for instrumental intro)}}. Durations must sum to about ${seconds * 1000}. Each section 3000-60000ms. Keep lines short (under 12 words).`,
        }),
      );
      const sections = normalizeSections(plan.sections ?? []);
      if (!sections.length) throw new Error("The songwriter didn't return any sections. Try again.");
      const audio = await composeMusic({
        globalStyles: (plan.globalStyles ?? []).slice(0, 6),
        negativeStyles: (plan.negativeStyles ?? []).slice(0, 3),
        sections,
      });
      return {
        ok: true as const,
        title: String(plan.title || "Untitled"),
        styles: (plan.globalStyles ?? []).slice(0, 6),
        sections,
        audio,
      };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? "Something went wrong" };
    }
  });

async function reverseGeocode(lat: number, lng: number): Promise<{ short: string; full: string } | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&lat=${lat}&lon=${lng}`,
      { headers: { "User-Agent": "Snapsong/1.0 (picture-playlist-project.lovable.app)", "Accept-Language": "en" } },
    );
    if (!r.ok) return null;
    const j: any = await r.json();
    const a = j.address ?? {};
    const city = a.city || a.town || a.village || a.suburb || a.county;
    const spot = a.neighbourhood || a.suburb || a.road;
    const short = [spot !== city ? spot : null, city].filter(Boolean).join(", ") || a.country || "";
    const full = [spot, city, a.state, a.country].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i).join(", ");
    return short ? { short, full: full || short } : null;
  } catch {
    return null;
  }
}
