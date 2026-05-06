"use client";

interface UploadProgressProps {
  uploaded: number;         // current guest's uploads (drives sprocket-hole fill & limit)
  max: number;              // per-guest max
  totalEvent?: number;      // all images in the event (gallery total)
}

export default function UploadProgress({ uploaded, max, totalEvent }: UploadProgressProps) {
  const pct   = max > 0 ? Math.round((uploaded / max) * 100) : 0;
  const full  = uploaded >= max;
  const holes = Math.min(max, 20);
  const totaleimage = uploaded + totalEvent!;

  return (
    <div className="my-6">
      {/* Film strip track */}
      <div
        className="rounded-[3px] overflow-hidden border border-[var(--film-gold-20)]"
        style={{ background: "var(--film-surface-deep)" }}
      >
        {/* Top sprocket holes */}
        <div
          className="flex gap-1 px-2 py-1 overflow-hidden"
          style={{ background: "var(--film-track-bg)" }}
        >
          {Array.from({ length: holes }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-1.5 rounded-[1px] flex-shrink-0 transition-all duration-300"
              style={
                i < uploaded
                  ? { background: "var(--film-hole-filled-bg)", border: "1px solid var(--film-hole-filled-border)", boxShadow: "0 0 4px rgba(210,160,80,0.3)" }
                  : { background: "var(--film-hole-empty-bg)", border: "1px solid var(--film-hole-empty-border)" }
              }
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="relative h-7" style={{ background: "var(--film-bar-bg)" }}>
          <div
            className="absolute top-0 left-0 bottom-0 film-bar-fill"
            style={{ width: `${pct}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center gap-1 font-courier text-[0.75rem] tracking-[0.08em]">
            <span className="font-bold text-[var(--film-text-count)]">{totaleimage}</span>
            <span className="text-[var(--film-gold-45)]">/</span>
            <span className="text-[var(--film-text-meta)]">{max}</span>
            {full && (
              <span className="ml-2 px-2 py-[1px] rounded-[2px] border border-[var(--film-gold-45)] text-[0.6rem] tracking-[0.1em] uppercase text-[var(--film-gold-60)]">
                Roll full
              </span>
            )}
          </div>
        </div>

        {/* Bottom sprocket holes */}
        <div
          className="flex gap-1 px-2 py-1 overflow-hidden"
          style={{ background: "var(--film-track-bg)" }}
        >
          {Array.from({ length: holes }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-1.5 rounded-[1px] flex-shrink-0 transition-all duration-300"
              style={
                i < uploaded
                  ? { background: "var(--film-hole-filled-bg)", border: "1px solid var(--film-hole-filled-border)", boxShadow: "0 0 4px rgba(210,160,80,0.3)" }
                  : { background: "var(--film-hole-empty-bg)", border: "1px solid var(--film-hole-empty-border)" }
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}