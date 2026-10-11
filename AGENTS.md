<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- AI calls go through src/lib/ai.server.ts (raw streaming fetch per provider: Responses for OpenAI, chat completions for Gemini, Messages for Claude) — one place to swap models.
- Nimble web search is optional: skipped silently when NIMBLE_API_KEY is absent so the app still works.
- Songs use ElevenLabs Music composition plans; highlighting and lyric seeking share duration-scaled line onsets without a one-line delay, because waiting until line end makes the highlight lag. The player reads the audio clock each frame during playback; plan timing remains an estimate rather than vocal alignment.
