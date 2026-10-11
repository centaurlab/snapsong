import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Globe, MapPin, Share2, ImagePlus, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SongPlayer } from "@/components/SongPlayer";
import { publishSong } from "@/lib/songs-db";
import { displayName, signInWithGoogle, useUser } from "@/lib/use-session";
import { MODEL_IDS, MUSIC_MODEL_ID } from "@/lib/song-plan";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { analyzePhoto, createSong } from "@/lib/songs.functions";
import type { ContextItem, PlannedSection } from "@/lib/song-plan";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Snapsong — Turn your photos into songs" },
      { name: "description", content: "Upload a photo, pick what matters, and get an original song with synced lyrics." },
      { property: "og:title", content: "Snapsong — Turn your photos into songs" },
      { property: "og:description", content: "Upload a photo, pick what matters, and get an original song with synced lyrics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Model = "astra" | "gemini" | "opus";
const MODELS: { key: Model; label: string }[] = [
  { key: "astra", label: "Astra" },
  { key: "gemini", label: "Gemini" },
  { key: "opus", label: "Opus 5.5" },
];

async function resizeImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise((r, j) => ((img.onload = r), (img.onerror = j), (img.src = url)));
  const max = 1280;
  const s = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * s);
  c.height = Math.round(img.height * s);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.85);
}

async function readExif(file: File): Promise<{ gps: { lat: number; lng: number } | null; takenAt: string | null }> {
  try {
    const exifr = (await import("exifr")).default;
    const [gps, tags] = await Promise.all([
      exifr.gps(file).catch(() => null),
      exifr.parse(file, ["DateTimeOriginal", "CreateDate"]).catch(() => null),
    ]);
    const d: Date | undefined = tags?.DateTimeOriginal ?? tags?.CreateDate;
    return {
      gps: gps && Number.isFinite(gps.latitude) && Number.isFinite(gps.longitude) ? { lat: gps.latitude, lng: gps.longitude } : null,
      takenAt: d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : null,
    };
  } catch {
    return { gps: null, takenAt: null };
  }
}

type Song = { title: string; styles: string[]; sections: PlannedSection[]; audioUrl: string };

const ANALYZE_STEPS = [
  "Reading your photo with the AI model…",
  "Searching the web with Nimble for real-world context…",
  "Distilling findings into song inspiration…",
];
const COMPOSE_STEPS = [
  "Writing lyrics from your picks…",
  "Arranging sections, styles and tempo…",
  "Recording the track with ElevenLabs Music…",
];

function StepProgress({ steps, active }: { steps: string[]; active: number }) {
  return (
    <ol className="space-y-2.5">
      {steps.map((s, i) => (
        <li key={s} className={`flex items-center gap-3 text-sm transition ${i < active ? "text-muted-foreground" : i === active ? "text-foreground" : "text-muted-foreground/50"}`}>
          {i < active ? (
            <Check className="h-4 w-4 shrink-0 text-primary" />
          ) : i === active ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
          ) : (
            <span className="h-4 w-4 shrink-0 rounded-full border border-border" />
          )}
          {s}
        </li>
      ))}
    </ol>
  );
}

function useStepProgress(busy: null | "analyzing" | "composing") {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!busy) return setStep(0);
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, (busy === "analyzing" ? ANALYZE_STEPS : COMPOSE_STEPS).length - 1)), busy === "analyzing" ? 4000 : 12000);
    return () => clearInterval(t);
  }, [busy]);
  return step;
}

