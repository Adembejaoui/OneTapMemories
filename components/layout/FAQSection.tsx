"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Do my guests need to create an account?",
    a: "No. Guests access a unique event link and upload directly from their browser. No sign-up, no app download, no friction — just a link.",
  },
  {
    q: "How many photos can guests upload?",
    a: "You set the limit per guest when creating the event. The default is 20 photos per person, but you can raise or lower it to fit your event.",
  },
  {
    q: "Can guests see each other's uploads?",
    a: "Yes — every upload appears instantly in the shared gallery on the same page. It becomes a living collective album as the event unfolds.",
  },
  {
    q: "What file formats and sizes are supported?",
    a: "We accept JPEG, PNG, WEBP and GIF up to 10 MB per file. Large photos are automatically optimised for fast loading in the gallery.",
  },
  {
    q: "Can I download all photos after the event?",
    a: "Absolutely. As the event organiser you can bulk-download the entire gallery as a ZIP at any time from your dashboard.",
  },
  {
    q: "How long are the photos stored?",
    a: "Photos are kept for 90 days on the free plan. Pro and Team plans offer extended storage and custom expiry settings.",
  },
  {
    q: "Is there a limit on events or guests?",
    a: "The free plan includes one active event with up to 50 guests. Paid plans unlock unlimited events, unlimited guests, and higher upload caps.",
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="relative py-24 px-6 overflow-hidden"
      style={{ background: "var(--film-bg)" }}
    >
      {/* Background texture strip */}
      <div
        aria-hidden
        className="absolute left-0 right-0 top-0 h-px opacity-40"
        style={{ background: "linear-gradient(90deg, transparent, var(--film-gold-35), transparent)" }}
      />

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-2.5 mb-5">
            <span className="flex-1 max-w-[60px] h-px bg-[var(--film-gold-20)]" />
            <span className="font-courier text-[0.68rem] tracking-[0.22em] uppercase text-[var(--film-gold-45)]">
              Questions
            </span>
            <span className="flex-1 max-w-[60px] h-px bg-[var(--film-gold-20)]" />
          </div>
          <h2 className="font-playfair text-[clamp(1.8rem,4vw,2.8rem)] font-semibold leading-tight text-[var(--film-text-primary)] mb-3">
            Frequently asked
          </h2>
          <p className="font-playfair italic text-[var(--film-text-muted)] text-[0.95rem]">
            Everything you need to know before rolling your first event.
          </p>
        </div>

        {/* Accordion */}
        <div className="flex flex-col gap-2">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={[
                  "rounded-[3px] border transition-all duration-200 overflow-hidden",
                  isOpen
                    ? "border-[var(--film-gold-35)]"
                    : "border-[var(--film-gold-10)] hover:border-[var(--film-gold-20)]",
                ].join(" ")}
                style={{ background: "var(--film-surface)" }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left bg-transparent border-none cursor-pointer group"
                >
                  <span
                    className={[
                      "font-playfair text-[0.95rem] font-medium leading-snug transition-colors duration-150",
                      isOpen ? "text-[var(--film-text-primary)]" : "text-[var(--film-text-label)] group-hover:text-[var(--film-text-primary)]",
                    ].join(" ")}
                  >
                    {faq.q}
                  </span>

                  {/* +/- icon */}
                  <span
                    className={[
                      "flex-shrink-0 ml-4 w-5 h-5 flex items-center justify-center rounded-full border transition-all duration-200",
                      isOpen
                        ? "border-[var(--film-gold-45)] text-[var(--film-gold)] rotate-45"
                        : "border-[var(--film-gold-20)] text-[var(--film-gold-45)]",
                    ].join(" ")}
                    style={{ transition: "transform 0.25s ease, border-color 0.2s ease, color 0.2s ease" }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <line x1="5" y1="1" x2="5" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>

                {/* Answer — animated height via max-height trick */}
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: isOpen ? "200px" : "0px" }}
                >
                  <p className="px-5 pb-5 font-courier text-[0.78rem] tracking-[0.03em] leading-relaxed text-[var(--film-text-muted)] m-0">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom separator */}
      <div
        aria-hidden
        className="absolute left-0 right-0 bottom-0 h-px opacity-40"
        style={{ background: "linear-gradient(90deg, transparent, var(--film-gold-35), transparent)" }}
      />
    </section>
  );
}
