import aiEngineerAsset from "@/assets/ai-engineer-ny.png.asset.json";
import mlhAsset from "@/assets/mlh.png.asset.json";

export function PoweredBy() {
  return (
    <footer className="mx-auto mt-16 flex max-w-5xl flex-col items-center gap-3 px-6 pb-10">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Powered by</p>
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        {/* Nimble — official logo from nimbleway.com */}
        <a href="https://www.nimbleway.com" target="_blank" rel="noreferrer" className="flex items-center text-muted-foreground transition hover:text-foreground" aria-label="Nimble">
          <svg viewBox="0 0 199 28" className="h-4 w-auto" fill="none" aria-hidden="true">
            <path d="M62.0067 19.4314L59.8849 19.9458V2.42578H67.463V25.1201H57.672L46.3957 7.63036L48.5176 7.11595V25.1201H40.9395V2.42578H51.0336L62.0067 19.4314Z" fill="currentColor"/>
            <path d="M72.0135 2.42578H79.8341V25.1201H72.0135V2.42578Z" fill="currentColor"/>
            <path d="M119.39 2.42578V25.1201H111.963V5.36092L113.388 5.54247L105.749 25.1201H98.0196L90.3808 5.63325L91.8055 5.42144V25.1201H84.3789V2.42578H96.4736L103.264 20.9141H100.566L107.295 2.42578H119.39Z" fill="currentColor"/>
            <path d="M140.439 14.1058L141.045 12.7139C142.763 12.7744 144.198 13.0467 145.349 13.5309C146.501 14.015 147.36 14.6908 147.926 15.5583C148.512 16.4055 148.805 17.4242 148.805 18.6144C148.805 19.845 148.522 20.9545 147.956 21.9429C147.411 22.9314 146.572 23.7081 145.44 24.2729C144.309 24.8377 142.894 25.1201 141.197 25.1201H123.342L125.07 13.4704L123.342 2.42578H140.56C142.662 2.42578 144.309 2.92001 145.501 3.90848C146.693 4.87677 147.289 6.22835 147.289 7.96321C147.289 8.95167 147.067 9.87962 146.623 10.747C146.178 11.6145 145.45 12.3508 144.44 12.956C143.45 13.541 142.116 13.9243 140.439 14.1058ZM130.981 23.4256L128.011 19.9458H138.711C139.378 19.9458 139.903 19.7744 140.287 19.4314C140.671 19.0683 140.863 18.5842 140.863 17.979C140.863 17.4343 140.671 16.9703 140.287 16.5871C139.923 16.2038 139.378 16.0121 138.65 16.0121H129.678V10.9286H137.498C138.024 10.9286 138.458 10.7672 138.802 10.4445C139.166 10.1217 139.348 9.70815 139.348 9.20383C139.348 8.73986 139.186 8.35658 138.863 8.05398C138.539 7.75139 138.085 7.6001 137.498 7.6001H128.041L130.981 4.1203L132.527 13.4704L130.981 23.4256Z" fill="currentColor"/>
            <path d="M160.179 2.42578V21.6706L156.663 18.1605H173.577V25.1201H152.359V2.42578H160.179Z" fill="currentColor"/>
            <path d="M197.229 11.0799V16.466H180.102V11.0799H197.229ZM185.468 13.773L184.073 22.2153L181.102 18.9473H198.35V25.1201H176.343L178.011 13.773L176.343 2.42578H198.199V8.59865H181.102L184.073 5.33066L185.468 13.773Z" fill="currentColor"/>
            <path d="M32.084 10.7803V27.0518L13.7217 13.0049V27.0547L0 16.2539V0L18.3672 14.1084V0L32.084 10.7803ZM1.97656 10.1045L6.87598 13.8232V19.2715L11.7754 22.9551V17.3223L6.95508 13.7832V8.10547L1.97656 4.41797V10.1045ZM20.3086 10.1045L25.209 13.8242V19.2715L30.1084 22.9551V17.3223L25.2871 13.7822V8.10547L20.3086 4.41797V10.1045Z" fill="currentColor"/>
          </svg>
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
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M12 2l-2 2.2M12 2l2 2.2M12 22l-2-2.2M12 22l2-2.2M3.3 7l2.9.4M3.3 7l.4 2.9M20.7 17l-2.9-.4M20.7 17l-.4-2.9M3.3 17l2.9-.4M3.3 17l.4-2.9M20.7 7l-2.9.4M20.7 7l-.4 2.9" />
          </svg>
          <span className="font-semibold">Snowflake</span>
        </a>
      </div>

      {/* Thanks — event organizer marks, lifted from the event poster on luma.com */}
      <div className="mt-6 flex w-full max-w-md items-center gap-4">
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">With thanks to</p>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        <a
          href="https://luma.com/AIEngineerNYHackathon"
          target="_blank"
          rel="noreferrer"
          aria-label="AI Engineer New York"
          className="opacity-60 transition hover:opacity-100"
        >
          <img src={aiEngineerAsset.url} alt="AI Engineer New York" className="h-4 w-auto" />
        </a>
        <a
          href="https://mlh.com"
          target="_blank"
          rel="noreferrer"
          aria-label="Major League Hacking"
          className="opacity-60 transition hover:opacity-100"
        >
          <img src={mlhAsset.url} alt="Major League Hacking" className="h-4 w-auto" />
        </a>
      </div>
    </footer>
  );
}
