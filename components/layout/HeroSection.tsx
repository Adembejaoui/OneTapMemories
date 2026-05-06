"use client";

import { useEffect, useRef } from "react";

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.3"/>
        <circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth="1.3"/>
        {[0,60,120,180,240,300].map((a) => (
          <circle key={a} cx="11" cy="11" r="9"
            stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4"
            strokeDasharray="2.4 3.6" transform={`rotate(${a} 11 11)`}/>
        ))}
      </svg>
    ),
    title: "Shared rolls",
    desc: "Every guest shoots on the same roll — one link, everyone contributes.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
        <circle cx="11" cy="11" r="3" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M7 5V3M15 5V3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    title: "Instant gallery",
    desc: "Photos appear in the shared gallery the moment they're uploaded.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 17L8 13l3 3 4-5 3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="2" y="2" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    ),
    title: "No app needed",
    desc: "Guests open a link and upload directly — zero installs, zero friction.",
  },
];

export default function HeroSection() {
  const filmRef = useRef<HTMLDivElement>(null);

  /* Parallax scroll on film strip bg */
  useEffect(() => {
    const handler = () => {
      if (filmRef.current)
        filmRef.current.style.transform = `translateY(${window.scrollY * 0.18}px)`;
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <section
      id="features"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-28 pb-24 px-6"
      style={{ background: "var(--film-bg)" }}
    >
      {/* ── Background film strips ── */}
      <div ref={filmRef} aria-hidden className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Diagonal film strip 1 */}
        <div
          className="absolute -left-16 top-1/4 w-[520px] h-[90px] opacity-[0.06]"
          style={{
            background: "repeating-linear-gradient(90deg, transparent 0px, transparent 18px, rgba(210,160,80,0.9) 18px, rgba(210,160,80,0.9) 20px)",
            transform: "rotate(-14deg)",
          }}
        />
        {/* Diagonal film strip 2 */}
        <div
          className="absolute -right-16 bottom-1/3 w-[460px] h-[70px] opacity-[0.05]"
          style={{
            background: "repeating-linear-gradient(90deg, transparent 0px, transparent 18px, rgba(210,160,80,0.9) 18px, rgba(210,160,80,0.9) 20px)",
            transform: "rotate(10deg)",
          }}
        />
        {/* Radial glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, rgba(210,160,80,1) 0%, transparent 70%)" }}
        />
      </div>

      {/* ── Film strip edges ── */}
      {["left","right"].map((side) => (
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
          {Array.from({ length: 26 }).map((_, i) => (
            <div key={i} className="w-[9px] h-[7px] rounded-[1px] flex-shrink-0"
              style={{ background: "#1a120a", border: "1px solid rgba(210,160,80,0.12)" }} />
          ))}
        </div>
      ))}

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-2.5 mb-7">
          <span className="flex-1 max-w-[80px] h-px bg-[var(--film-gold-20)]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--film-gold-60)]" />
          <span className="font-courier text-[0.68rem] tracking-[0.22em] uppercase text-[var(--film-gold-60)]">
            Collective memory
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--film-gold-60)]" />
          <span className="flex-1 max-w-[80px] h-px bg-[var(--film-gold-20)]" />
        </div>

        {/* Headline */}
        <h1 className="font-playfair text-[clamp(2.8rem,7vw,5.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] mb-6 text-[var(--film-text-primary)]">
          Every guest,{" "}
          <span className="italic" style={{ color: "var(--film-gold)" }}>
            one roll.
          </span>
        </h1>

        <p className="font-playfair italic text-[clamp(1rem,2.2vw,1.3rem)] text-[var(--film-text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
          Create a shared photo event, send a single link, and watch your guests
          fill a collective gallery — no accounts, no apps, no friction.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-20">
          <a
            href="#contact"
            className={[
              "font-courier text-[0.78rem] tracking-[0.14em] uppercase",
              "px-8 py-3.5 rounded-[3px]",
              "text-[var(--film-bg)] font-bold",
              "transition-all duration-200 no-underline",
              "hover:opacity-90 hover:scale-[1.02] active:scale-[0.99]",
            ].join(" ")}
            style={{ background: "var(--film-gold)" }}
          >
            Create your event
          </a>
          <a
            href="#carousel"
            className={[
              "font-courier text-[0.78rem] tracking-[0.14em] uppercase",
              "px-8 py-3.5 rounded-[3px]",
              "border border-[var(--film-gold-35)] text-[var(--film-text-label)] bg-transparent",
              "hover:border-[var(--film-gold)] hover:bg-[var(--film-gold-05)]",
              "transition-all duration-200 no-underline",
            ].join(" ")}
          >
            See examples
          </a>
        </div>

        {/* Feature cards */}
        <div id="features" className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-[3px] p-5 border border-[var(--film-gold-10)] hover:border-[var(--film-gold-20)] transition-colors duration-200"
              style={{ background: "var(--film-surface)" }}
            >
              <div className="text-[var(--film-gold-60)] mb-3">{f.icon}</div>
              <h3 className="font-playfair text-[1rem] font-semibold mb-1.5 text-[var(--film-text-label)]">
                {f.title}
              </h3>
              <p className="font-courier text-[0.72rem] tracking-[0.03em] leading-relaxed text-[var(--film-text-muted)]">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
