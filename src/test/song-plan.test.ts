import { describe, it, expect } from "vitest";
import { activeLyricIndex, lyricHighlightStart, normalizeSections, timeLyrics } from "@/lib/song-plan";

describe("song plan", () => {
  it("highlights at line onset without falling one full line behind, including after seeking backwards", () => {
    const lines = timeLyrics([{ name: "Verse", styles: [], durationMs: 20000, lines: ["a", "b", "c", "d"] }]);
    expect(activeLyricIndex(lines, 0)).toBe(0);
    expect(activeLyricIndex(lines, 4.99)).toBe(0);
    expect(activeLyricIndex(lines, 5)).toBe(1);
    expect(activeLyricIndex(lines, 10)).toBe(2);
    expect(activeLyricIndex(lines, 15)).toBe(3);
    expect(activeLyricIndex(lines, 20)).toBe(-1);
    expect(activeLyricIndex(lines, 6)).toBe(1);
  });
  it("seeks to the corrected highlight time for the chosen line", () => {
    expect(lyricHighlightStart({ start: 10, end: 15, text: "a", section: "Verse" })).toBe(10);
  });
  it("keeps the selected lyric active when audio seeking rounds down by microseconds", () => {
    const lines = timeLyrics([{ name: "Verse", styles: [], durationMs: 20000, lines: ["a", "b", "c", "d"] }]);
    expect(activeLyricIndex(lines, 4.999999)).toBe(1);
    expect(activeLyricIndex(lines, 4.99)).toBe(0);
  });
  it("uses scaled line onsets throughout a longer recording without adding a line delay", () => {
    const lines = timeLyrics([{ name: "Verse", styles: [], durationMs: 100000, lines: ["a", "b", "c", "d"] }], 120);
    expect(activeLyricIndex(lines, 30)).toBe(1);
    expect(activeLyricIndex(lines, 60)).toBe(2);
    expect(activeLyricIndex(lines, 90)).toBe(3);
    expect(lyricHighlightStart(lines[3] ?? { start: -1, end: -1, text: "", section: "" })).toBe(90);
  });
  it("keeps total song length at or under 3 minutes", () => {
    const s = normalizeSections(
      Array.from({ length: 4 }, (_, i) => ({ name: `S${i}`, styles: [], durationMs: 100000, lines: [] })),
    );
    expect(s.reduce((a, x) => a + x.durationMs, 0)).toBeLessThanOrEqual(180000);
  });
  it("lifts sections shorter than 3 seconds", () => {
    expect(normalizeSections([{ name: "A", styles: [], durationMs: 500, lines: [] }])[0]?.durationMs).toBe(3000);
  });
  it("times lyric lines within their section", () => {
    const t = timeLyrics([
      { name: "Intro", styles: [], durationMs: 10000, lines: [] },
      { name: "Verse", styles: [], durationMs: 20000, lines: ["a", "b"] },
    ]);
    expect(t[0]?.start).toBe(10);
    expect(t[1]?.start).toBe(20);
    expect(t[1]?.end).toBe(30);
  });
  it("stretches lyric timing to the real song length so it doesn't drift", () => {
    const t = timeLyrics([{ name: "Verse", styles: [], durationMs: 100000, lines: ["a", "b"] }], 120);
    expect(t[1]?.start).toBe(60);
    expect(t[1]?.end).toBe(120);
  });
});
