import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { activeLyricIndex, lyricHighlightStart, timeLyrics, type PlannedSection, type SongTheme } from "@/lib/song-plan";
import type { CSSProperties } from "react";

type Props = {
  image: string;
  title: string;
  styles: string[];
  sections: PlannedSection[];
  audioUrl: string;
  onRestart?: () => void;
  actions?: ReactNode;
  theme?: SongTheme | null;
};

export function SongPlayer({ image, title, styles, sections, audioUrl, onRestart, actions, theme }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const lines = useMemo(() => timeLyrics(sections, dur), [sections, dur]);
  const active = activeLyricIndex(lines, t);

  // Read the audio clock each frame while playing; timeupdate alone can lag a beat.
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      const audio = audioRef.current;
      if (!audio) return;
      setT(audio.currentTime);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  useEffect(() => {
    lineRefs.current[active]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [active]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play();
    else a.pause();
  };
  useEffect(() => {
    if (!theme) return;
    const id = `font-${theme.font.replace(/ /g, "-")}`;
    if (document.getElementById(id)) return;
    const l = document.createElement("link");
    l.id = id;
    l.rel = "stylesheet";
    l.href = `https://fonts.googleapis.com/css2?family=${theme.font.replace(/ /g, "+")}:wght@400;700&display=swap`;
    document.head.appendChild(l);
  }, [theme]);
  // Override design tokens so the whole player takes on the song's look.
  const themeStyle = theme
    ? ({
        "--background": theme.background,
        "--foreground": theme.foreground,
        "--primary": theme.accent,
        "--muted-foreground": theme.muted,
        "--card": theme.background,
        "--border": `color-mix(in oklab, ${theme.foreground} 15%, transparent)`,
        "--font-display": `"${theme.font}", serif`,
        backgroundColor: theme.background,
        color: theme.foreground,
      } as CSSProperties)
    : undefined;
  const lyricCls = { sm: "text-xl md:text-2xl", md: "text-2xl md:text-3xl", lg: "text-3xl md:text-5xl" }[theme?.lyricSize ?? "md"];
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="relative overflow-hidden transition-colors duration-1000" style={themeStyle}>
      <img src={image} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-3xl" />
      <div className="absolute inset-0 bg-background/60" />
      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
        onSeeked={(e) => setT(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        autoPlay
      />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-border shadow-glow">
            <img
              src={image}
              alt={title}
              className={`aspect-square w-full object-cover ${playing ? "animate-kenburns" : ""}`}
            />
          </div>
          <div>
            <h1 className="font-display text-4xl font-extrabold md:text-5xl">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{styles.join(" · ")}</p>
          </div>
          <div className="space-y-3">
            <input
              type="range"
              min={0}
              max={dur || 0}
              step={0.1}
              value={t}
              onChange={(e) => audioRef.current && (audioRef.current.currentTime = Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="Seek"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{fmt(t)}</span>
              <span>{fmt(dur)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={toggle} className="h-14 w-14 rounded-full bg-sunset p-0 shadow-glow" aria-label={playing ? "Pause" : "Play"}>
                {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
              <Button variant="secondary" asChild>
                <a href={audioUrl} download={`${title}.mp3`}>
                  <Download className="h-4 w-4" /> Download
                </a>
              </Button>
              {actions}
              {onRestart && (
                <Button variant="ghost" onClick={onRestart}>
                  <RotateCcw className="h-4 w-4" /> New song
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="h-[70vh] overflow-y-auto rounded-3xl border border-border bg-card/40 p-8 backdrop-blur [mask-image:linear-gradient(transparent,black_15%,black_85%,transparent)]">
          <div className="space-y-4 py-[25vh]">
            {lines.map((l, i) => {
               const newSection = i === 0 || lines[i - 1]?.section !== l.section;
              return (
                <div key={i}>
                  {newSection && (
                    <p className="mb-2 mt-6 text-xs uppercase tracking-[0.2em] text-primary">{l.section}</p>
                  )}
                  <p
                    ref={(el) => {
                      lineRefs.current[i] = el;
                    }}
                    onClick={() => audioRef.current && (audioRef.current.currentTime = lyricHighlightStart(l))}
                     className={`cursor-pointer font-display leading-snug ${lyricCls} ${
                      i === active ? "scale-[1.02] text-foreground" : i < active ? "text-muted-foreground/60" : "text-muted-foreground"
                    }`}
                  >
                    {l.text}
                  </p>
                </div>
              );
            })}
            {!lines.length && <p className="text-muted-foreground">Instrumental</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