function Index() {
  const analyze = useServerFn(analyzePhoto);
  const compose = useServerFn(createSong);
  const fileRef = useRef<HTMLInputElement>(null);
  const [model, setModel] = useState<Model>("astra");
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "analyzing" | "composing">(null);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<null | {
    summary: string;
    mood: string;
    items: ContextItem[];
    webSearched: boolean;
    sources: { title: string; url: string }[];
    location: { lat: number; lng: number; name: string } | null;
  }>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ names: "", mood: "", genre: "", notes: "", length: "medium" as "short" | "medium" | "long" });
  const [song, setSong] = useState<Song | null>(null);
  const step = useStepProgress(busy);
  const { user } = useUser();
  const [meta, setMeta] = useState<{ gps: { lat: number; lng: number } | null; takenAt: string | null }>({ gps: null, takenAt: null });
  const [publishing, setPublishing] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  useEffect(() => () => { if (song) URL.revokeObjectURL(song.audioUrl); }, [song]);

  const onFile = async (f?: File) => {
    if (!f) return;
    setError(null);
    setAnalysis(null);
    const exif = await readExif(f);
    setMeta(exif);
    setPublishedId(null);
    const data = await resizeImage(f);
    setImage(data);
    setBusy("analyzing");
    const res = await analyze({ data: { image: data, model, gps: exif.gps } }).catch((e) => ({ ok: false as const, error: String(e?.message ?? e) }));
    setBusy(null);
    if (!res.ok) return setError(res.error);
    setAnalysis(res);
    setPicked(new Set(res.items.slice(0, 3).map((i) => i.id)));
    setForm((f) => ({ ...f, mood: f.mood || res.mood }));
  };

  const toggle = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const onCompose = async () => {
    if (!analysis) return;
    setError(null);
    setBusy("composing");
    const res = await compose({
      data: {
        model,
        summary: analysis.summary,
        picked: analysis.items.filter((i) => picked.has(i.id)).map(({ title, detail }) => ({ title, detail })),
        ...form,
      },
    }).catch((e) => ({ ok: false as const, error: String(e?.message ?? e) }));
    setBusy(null);
    if (!res.ok) return setError(res.error);
    const bin = Uint8Array.from(atob(res.audio), (c) => c.charCodeAt(0));
    const audioUrl = URL.createObjectURL(new Blob([bin], { type: "audio/mpeg" }));
    setSong({ title: res.title, styles: res.styles, sections: res.sections, audioUrl });
  };

  const onPublish = async () => {
    if (!song || !image || !analysis) return;
    if (!user) return signInWithGoogle().catch((e) => toast.error(e.message));
    setPublishing(true);
    try {
      const id = await publishSong({
        userId: user.id,
        authorName: displayName(user),
        authorAvatar: (user.user_metadata as Record<string, string>)?.avatar_url,
        title: song.title,
        styles: song.styles,
        sections: song.sections,
        summary: analysis.summary,
        photoDataUrl: image,
        audioUrl: song.audioUrl,
        analysisModel: MODEL_IDS[model],
        lyricsModel: MODEL_IDS[model],
        musicModel: MUSIC_MODEL_ID,
        location: meta.gps ? { ...meta.gps, name: analysis.location?.name ?? null } : null,
        takenAt: meta.takenAt,
      });
      setPublishedId(id);
      toast.success("Published to the directory!");
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't publish");
    } finally {
      setPublishing(false);
    }
  };

  const restart = () => {
    setSong(null);
    setImage(null);
    setAnalysis(null);
    setPicked(new Set());
    setError(null);
  };

  if (song && image)
    return (
      <SongPlayer
        image={image}
        {...song}
        onRestart={restart}
        actions={
          publishedId ? (
            <Button variant="secondary" asChild>
              <Link to="/songs/$id" params={{ id: publishedId }}><Check className="h-4 w-4" /> Published</Link>
            </Button>
          ) : (
            <Button variant="secondary" onClick={onPublish} disabled={publishing}>
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              {user ? "Publish" : "Sign in to publish"}
            </Button>
          )
        }
      />
    );

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-12 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Model</p>
        <div className="flex rounded-full border border-border bg-card p-1 text-sm" role="radiogroup" aria-label="AI model">
          {MODELS.map((m) => (
            <button
              key={m.key}
              role="radio"
              aria-checked={model === m.key}
              onClick={() => setModel(m.key)}
              className={`rounded-full px-4 py-1.5 transition ${model === m.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {!image && (
        <section className="text-center">
          <h1 className="text-5xl font-extrabold leading-[1.05] md:text-7xl">
            Every photo has a <span className="text-sunset italic">song</span> in it.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Drop in a picture. We'll read the story, dig up context from the web, and write you an original track.
          </p>
          <button
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}
            className="mx-auto mt-10 flex h-72 w-full max-w-2xl flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-card/50 transition hover:border-primary hover:shadow-glow"
          >
            <ImagePlus className="h-10 w-10 text-primary" />
            <span className="text-lg font-semibold">Upload a photo</span>
            <span className="text-sm text-muted-foreground">or drag it here</span>
          </button>
        </section>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />

      {error && <p className="mx-auto mt-6 max-w-2xl rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">{error}</p>}

      {image && (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="space-y-4">
            <img src={image} alt="Your upload" className="w-full rounded-3xl border border-border object-cover shadow-glow" />
            {analysis && <p className="font-display text-xl italic text-muted-foreground">“{analysis.summary}”</p>}
            <Button variant="ghost" onClick={restart} disabled={!!busy}>Choose another photo</Button>
          </div>

          <div className="space-y-8">
            {busy === "analyzing" && (
              <div className="rounded-2xl bg-card p-6">
                <StepProgress steps={ANALYZE_STEPS} active={step} />
              </div>
            )}

            {analysis && (
              <>
                <section>
                  <h2 className="text-2xl font-semibold">Pick what the song is about</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {analysis.webSearched ? "Includes real-world context found on the web." : "Web context is off — showing what we see in the photo."}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {analysis.items.map((it) => {
                      const on = picked.has(it.id);
                      return (
                        <button
                          key={it.id}
                          onClick={() => toggle(it.id)}
                          className={`relative rounded-2xl border p-4 text-left transition ${on ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"}`}
                        >
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            {it.source === "web" ? <Globe className="h-4 w-4 text-accent" /> : it.source === "location" ? <MapPin className="h-4 w-4 text-accent" /> : <Sparkles className="h-4 w-4 text-primary" />}
                            {it.title}
                            {on && <Check className="ml-auto h-4 w-4 text-primary" />}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{it.detail}</p>
                        </button>
                      );
                    })}
                  </div>
                  {analysis.sources.length > 0 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Sources:{" "}
                      {analysis.sources.slice(0, 4).map((s, i) => (
                        <a key={i} href={s.url} target="_blank" rel="noreferrer" className="mr-2 underline hover:text-foreground">
                          {s.title || new URL(s.url).hostname}
                        </a>
                      ))}
                    </p>
                  )}
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold">Add your touch</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="names">Names</Label>
                      <Input id="names" placeholder="Maya, Leo" value={form.names} onChange={(e) => setForm({ ...form, names: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="mood">Mood</Label>
                      <Input id="mood" placeholder="nostalgic, joyful" value={form.mood} onChange={(e) => setForm({ ...form, mood: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="genre">Genre</Label>
                      <Input id="genre" placeholder="indie folk, lo-fi, pop punk…" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Length</Label>
                      <div className="flex gap-2">
                        {(["short", "medium", "long"] as const).map((l) => (
                          <Button key={l} type="button" variant={form.length === l ? "default" : "secondary"} size="sm" onClick={() => setForm({ ...form, length: l })} className="flex-1 capitalize">
                            {l}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes">Anything else?</Label>
                    <Textarea id="notes" placeholder="It's for my sister's 30th birthday, we met on this beach…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>
                  {busy === "composing" && (
                    <div className="rounded-2xl bg-card p-6">
                      <StepProgress steps={COMPOSE_STEPS} active={step} />
                    </div>
                  )}
                  <Button size="lg" onClick={onCompose} disabled={!!busy || picked.size === 0} className="h-14 w-full rounded-full bg-sunset text-base font-semibold shadow-glow">
                    {busy === "composing" ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> Writing & recording your song… (up to a minute)</>
                    ) : (
                      <><Wand2 className="h-5 w-5" /> Make my song</>
                    )}
                  </Button>
                </section>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
