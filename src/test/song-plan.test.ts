import { describe, it, expect } from "vitest";
import { normalizeSections, timeLyrics } from "@/lib/song-plan";

describe("song plan", () => {
  it("keeps total song length at or under 3 minutes", () => {
    const s = normalizeSections(
      Array.from({ length: 4 }, (_, i) => ({ name: `S${i}`, styles: [], durationMs: 100000, lines: [] })),
    );
    expect(s.reduce((a, x) => a + x.durationMs, 0)).toBeLessThanOrEqual(180000);
  });
  it("lifts sections shorter than 3 seconds", () => {
    expect(normalizeSections([{ name: "A", styles: [], durationMs: 500, lines: [] }])[0].durationMs).toBe(3000);
  });
  it("times lyric lines within their section", () => {
    const t = timeLyrics([
      { name: "Intro", styles: [], durationMs: 10000, lines: [] },
      { name: "Verse", styles: [], durationMs: 20000, lines: ["a", "b"] },
    ]);
    expect(t[0].start).toBe(10);
    expect(t[1].start).toBe(20);
    expect(t[1].end).toBe(30);
  });
});
