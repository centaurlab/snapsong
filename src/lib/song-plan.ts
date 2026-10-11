// Shared, browser-safe song helpers.
export type ContextItem = { id: string; title: string; detail: string; source: "photo" | "web" };

export type PlannedSection = { name: string; styles: string[]; durationMs: number; lines: string[] };

export const MIN_SECTION_MS = 3000;
export const MAX_SECTION_MS = 120000;
export const MAX_TOTAL_MS = 180000;

/** Clamp section durations to what the music engine accepts and keep total under the cap. */
export function normalizeSections(sections: PlannedSection[]): PlannedSection[] {
  const clean = sections
    .filter((s) => s && s.name)
    .slice(0, 8)
    .map((s) => ({
      name: String(s.name).slice(0, 40),
      styles: (s.styles ?? []).map(String).slice(0, 5),
      lines: (s.lines ?? []).map((l) => String(l).slice(0, 200)).slice(0, 8),
      durationMs: Math.min(MAX_SECTION_MS, Math.max(MIN_SECTION_MS, Math.round(Number(s.durationMs) || 15000))),
    }));
  const total = clean.reduce((a, s) => a + s.durationMs, 0);
  if (total > MAX_TOTAL_MS) {
    const f = MAX_TOTAL_MS / total;
    clean.forEach((s) => (s.durationMs = Math.max(MIN_SECTION_MS, Math.floor(s.durationMs * f))));
  }
  return clean;
}

export type TimedLine = { start: number; end: number; text: string; section: string };

/** Spread each section's lines evenly across its time window (seconds). */
export function timeLyrics(sections: PlannedSection[]): TimedLine[] {
  const out: TimedLine[] = [];
  let t = 0;
  for (const s of sections) {
    const dur = s.durationMs / 1000;
    const n = s.lines.length;
    s.lines.forEach((text, i) => {
      out.push({ start: t + (dur * i) / n, end: t + (dur * (i + 1)) / n, text, section: s.name });
    });
    t += dur;
  }
  return out;
}
