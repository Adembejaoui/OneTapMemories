import Link from "next/link";

interface Props {
  reason: "not_found" | "used" | "expired";
}

const MESSAGES = {
  not_found: {
    title:       "Link not found",
    description: "This event creation link is invalid or doesn't exist.",
    eyebrow:     "404 · Not found",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke="rgba(240,140,100,0.6)" strokeWidth="1.5" />
        <line x1="13" y1="13" x2="27" y2="27" stroke="rgba(240,140,100,0.8)" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="27" y1="13" x2="13" y2="27" stroke="rgba(240,140,100,0.8)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  used: {
    title:       "Roll already used",
    description: "An event has already been created with this link. Each link can only be used once.",
    eyebrow:     "Link · Already used",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke="rgba(240,140,100,0.6)" strokeWidth="1.5" />
        <path d="M13 20h10M13 14h14M13 26h8" stroke="rgba(240,140,100,0.8)" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="28" cy="26" r="4" fill="rgba(240,140,100,0.15)" stroke="rgba(240,140,100,0.7)" strokeWidth="1.3" />
        <line x1="26.5" y1="24.5" x2="29.5" y2="27.5" stroke="rgba(240,140,100,0.8)" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  expired: {
    title:       "Link has expired",
    description: "Event creation links are valid for 24 hours. Please request a new one.",
    eyebrow:     "Token · Expired",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke="rgba(240,140,100,0.6)" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="8" stroke="rgba(240,140,100,0.5)" strokeWidth="1.2" />
        <line x1="20" y1="12" x2="20" y2="20" stroke="rgba(240,140,100,0.9)" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="20" y1="20" x2="25" y2="23" stroke="rgba(240,140,100,0.9)" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M30 8 L32 6 M30 32 L32 34" stroke="rgba(240,140,100,0.35)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
} as const;

export default function TokenErrorPage({ reason }: Props) {
  const msg = MESSAGES[reason];

  return (
    <main
      className="relative min-h-screen flex items-center justify-center px-6 py-16 film-page-grain film-page-vignette"
      style={{ background: "var(--film-bg)", color: "var(--film-text-primary)" }}
    >
      {/* Film strip edges */}
      {(["left", "right"] as const).map((side) => (
        <div
          key={side}
          aria-hidden
          className={[
            "fixed top-0 bottom-0 z-10 w-[22px] flex flex-col items-center justify-around py-3",
            side === "left" ? "left-0 border-r" : "right-0 border-l",
            "border-[var(--film-gold-10)]",
          ].join(" ")}
          style={{ background: "#050402" }}
        >
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="w-[9px] h-[7px] rounded-[1px] flex-shrink-0"
              style={{ background: "#1a120a", border: "1px solid rgba(210,160,80,0.12)" }}
            />
          ))}
        </div>
      ))}

      <div className="relative z-10 w-full max-w-sm text-center">

        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <span className="flex-1 max-w-[50px] h-px bg-[var(--film-gold-20)]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--film-gold-35)]" />
          <span className="font-courier text-[0.65rem] tracking-[0.2em] uppercase text-[var(--film-gold-35)]">
            {msg.eyebrow}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--film-gold-35)]" />
          <span className="flex-1 max-w-[50px] h-px bg-[var(--film-gold-20)]" />
        </div>

        {/* Card */}
        <div
          className="relative rounded-[4px] border border-[var(--film-gold-15)] px-8 py-10 overflow-hidden"
          style={{ background: "var(--film-surface)" }}
        >
          {/* Corner brackets */}
          <span aria-hidden className="absolute top-[10px] left-[10px] w-4 h-4 border-t-[1.5px] border-l-[1.5px] border-[var(--film-gold-35)]" />
          <span aria-hidden className="absolute top-[10px] right-[10px] w-4 h-4 border-t-[1.5px] border-r-[1.5px] border-[var(--film-gold-35)]" />
          <span aria-hidden className="absolute bottom-[10px] left-[10px] w-4 h-4 border-b-[1.5px] border-l-[1.5px] border-[var(--film-gold-35)]" />
          <span aria-hidden className="absolute bottom-[10px] right-[10px] w-4 h-4 border-b-[1.5px] border-r-[1.5px] border-[var(--film-gold-35)]" />

          {/* Damaged-film scan lines decoration */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(210,160,80,1) 3px, rgba(210,160,80,1) 4px)",
            }}
          />

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "rgba(240,100,60,0.06)", border: "1px solid rgba(240,140,100,0.2)" }}
            >
              {msg.icon}
            </div>
          </div>

          {/* Title */}
          <h1 className="font-playfair text-[1.6rem] font-semibold leading-tight tracking-[-0.01em] mb-3 text-[var(--film-text-primary)]">
            {msg.title}
          </h1>

          {/* Description */}
          <p className="font-courier text-[0.75rem] tracking-[0.03em] leading-relaxed text-[var(--film-text-muted)] mb-8">
            {msg.description}
          </p>

          {/* Divider */}
          <div
            aria-hidden
            className="h-px mb-7 mx-4"
            style={{ background: "linear-gradient(90deg, transparent, var(--film-gold-20), transparent)" }}
          />

          {/* CTA */}
          <Link
            href="/"
            className={[
              "flex items-center justify-center gap-2 w-full",
              "py-3 px-6 rounded-[3px]",
              "font-courier text-[0.75rem] tracking-[0.12em] uppercase",
              "border border-[var(--film-gold-35)] text-[var(--film-text-label)] bg-transparent",
              "hover:bg-[var(--film-gold-10)] hover:border-[var(--film-gold)]",
              "transition-all duration-200 no-underline",
            ].join(" ")}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="flex-shrink-0">
              <path d="M8 2L4 6.5 8 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to home
          </Link>
        </div>

        {/* Footer hint */}
        <p className="font-courier text-[0.6rem] tracking-[0.06em] text-[var(--film-text-muted)] mt-5 opacity-60">
          If you believe this is a mistake, contact the event organiser.
        </p>
      </div>
    </main>
  );
}