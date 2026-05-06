"use client";

import { useEffect, useRef, useState } from "react";

/* Replace these with real sample event images */
const SLIDES = [
  {
    id: 1,
    bg: "linear-gradient(135deg, #2a1a06 0%, #5c3a12 50%, #3a2008 100%)",
    label: "Sarah & James · Wedding",
    frames: "142 frames",
    tint: "sepia(0.4) contrast(1.1)",
  },
  {
    id: 2,
    bg: "linear-gradient(135deg, #0c1a20 0%, #1d3a40 50%, #0a2230 100%)",
    label: "Tech Summit 2024",
    frames: "89 frames",
    tint: "sepia(0.1) contrast(1.15) hue-rotate(180deg)",
  },
  {
    id: 3,
    bg: "linear-gradient(135deg, #1a0c20 0%, #3d1a50 50%, #200830 100%)",
    label: "Camille's 30th",
    frames: "211 frames",
    tint: "sepia(0.2) contrast(1.1) hue-rotate(270deg)",
  },
  {
    id: 4,
    bg: "linear-gradient(135deg, #0c1a0c 0%, #1a3a1a 50%, #0a200a 100%)",
    label: "Rooftop Garden Party",
    frames: "67 frames",
    tint: "sepia(0.15) contrast(1.1) hue-rotate(90deg)",
  },
  {
    id: 5,
    bg: "linear-gradient(135deg, #201006 0%, #4a2510 50%, #301808 100%)",
    label: "Studio Showcase",
    frames: "158 frames",
    tint: "sepia(0.3) contrast(1.1)",
  },
];

export default function CarouselSection() {
  const [active,   setActive]   = useState(0);
  const [paused,   setPaused]   = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStart                = useRef(0);
  const trackRef                 = useRef<HTMLDivElement>(null);

  /* Auto-advance */
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((p) => (p + 1) % SLIDES.length), 4000);
    return () => clearInterval(id);
  }, [paused]);

  const go = (idx: number) => setActive((idx + SLIDES.length) % SLIDES.length);

  /* Swipe / drag */
  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = e.clientX;
    setDragging(false);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const delta = e.clientX - dragStart.current;
    if (Math.abs(delta) > 40) go(active + (delta < 0 ? 1 : -1));
  };

  return (
    <section
      id="carousel"
      className="relative py-24 px-6 overflow-hidden"
      style={{ background: "var(--film-surface-deep)" }}
    >
      {/* Section header */}
      <div className="max-w-5xl mx-auto mb-12 text-center">
        <div className="flex items-center justify-center gap-2.5 mb-5">
          <span className="flex-1 max-w-[60px] h-px bg-[var(--film-gold-20)]" />
          <span className="font-courier text-[0.68rem] tracking-[0.22em] uppercase text-[var(--film-gold-45)]">
            From the darkroom
          </span>
          <span className="flex-1 max-w-[60px] h-px bg-[var(--film-gold-20)]" />
        </div>
        <h2 className="font-playfair text-[clamp(1.8rem,4vw,2.8rem)] font-semibold leading-tight text-[var(--film-text-primary)] mb-3">
          Real events, real memories
        </h2>
        <p className="font-playfair italic text-[var(--film-text-muted)] text-[0.95rem]">
          Every frame captured by the people who were there.
        </p>
      </div>

      {/* Carousel track */}
      <div
        ref={trackRef}
        className="relative max-w-4xl mx-auto select-none cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Main slide */}
        <div
          className="relative overflow-hidden rounded-[4px] border border-[var(--film-gold-15)]"
          style={{
            boxShadow: "0 12px 48px rgba(0,0,0,0.7)",
            height: "clamp(240px, 45vw, 480px)",
          }}
        >
          {SLIDES.map((slide, i) => (
            <div
              key={slide.id}
              className="absolute inset-0 transition-opacity duration-700"
              style={{
                opacity: i === active ? 1 : 0,
                pointerEvents: i === active ? "auto" : "none",
              }}
            >
              {/* Simulated photo content — replace with real <img> */}
              <div className="absolute inset-0" style={{ background: slide.bg, filter: slide.tint }} />

              {/* Simulated polaroid grid overlay */}
              <div className="absolute inset-4 grid grid-cols-4 gap-2 opacity-20">
                {Array.from({ length: 12 }).map((_, j) => (
                  <div
                    key={j}
                    className="rounded-[2px] border border-[var(--film-gold-20)]"
                    style={{ background: "rgba(210,160,80,0.08)" }}
                  />
                ))}
              </div>

              {/* Grain */}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-50"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.1'/%3E%3C/svg%3E")`,
                  backgroundSize: "180px",
                }}
              />

              {/* Caption bar */}
              <div
                className="absolute bottom-0 left-0 right-0 px-5 py-4 flex items-end justify-between"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)" }}
              >
                <div>
                  <p className="font-playfair text-[1rem] font-semibold text-[var(--film-text-primary)] m-0 leading-tight">
                    {slide.label}
                  </p>
                  <p className="font-courier text-[0.65rem] tracking-[0.1em] text-[var(--film-gold-60)] m-0 mt-0.5">
                    {slide.frames}
                  </p>
                </div>
                {/* Frame counter */}
                <span className="font-courier text-[0.6rem] tracking-[0.12em] text-[var(--film-gold-45)]">
                  {String(i + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
                </span>
              </div>

              {/* Film frame top sprockets */}
              <div
                aria-hidden
                className="absolute top-0 left-0 right-0 h-[14px] flex gap-1 items-center px-2 overflow-hidden opacity-30"
                style={{ background: "rgba(0,0,0,0.5)" }}
              >
                {Array.from({ length: 30 }).map((_, j) => (
                  <div key={j} className="w-[10px] h-[8px] flex-shrink-0 rounded-[1px]"
                    style={{ background: "#1a120a", border: "1px solid rgba(210,160,80,0.3)" }} />
                ))}
              </div>
            </div>
          ))}

          {/* Prev / Next buttons */}
          {(["prev","next"] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => go(active + (dir === "next" ? 1 : -1))}
              className={[
                "absolute top-1/2 -translate-y-1/2 z-10",
                "w-9 h-9 rounded-[3px] flex items-center justify-center",
                "border border-[var(--film-gold-20)] bg-[rgba(12,9,6,0.6)] backdrop-blur-sm",
                "text-[var(--film-gold-45)] hover:text-[var(--film-gold)] hover:border-[var(--film-gold-45)]",
                "transition-all duration-150 cursor-pointer",
                dir === "prev" ? "left-3" : "right-3",
              ].join(" ")}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                {dir === "prev"
                  ? <path d="M10 3L6 8l4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  : <path d="M6 3l4 5-4 5"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                }
              </svg>
            </button>
          ))}
        </div>

        {/* Dot / thumbnail nav */}
        <div className="flex items-center justify-center gap-3 mt-6">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => { setPaused(true); go(i); }}
              className={[
                "transition-all duration-300 rounded-[2px] border cursor-pointer bg-transparent",
                i === active
                  ? "w-8 h-[6px] border-[var(--film-gold)]"
                  : "w-[6px] h-[6px] border-[var(--film-gold-20)] hover:border-[var(--film-gold-35)]",
              ].join(" ")}
              style={{ background: i === active ? "var(--film-gold-45)" : "var(--film-gold-10)" }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
