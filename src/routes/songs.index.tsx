import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Disc3, Loader2, MapPin, Pause, Play, Plus } from "lucide-react";
import { listSongs } from "@/lib/songs-db";

export const Route = createFileRoute("/songs/")({
  head: () => ({
    meta: [
      { title: "Song Directory — Snapsong" },
      { name: "description", content: "Listen to songs people made from their photos on Snapsong." },
      { property: "og:title", content: "Song Directory — Snapsong" },
      { property: "og:description", content: "Listen to songs people made from their photos on Snapsong." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: Directory,
});

type Song = Awaited<ReturnType<typeof listSongs>>[number];

function usePlayer() {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Song | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const a = new Audio();
    ref.current = a;
    a.ontimeupdate = () => setProgress(a.duration ? a.currentTime / a.duration : 0);
    a.onplay = () => setPlaying(true);
    a.onpause = () => setPlaying(false);
    a.onended = () => setPlaying(false);
    return () => a.pause();
  }, []);
  const toggle = (s: Song) => {
    const a = ref.current!;
    if (current?.id === s.id) return a.paused ? a.play() : a.pause();
    a.src = s.audioUrl;
    setCurrent(s);
    setProgress(0);
    a.play();
  };
  return { current, playing, progress, toggle };
}

function Directory() {
  const q = useQuery({ queryKey: ["songs"], queryFn: listSongs });
  const p = usePlayer();
  const songs = q.data ?? [];
  const [hero, ...rest] = songs;
  const isOn = (s: Song) => p.current?.id === s.id && p.playing;

  return (
    <main className="mx-auto max-w-6xl px-6 pb-32 pt-10">
      {q.isLoading && <Loader2 className="mx-auto mt-24 h-8 w-8 animate-spin text-primary" />}
      {q.error && <p className="mt-10 text-sm text-destructive">Couldn't load songs.</p>}

      {q.data && !songs.length && <EmptyState />}

      {hero && (
        <section className="relative overflow-hidden rounded-3xl border border-border">
          <img src={hero.photoUrl} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="relative flex flex-col gap-8 p-6 md:flex-row md:items-end md:p-10">
            <img src={hero.photoUrl} alt={hero.title} className="aspect-square w-48 rounded-2xl object-cover shadow-glow md:w-60" />
            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Latest drop</p>
              <Link to="/songs/$id" params={{ id: hero.id }} className="block font-display text-4xl font-extrabold leading-tight hover:underline md:text-6xl">
                {hero.title}
              </Link>
              <Meta s={hero} />
              <div className="flex items-center gap-3 pt-2">
                <button onClick={() => p.toggle(hero)} aria-label={isOn(hero) ? "Pause" : "Play"} className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition hover:scale-105">
                  {isOn(hero) ? <Pause className="h-6 w-6 fill-current" /> : <Play className="ml-1 h-6 w-6 fill-current" />}
                </button>
                <Link to="/songs/$id" params={{ id: hero.id }} className="rounded-full border border-border px-5 py-2 text-sm font-semibold hover:border-foreground">
                  Open with lyrics
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {songs.length > 0 && (
        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-2xl font-bold">Fresh from the community</h2>
            <Link to="/" className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
              <Plus className="h-4 w-4" /> Make yours
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {(rest.length ? rest : [hero]).map((s) => (
              <div key={s.id} className="group rounded-2xl p-3 transition hover:bg-card">
                <div className="relative">
                  <img src={s.photoUrl} alt={s.title} loading="lazy" className="aspect-square w-full rounded-xl object-cover shadow-lg" />
                  <button
                    onClick={() => p.toggle(s)}
                    aria-label={isOn(s) ? "Pause" : "Play"}
                    className={`absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition ${isOn(s) ? "opacity-100" : "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"}`}
                  >
                    {isOn(s) ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
                  </button>
                </div>
                <Link to="/songs/$id" params={{ id: s.id }} className="mt-3 block truncate font-semibold hover:underline">{s.title}</Link>
                <p className="truncate text-sm text-muted-foreground">{s.author_name ?? "Someone"}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {p.current && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur">
          <div className="h-0.5 bg-primary" style={{ width: `${p.progress * 100}%` }} />
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
            <img src={p.current.photoUrl} alt="" className="h-12 w-12 rounded-md object-cover" />
            <div className="min-w-0 flex-1">
              <Link to="/songs/$id" params={{ id: p.current.id }} className="block truncate font-semibold hover:underline">{p.current.title}</Link>
              <p className="truncate text-sm text-muted-foreground">{p.current.author_name ?? "Someone"}</p>
            </div>
            <button onClick={() => p.toggle(p.current!)} aria-label={p.playing ? "Pause" : "Play"} className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background transition hover:scale-105">
              {p.playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Meta({ s }: { s: Song }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
      {s.author_avatar && <img src={s.author_avatar} alt="" className="h-6 w-6 rounded-full" />}
      <span className="font-semibold text-foreground">{s.author_name ?? "Someone"}</span>
      <span>· {new Date(s.created_at).toLocaleDateString()}</span>
      {s.location_name && <span className="flex items-center gap-1">· <MapPin className="h-3 w-3" /> {s.location_name}</span>}
      {s.styles?.slice(0, 3).map((t) => (
        <span key={t} className="rounded-full bg-card px-2.5 py-0.5 text-xs">{t}</span>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card/40 px-6 py-16 text-center md:py-24">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-6 opacity-20" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <Disc3 key={i} className="h-40 w-40 shrink-0 animate-spin text-primary" style={{ animationDuration: `${8 + i * 2}s` }} />
        ))}
      </div>
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">The directory</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold md:text-6xl">The stage is empty.</h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">Turn a photo into a track and be the first song people hear here.</p>
        <Link to="/" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-semibold text-primary-foreground shadow-glow transition hover:scale-105">
          <Plus className="h-5 w-5" /> Make the first song
        </Link>
      </div>
    </section>
  );
}
