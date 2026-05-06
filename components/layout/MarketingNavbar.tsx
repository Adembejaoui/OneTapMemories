"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Carousel",  href: "#carousel"  },
  { label: "FAQ",       href: "#faq"       },
  { label: "Contact",   href: "#contact"   },
];

export default function MarketingNavbar() {
  const [scrolled,     setScrolled]     = useState(false);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [activeHash,   setActiveHash]   = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* track active section */
  useEffect(() => {
    const sections = NAV_LINKS.map((l) => l.href.replace("#", ""));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveHash(`#${e.target.id}`);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <nav
        className={[
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
          scrolled
            ? "py-3 backdrop-blur-md border-b border-[var(--film-gold-10)]"
            : "py-5",
        ].join(" ")}
        style={{ background: scrolled ? "rgba(12,9,6,0.88)" : "transparent" }}
      >
        {/* Film strip sprockets top */}
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-[6px] flex gap-1.5 items-center px-4 overflow-hidden opacity-40"
          style={{ background: "var(--film-track-bg)" }}
        >
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="w-[8px] h-[4px] flex-shrink-0 rounded-[1px]"
              style={{ background: "var(--film-gold-35)", border: "none" }}
            />
          ))}
        </div>

        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group no-underline">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="flex-shrink-0">
              <rect x="6" y="4" width="16" height="20" rx="2" stroke="var(--film-gold)" strokeWidth="1.4" />
              <rect x="10" y="2" width="8" height="4" rx="1" stroke="var(--film-gold)" strokeWidth="1.2" />
              <rect x="10" y="22" width="8" height="4" rx="1" stroke="var(--film-gold)" strokeWidth="1.2" />
              <circle cx="14" cy="14" r="3.5" stroke="var(--film-gold)" strokeWidth="1.2" />
              <line x1="6"  y1="9"  x2="3"  y2="9"  stroke="var(--film-gold)" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="6"  y1="14" x2="3"  y2="14" stroke="var(--film-gold)" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="6"  y1="19" x2="3"  y2="19" stroke="var(--film-gold)" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="22" y1="9"  x2="25" y2="9"  stroke="var(--film-gold)" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="22" y1="14" x2="25" y2="14" stroke="var(--film-gold)" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="22" y1="19" x2="25" y2="19" stroke="var(--film-gold)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span className="font-playfair text-[1.15rem] font-semibold tracking-tight text-[var(--film-text-primary)] group-hover:text-[var(--film-gold)] transition-colors duration-200">
              OneTapMemories
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={[
                  "font-courier text-[0.72rem] tracking-[0.14em] uppercase px-4 py-2 rounded-[3px]",
                  "transition-all duration-150 no-underline",
                  activeHash === link.href
                    ? "text-[var(--film-gold)] bg-[var(--film-gold-05)]"
                    : "text-[var(--film-text-muted)] hover:text-[var(--film-text-label)] hover:bg-[var(--film-gold-05)]",
                ].join(" ")}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="#contact"
              className={[
                "font-courier text-[0.72rem] tracking-[0.12em] uppercase",
                "px-5 py-2 rounded-[3px] border border-[var(--film-gold-45)]",
                "text-[var(--film-text-label)] bg-transparent",
                "hover:bg-[var(--film-gold-10)] hover:border-[var(--film-gold)]",
                "transition-all duration-200 no-underline",
              ].join(" ")}
            >
              Get started
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden flex flex-col gap-1.5 p-2 bg-transparent border-none cursor-pointer"
            aria-label="Toggle menu"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="block h-px w-5 transition-all duration-200"
                style={{ background: "var(--film-gold-60)" }}
              />
            ))}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 flex flex-col pt-20 px-6 pb-8 md:hidden"
          style={{ background: "rgba(12,9,6,0.97)" }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="font-courier text-[0.85rem] tracking-[0.15em] uppercase py-4 border-b border-[var(--film-gold-10)] text-[var(--film-text-muted)] hover:text-[var(--film-gold)] transition-colors duration-150 no-underline"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={() => setMenuOpen(false)}
            className="mt-8 text-center font-courier text-[0.8rem] tracking-[0.12em] uppercase px-5 py-3 rounded-[3px] border border-[var(--film-gold-45)] text-[var(--film-text-label)] no-underline"
          >
            Get started
          </a>
        </div>
      )}
    </>
  );
}
