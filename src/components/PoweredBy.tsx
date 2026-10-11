export function PoweredBy() {
  return (
    <footer className="mx-auto mt-16 flex max-w-5xl flex-col items-center gap-3 px-6 pb-10">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Powered by</p>
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        {/* Nimble */}
        <a href="https://www.nimbleway.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground transition hover:text-foreground" aria-label="Nimble">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M18 6l-2.5 2.5M6 18l2.5-2.5M18 18l-2.5-2.5" />
          </svg>
          <span className="font-semibold">Nimble</span>
        </a>
        {/* Gemini */}
        <a href="https://gemini.google.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground transition hover:text-foreground" aria-label="Gemini">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <defs>
              <linearGradient id="gemini-grad" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#4285F4" />
                <stop offset="45%" stopColor="#9B72CB" />
                <stop offset="100%" stopColor="#D96570" />
              </linearGradient>
            </defs>
            <path
              d="M12 1.5c.6 4.8 2.6 7.4 5.7 8.3 1.9.5 3.5.6 4.8.7-4.9.9-7.9 3-8.9 7.9-.2 1.1-.3 2.4-.3 4.1-.9-4.9-3-7.9-7.9-8.9-1.1-.2-2.4-.3-4.1-.3 4.9-.9 7.9-3 8.9-7.9.2-1.1.3-2.4.3-3.9z"
              fill="url(#gemini-grad)"
            />
          </svg>
          <span className="font-semibold">Gemini</span>
        </a>
        {/* Snowflake */}
        <a href="https://www.snowflake.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground transition hover:text-foreground" aria-label="Snowflake">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
            <path d="M12 1.6c.4 0 .7.3.7.7v2.4l1.9-1.1a.7.7 0 1 1 .7 1.2l-2.6 1.5v3.2l2.8-1.6-.0-3.1a.7.7 0 1 1 1.4 0v2.3l2.1-1.2a.7.7 0 1 1 .7 1.2l-2.1 1.2 1.9 1.1a.7.7 0 0 1-.7 1.2l-2.6-1.5-2.8 1.6 2.8 1.6 2.6-1.5a.7.7 0 0 1 .7 1.2l-1.9 1.1 2.1 1.2a.7.7 0 1 1-.7 1.2l-2.1-1.2v2.3a.7.7 0 1 1-1.4 0v-3.1l-2.8-1.6v3.2l2.6 1.5a.7.7 0 1 1-.7 1.2l-1.9-1.1v2.4a.7.7 0 1 1-1.4 0v-2.4l-1.9 1.1a.7.7 0 1 1-.7-1.2l2.6-1.5v-3.2l-2.8 1.6v3.1a.7.7 0 1 1-1.4 0v-2.3l-2.1 1.2a.7.7 0 1 1-.7-1.2l2.1-1.2-1.9-1.1a.7.7 0 1 1 .7-1.2l2.6 1.5 2.8-1.6-2.8-1.6-2.6 1.5a.7.7 0 1 1-.7-1.2l1.9-1.1-2.1-1.2a.7.7 0 1 1 .7-1.2l2.1 1.2V5.4a.7.7 0 1 1 1.4 0v3.1l2.8 1.6V6.9l-2.6-1.5a.7.7 0 1 1 .7-1.2l1.9 1.1V2.3c0-.4.3-.7.7-.7z" />
          </svg>
          <span className="font-semibold">Snowflake</span>
        </a>
      </div>
    </footer>
  );
}
