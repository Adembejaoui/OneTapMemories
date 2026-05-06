import Link from "next/link";

const LINKS = {
  Product: [
    { label: "Features",  href: "#features"  },
    { label: "Carousel",  href: "#carousel"  },
  ],
  Company: [
    { label: "Contact", href: "#contact" },
  ],
};

export default function MarketingFooter() {
  return (
    <footer
      className="relative pt-16 pb-8 px-6 overflow-hidden"
      style={{ background: "var(--film-bg)", borderTop: "1px solid var(--film-gold-10)" }}
    >
      {/* Film strip top */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-[14px] flex gap-1.5 items-center px-4 overflow-hidden opacity-25"
        style={{ background: "var(--film-track-bg)" }}
      >
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="w-[10px] h-[8px] flex-shrink-0 rounded-[1px]"
            style={{ background: "#1a120a", border: "1px solid rgba(210,160,80,0.2)" }} />
        ))}
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Top row: brand + links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-14 mt-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                <rect x="6" y="4" width="16" height="20" rx="2" stroke="var(--film-gold)" strokeWidth="1.4" />
                <rect x="10" y="2" width="8" height="4" rx="1" stroke="var(--film-gold)" strokeWidth="1.2" />
                <rect x="10" y="22" width="8" height="4" rx="1" stroke="var(--film-gold)" strokeWidth="1.2" />
                <circle cx="14" cy="14" r="3.5" stroke="var(--film-gold)" strokeWidth="1.2" />
              </svg>
              <span className="font-playfair text-[1rem] font-semibold text-[var(--film-text-primary)]">
                OneTapMemories
              </span>
            </div>
            <p className="font-courier text-[0.7rem] tracking-[0.03em] leading-relaxed text-[var(--film-text-muted)] max-w-[180px]">
              Collective photo memories for every event.
            </p>
            {/* Social */}
            <div className="flex gap-2.5 mt-5">
              {[
                { label: "Twitter/X", path: "M4 4l16 16M4 20L20 4" },
                { label: "Instagram", path: "M12 2a10 10 0 100 20A10 10 0 0012 2zm0 0" },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="w-8 h-8 rounded-[3px] flex items-center justify-center border border-[var(--film-gold-15)] text-[var(--film-gold-45)] hover:text-[var(--film-gold)] hover:border-[var(--film-gold-35)] transition-all duration-150 no-underline"
                  style={{ background: "var(--film-surface)" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d={social.path} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group}>
              <h4 className="font-courier text-[0.62rem] tracking-[0.2em] uppercase text-[var(--film-gold-45)] mb-4 m-0">
                {group}
              </h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="font-courier text-[0.72rem] tracking-[0.04em] text-[var(--film-text-muted)] hover:text-[var(--film-text-label)] transition-colors duration-150 no-underline"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px mb-6" style={{ background: "var(--film-gold-10)" }} />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-courier text-[0.62rem] tracking-[0.06em] text-[var(--film-text-muted)] m-0">
            © {new Date().getFullYear()} OneTapMemories. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            {/* Film hole decoration */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[7px] h-[5px] rounded-[1px]"
                style={{ background: "var(--film-gold-10)", border: "1px solid var(--film-gold-15)" }} />
            ))}
            <span className="font-courier text-[0.58rem] tracking-[0.1em] text-[var(--film-gold-35)] ml-1">
              Developed with care
            </span>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[7px] h-[5px] rounded-[1px]"
                style={{ background: "var(--film-gold-10)", border: "1px solid var(--film-gold-15)" }} />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
