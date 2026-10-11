// Shared, browser-safe song helpers.
export type ContextItem = { id: string; title: string; detail: string; source: "photo" | "web" | "location" };

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

/** The composition estimate leads the vocals by one line; delay only the display clock. */
export function lyricHighlightStart(line: TimedLine): number {
  return line.end;
}

export function activeLyricIndex(lines: TimedLine[], seconds: number): number {
  return lines.findIndex((line, i) => {
    const next = lines[i + 1];
    const end = next ? lyricHighlightStart(next) : line.end + (line.end - line.start);
    return seconds >= lyricHighlightStart(line) && seconds < end;
  });
}

/**
 * Spread each section's lines evenly across its time window (seconds).
 * When the real audio length is known, scale the plan to it so timing doesn't drift.
 */
export function timeLyrics(sections: PlannedSection[], actualSeconds = 0): TimedLine[] {
  const out: TimedLine[] = [];
  const planned = sections.reduce((a, s) => a + s.durationMs, 0) / 1000;
  const scale = actualSeconds > 0 && planned > 0 ? actualSeconds / planned : 1;
  let t = 0;
  for (const s of sections) {
    const dur = (s.durationMs / 1000) * scale;
    const n = s.lines.length;
    s.lines.forEach((text, i) => {
      out.push({ start: t + (dur * i) / n, end: t + (dur * (i + 1)) / n, text, section: s.name });
    });
    t += dur;
  }
  return out;
}

/** Model keys shown in the UI mapped to the exact model IDs recorded with each song. */
export const MODEL_IDS = {
  astra: "openai/gpt-6-astra",
  gemini: "google/gemini-3.8-flash",
  opus: "anthropic/claude-opus-5-5",
} as const;
export const MUSIC_MODEL_ID = "elevenlabs/music_v1";

// Mood-driven look for the player, chosen by the songwriter model.
export const THEME_FONTS = [
  "Playfair Display", "Abril Fatface", "Bebas Neue", "Caveat", "Pacifico", "Space Mono",
  "Cormorant Garamond", "Righteous", "Permanent Marker", "Quicksand", "Archivo Black", "Lobster",
] as const;
export type SongTheme = {
  font: string;
  background: string;
  foreground: string;
  accent: string;
  muted: string;
  lyricSize: "sm" | "md" | "lg";
};
const hex = (v: unknown, d: string) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : d);
export function normalizeTheme(t: any): SongTheme | null {
  if (!t || typeof t !== "object") return null;
  return {
    font: (THEME_FONTS as readonly string[]).includes(t.font) ? t.font : "Playfair Display",
    background: hex(t.background, "#1a1410"),
    foreground: hex(t.foreground, "#fbeee0"),
    accent: hex(t.accent, "#f59e0b"),
    muted: hex(t.muted, "#b8a594"),
    lyricSize: ["sm", "md", "lg"].includes(t.lyricSize) ? t.lyricSize : "md",
  };
}
