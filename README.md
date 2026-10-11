# SnapSong

**Every photo has a *song* in it.**

SnapSong turns a photo into an original song. Upload a picture, choose the details that matter, add names and memories, and generate a track with your photo and highlighted lyrics.

Built by [Centaur Lab](https://centaurlab.ai) with React, TanStack Start, Supabase, and ElevenLabs Music.

[App link](https://snapsong.lovable.app) · [Repository](https://github.com/centaurlab/snapsong)
## What it does

- **Understand a photo:** extract a summary, mood, and selectable visual details using Astra, Gemini, or Opus.
- **Add real-world context:** optionally research places, landmarks, and other identifiable details with Nimble.
- **Use photo metadata:** read GPS coordinates and capture dates from EXIF; resolve coordinates to a place with OpenStreetMap Nominatim.
- **Personalize the song:** choose inspiration cards and provide names, mood, genre, and extra notes.
- **Generate music:** create lyrics and a structured composition plan, then render an MP3 with ElevenLabs Music.
- **Listen with the photo:** play, pause, seek, download, or click a lyric line to jump to its estimated position. The songwriter also selects the player's colors and typography.
- **Publish and discover:** sign in to publish a song, browse the community directory, and open an individual song page.

The current music integration is **ElevenLabs Music**.

## How it works

1. The browser reads EXIF metadata, resizes the image to a maximum dimension of 1,280 pixels, and converts it to JPEG.
2. `analyzePhoto` reverse-geocodes GPS coordinates when available and sends the image to the selected model through the Lovable AI gateway.
3. Up to two search queries are sent to Nimble when configured. The model turns any returned findings into additional inspiration cards.
4. The user selects context and adds personal details.
5. `createSong` asks the selected model for a title, style tags, lyric sections, durations, and a visual theme.
6. The server normalizes the sections and sends a composition plan to ElevenLabs. The generated MP3 returns to the browser as base64 and becomes a local audio object URL.
7. Publishing uploads the photo and MP3 to Supabase Storage, then inserts the song metadata into Postgres.

Generation is available without signing in. Publishing requires an authenticated Supabase user.

**Sign in before generating if you intend to publish.** Unpublished songs live in component state; the current sign-in redirect reloads the page and does not preserve that draft.

## Stack

| Layer | Implementation |
| --- | --- |
| Application | React 19, TypeScript, TanStack Start and TanStack Router |
| Build and server | Vite 8, Nitro, TanStack/Vite configuration |
| UI | Tailwind CSS 4, shadcn/ui and Radix components, Lucide icons |
| Data fetching | TanStack Query |
| Authentication and persistence | Supabase Auth, Postgres, and Storage |
| AI orchestration | Server-side fetch calls through the Lovable AI gateway |
| Web research | Nimble, optional |
| Music | ElevenLabs Music composition plans |
| Metadata | exifr and OpenStreetMap Nominatim |
| Validation and tests | Zod, Vitest, Testing Library |

### Configured models

These are the identifiers in the source code, not a guarantee of availability on every gateway account.

| UI choice | Gateway model ID |
| --- | --- |
| Astra | `openai/gpt-6-astra` |
| Gemini | `google/gemini-3.8-flash` |
| Opus 5.5 | `anthropic/claude-opus-5-5` |

Music requests use ElevenLabs `music_v1` with `mp3_44100_128` output. Published records identify the music model as `elevenlabs/music_v1`.

## Local development

### Prerequisites

- Git and a current Bun installation. The repository includes `bun.lock`.
- A Supabase project with Auth, Postgres, and Storage.
- A Lovable AI gateway key with access to the configured models.
- An ElevenLabs key with Music access.
- Optionally, a Nimble API key.

The repository does not pin a Node.js or Bun runtime version. If using Node/npm instead of Bun, use a Node version compatible with the pinned Vite release and ensure server environment variables are loaded into the process.

### 1. Install dependencies

```sh
git clone https://github.com/centaurlab/snapsong.git
cd snapsong
bun install --frozen-lockfile
```

### 2. Configure the environment

Create `.env.local` in the repository root. Files matching `*.local` are ignored by Git.

```dotenv
# Browser configuration: use your project's public/publishable key.
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY

# Server-side configuration for the same backend.
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY

# Required for photo analysis and songwriting.
LOVABLE_API_KEY=YOUR_LOVABLE_AI_GATEWAY_KEY

# Required for audio generation.
ELEVENLABS_API_KEY=YOUR_ELEVENLABS_MUSIC_KEY

# Optional: leave unset to skip web research.
NIMBLE_API_KEY=
```

Only public browser configuration belongs in `VITE_*` variables. Keep AI, music, database, and service-role credentials server-side.

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase URL included in the browser build |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public/publishable key included in the browser build |
| `SUPABASE_URL` | Server-side Supabase URL and SSR fallback |
| `SUPABASE_PUBLISHABLE_KEY` | Server-side public key and SSR fallback |
| `LOVABLE_API_KEY` | Required for both photo analysis and lyric/composition planning |
| `ELEVENLABS_API_KEY` | Required to render music |
| `NIMBLE_API_KEY` | Optional web search; missing keys or search failures produce no web findings |
| `LOVABLE_DB_MIGRATION_URL` | Database connection URL used by `drizzle.config.ts`; migration tooling only |
| `SUPABASE_SERVICE_ROLE_KEY` | Used by the generated admin-client helper, not the current song generation or browser publishing flow |

### 3. Prepare Supabase

For a fresh Supabase project:

1. Enable email/password authentication.
2. Configure the Auth site URL and allowed redirect URLs for your development and deployed origins. Signup confirmation returns to the origin; password reset returns to `/reset-password`.
3. Apply the SQL files in `drizzle/migrations/` in order, using an administrative migration connection or the Supabase SQL editor:
   - `0000_migration.sql`: songs table, grants, indexes, and initial row/storage policies.
   - `0001_migration.sql`: restrict storage reads to published songs or the owner.
   - `0002_add_song_theme.sql`: add the player's visual theme.
4. Create a **private Storage bucket named `songs`**. Bucket creation is not included in the migrations. Allow JPEG and MP3 uploads and set a file-size limit appropriate for generated tracks.

These migrations assume Supabase's `auth` and `storage` schemas and roles exist; they are not a standalone vanilla Postgres bootstrap. Do not replay the initial migration against a database where it has already been applied.

`drizzle/schema.ts` is intentionally empty and marked generated. Use the existing SQL migrations as the schema reference; do not use a schema-push operation based on that empty file.

### 4. Start the app

```sh
bun --env-file=.env.local run dev
```

Open the development URL printed by Vite. The Lovable configuration controls the host and port.

## Development commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the development server |
| `bun run build` | Create a production build |
| `bun run build:dev` | Build in development mode |
| `bun run preview` | Preview the build |
| `bun run lint` | Run ESLint |
| `bun run format` | Format the repository with Prettier |
| `bun run test` | Run Vitest once |
| `bun run test:watch` | Run Vitest in watch mode |

Use `bun --env-file=.env.local run <script>` when explicitly loading local environment variables. Deployment environments must supply server secrets at runtime as well as public variables at build time.

Existing tests cover song-section normalization, estimated lyric timing, and matching the home route. They do not exercise paid AI/music calls or end-to-end publishing.

## Routes and source map

| Path | Purpose |
| --- | --- |
| `/` | Photo upload, context selection, generation, and preview |
| `/auth` | Email/password sign-in, signup, and reset request |
| `/reset-password` | Set a replacement password |
| `/songs` | Community directory with quick playback and mini player |
| `/songs/$id` | Published song player |

| Source | Responsibility |
| --- | --- |
| `src/routes/` | File-based application routes |
| `src/components/SongPlayer.tsx` | Photo, playback controls, lyric highlighting, and theme |
| `src/lib/ai.server.ts` | Provider requests, SSE parsing, Nimble, and ElevenLabs |
| `src/lib/songs.functions.ts` | Validated server functions for analysis and composition; reverse geocoding |
| `src/lib/song-plan.ts` | Shared types, section normalization, lyric timing, and theme validation |
| `src/lib/songs-db.ts` | Browser-side upload, publishing, listing, and song retrieval |
| `src/integrations/supabase/` | Clients, auth helpers, and generated database types |
| `src/start.ts` | Auth-token attachment, CSRF protection, and request error handling |
| `src/server.ts` | SSR entry and server error wrapper |
| `drizzle/migrations/` | Database schema and access policies |
| `src/test/` | Unit and routing tests |
| `vite.config.ts` | Lovable/TanStack/Nitro build configuration |

To change models, update the request mapping in `ai.server.ts` and the recorded model mapping in `song-plan.ts` together. Update the model labels in `src/routes/index.tsx` as needed. Keep provider credentials and requests in server-only code.

## Publishing and data access

Publishing stores:

- A JPEG and MP3 at `<user-id>/<song-id>.jpg` and `<user-id>/<song-id>.mp3` in the `songs` bucket.
- The title, author, style tags, lyric sections, photo summary, model identifiers, theme, and storage paths in `public.songs`.
- GPS coordinates, a location name when resolved, and capture time when available.

New song rows default to `published = true`. Row-level security allows public reads of published songs and owner access to their own rows. Authenticated users can insert, update, and delete their own rows under the database policies. The application currently exposes publishing, but no edit, unpublish, or delete interface.

Media reads use signed URLs valid for six hours. Storage policies allow reads when the corresponding song is published or the requester owns the files.

**Publishing also makes stored photo metadata readable with the song record, including precise coordinates when present.** The current upload flow reads GPS automatically and has no separate location opt-in or removal control.

## Deployment

The repository is connected to [Lovable](https://lovable.dev/projects/14ff61b8-06b9-46e6-841e-d09e6364d85b). Changes pushed to the connected branch sync into its editor.

- Configure the Supabase connection and server secrets in the target environment.
- Apply database migrations and create the storage bucket before testing publishing.
- Build and deploy the full server application. A static-assets-only deployment cannot run the analysis and music server functions.
- The Vite configuration uses Lovable's bundled TanStack/Nitro setup, with Cloudflare noted as its default build target. Other hosts require compatible server/runtime configuration.
- Do not add duplicate React, TanStack, Tailwind, or Nitro plugins; the shared configuration already supplies them.
- Preserve published Git history. See `AGENTS.md` before modifying the connected repository.

See `roadmap.md` for tracked deployment and product work.

## Current limitations

- **Lyric timing is approximate.** Lines are distributed evenly across planned section durations; there is no audio transcription or forced alignment.
- **Song length is a target.** The UI requests approximately 45, 90, or 150 seconds. The normalizer limits section count and scales long plans toward a three-minute cap; it does not guarantee the rendered audio's exact duration.
- **Drafts are temporary.** Refreshing, navigating away, or signing in can discard an unpublished song.
- **Generation runs within the request.** There is no background job queue, resumable generation, or application-level generation quota/rate limiter in the reviewed code.
- **Web research is best effort.** Missing Nimble credentials or failed searches return no findings. The UI's web-search indicator reflects key configuration, not proof that searches succeeded.
- **Publishing is not transactional.** Uploads happen before the database insert, with no automatic cleanup if a later step fails.
- **The directory loads the latest 60 published songs.** Pagination is not implemented.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| “AI is not configured” | `LOVABLE_API_KEY` is present in the server process |
| “ElevenLabs is not connected” | `ELEVENLABS_API_KEY` is present and the account has Music access |
| Missing Supabase environment variables | Public build variables and server variables point to the same configured project |
| No web inspiration | Nimble is configured and returned usable results; the core photo flow still works without it |
| Publish fails | User session, private `songs` bucket, upload limits, migrations, and RLS policies |
| Sign-in or password-reset link returns incorrectly | Supabase site URL and redirect allowlist |
| Published media stops playing after a long session | Reload to obtain fresh signed URLs |
| Provider rejects a model or returns a credit/rate error | Gateway model access, available credits, or provider limits |
| Lyrics drift from the vocals | Expected limitation of estimated section-based timing |

## License

No license file is present in the reviewed repository. Confirm usage and redistribution terms with the maintainers.

---

Documentation based on the source tree `89e495f2ccf641054a3d59315e4a623368b7a95c` reviewed on October 11, 2026. Setup and behavior were checked against source code; a live generation or publishing run was not performed for this documentation review.

