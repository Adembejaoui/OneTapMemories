"use client";

import { useState } from "react";

type FormState = {
  name: string;
  email: string;
  message: string;
};

type SubmitState = "idle" | "loading" | "success" | "error";

export default function ContactSection() {
  const [form,   setForm]   = useState<FormState>({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<SubmitState>("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      // Replace with your own API route
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <section
      id="contact"
      className="relative py-24 px-6 overflow-hidden"
      style={{ background: "var(--film-surface-deep)" }}
    >
      {/* Decorative horizontal rule */}
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px opacity-30"
        style={{ background: "linear-gradient(90deg, transparent, var(--film-gold-35), transparent)" }} />

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2.5 mb-5">
            <span className="flex-1 max-w-[60px] h-px bg-[var(--film-gold-20)]" />
            <span className="font-courier text-[0.68rem] tracking-[0.22em] uppercase text-[var(--film-gold-45)]">
              Get in touch
            </span>
            <span className="flex-1 max-w-[60px] h-px bg-[var(--film-gold-20)]" />
          </div>
          <h2 className="font-playfair text-[clamp(1.8rem,4vw,2.8rem)] font-semibold leading-tight text-[var(--film-text-primary)] mb-3">
            Let&apos;s start a roll
          </h2>
          <p className="font-playfair italic text-[var(--film-text-muted)] text-[0.95rem]">
            Questions, partnerships, or custom plans — we develop everything.
          </p>
        </div>

        {/* Form card */}
        <div
          className="rounded-[4px] border border-[var(--film-gold-15)] p-8 relative overflow-hidden"
          style={{ background: "var(--film-surface)" }}
        >
          {/* Corner brackets */}
          <span aria-hidden className="absolute top-[10px] left-[10px] w-4 h-4 border-t-[1.5px] border-l-[1.5px] border-[var(--film-gold-35)]" />
          <span aria-hidden className="absolute top-[10px] right-[10px] w-4 h-4 border-t-[1.5px] border-r-[1.5px] border-[var(--film-gold-35)]" />
          <span aria-hidden className="absolute bottom-[10px] left-[10px] w-4 h-4 border-b-[1.5px] border-l-[1.5px] border-[var(--film-gold-35)]" />
          <span aria-hidden className="absolute bottom-[10px] right-[10px] w-4 h-4 border-b-[1.5px] border-r-[1.5px] border-[var(--film-gold-35)]" />

          {status === "success" ? (
            <div className="text-center py-8">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="mx-auto mb-4">
                <circle cx="22" cy="22" r="20" stroke="rgba(150,220,130,0.7)" strokeWidth="1.5" />
                <polyline points="13,22 19,28 31,16" stroke="rgba(150,220,130,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="font-playfair text-[1.1rem] text-[var(--film-text-label)] mb-1">
                Message developed
              </p>
              <p className="font-courier text-[0.72rem] tracking-[0.04em] text-[var(--film-text-muted)]">
                We&apos;ll be in touch shortly.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-5 font-courier text-[0.7rem] tracking-[0.1em] uppercase text-[var(--film-gold-45)] hover:text-[var(--film-gold)] transition-colors bg-transparent border-none cursor-pointer p-0"
              >
                Send another →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Name + Email row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FilmField
                  label="Name"
                  name="name"
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
                <FilmField
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label className="font-courier text-[0.65rem] tracking-[0.15em] uppercase text-[var(--film-gold-45)]">
                  Message
                </label>
                <textarea
                  name="message"
                  placeholder="Tell us about your event or question…"
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  required
                  className={[
                    "w-full rounded-[3px] px-4 py-3 resize-none",
                    "font-courier text-[0.8rem] tracking-[0.02em] leading-relaxed",
                    "text-[var(--film-text-label)] placeholder:text-[var(--film-text-muted)] placeholder:opacity-50",
                    "border border-[var(--film-gold-15)] bg-[var(--film-surface-deep)]",
                    "focus:outline-none focus:border-[var(--film-gold-45)]",
                    "transition-colors duration-150",
                  ].join(" ")}
                />
              </div>

              {/* Error */}
              {status === "error" && (
                <p className="font-courier text-[0.72rem] text-[var(--film-caption-error)] tracking-[0.03em]">
                  ⚠ Something went wrong — please try again.
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === "loading"}
                className={[
                  "w-full py-3.5 px-6 rounded-[3px]",
                  "font-courier text-[0.78rem] tracking-[0.14em] uppercase font-bold",
                  "transition-all duration-200 cursor-pointer border-none",
                  "flex items-center justify-center gap-2",
                  "hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100",
                ].join(" ")}
                style={{
                  background: "var(--film-gold)",
                  color:      "var(--film-bg)",
                }}
              >
                {status === "loading" ? (
                  <>
                    <span
                      className="w-3.5 h-3.5 rounded-full border-[1.5px] animate-film-spin"
                      style={{ borderColor: "rgba(12,9,6,0.3)", borderTopColor: "var(--film-bg)" }}
                    />
                    Developing…
                  </>
                ) : (
                  "Send message →"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Reusable input field ── */
function FilmField({
  label, name, type, placeholder, value, onChange, required,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="font-courier text-[0.65rem] tracking-[0.15em] uppercase text-[var(--film-gold-45)]">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={[
          "w-full rounded-[3px] px-4 py-3",
          "font-courier text-[0.8rem] tracking-[0.02em]",
          "text-[var(--film-text-label)] placeholder:text-[var(--film-text-muted)] placeholder:opacity-50",
          "border border-[var(--film-gold-15)] bg-[var(--film-surface-deep)]",
          "focus:outline-none focus:border-[var(--film-gold-45)]",
          "transition-colors duration-150",
        ].join(" ")}
      />
    </div>
  );
}
