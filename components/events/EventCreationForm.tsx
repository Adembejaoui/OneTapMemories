"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEventFormSchema, CreateEventFormValues } from "lib/validations/event";
import { createEventAction } from "app/actions/events";
import QRCodeDisplay from "components/events/QRCodeDisplay";

interface Props {
  token: string;
}

/* ── tiny reusable field wrapper ── */
function FilmField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-courier text-[0.65rem] tracking-[0.15em] uppercase text-[var(--film-gold-45)]"
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="font-courier text-[0.65rem] tracking-[0.03em] text-[var(--film-caption-error)] mt-0.5">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass = [
  "w-full rounded-[3px] px-4 py-3",
  "font-courier text-[0.82rem] tracking-[0.02em]",
  "text-[var(--film-text-label)]",
  "placeholder:text-[var(--film-text-muted)] placeholder:opacity-40",
  "border border-[var(--film-gold-15)]",
  "bg-[var(--film-surface-deep)]",
  "focus:outline-none focus:border-[var(--film-gold-45)]",
  "transition-colors duration-150",
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none",
].join(" ");

export default function EventCreationForm({ token }: Props) {
  const [result,      setResult]      = React.useState<{ slug: string; eventUrl: string } | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventFormSchema),
    defaultValues: {
      eventName:          "",
      email:              "",
      maxUploadsPerGuest: 10,
    },
  });

  const onSubmit = async (data: CreateEventFormValues) => {
    setServerError(null);
    const res = await createEventAction(data, token);
    if (res.success && res.slug && res.eventUrl) {
      setResult({ slug: res.slug, eventUrl: res.eventUrl });
    } else {
      setServerError(res.error ?? "Something went wrong");
    }
  };

  /* ── Success: hand off to QR display ── */
  if (result) {
    return (
      <QRCodeDisplay
        eventUrl={result.eventUrl}
        eventName={form.getValues().eventName}
      />
    );
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div
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

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2.5 mb-5">
            <span className="flex-1 max-w-[60px] h-px bg-[var(--film-gold-20)]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--film-gold-60)]" />
            <span className="font-courier text-[0.68rem] tracking-[0.22em] uppercase text-[var(--film-gold-60)]">
              New event
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--film-gold-60)]" />
            <span className="flex-1 max-w-[60px] h-px bg-[var(--film-gold-20)]" />
          </div>
          <h1 className="font-playfair text-[2.2rem] font-semibold leading-tight tracking-[-0.01em] mb-2 text-[var(--film-text-primary)]">
            Load a new roll
          </h1>
          <p className="font-playfair italic text-[0.9rem] text-[var(--film-text-muted)]">
            Set up your event and share the link with your guests.
          </p>
        </div>

        {/* Form card */}
        <div
          className="relative rounded-[4px] border border-[var(--film-gold-15)] p-8 overflow-hidden"
          style={{ background: "var(--film-surface)" }}
        >
          {/* Corner brackets */}
          <span aria-hidden className="absolute top-[10px] left-[10px] w-4 h-4 border-t-[1.5px] border-l-[1.5px] border-[var(--film-gold-35)]" />
          <span aria-hidden className="absolute top-[10px] right-[10px] w-4 h-4 border-t-[1.5px] border-r-[1.5px] border-[var(--film-gold-35)]" />
          <span aria-hidden className="absolute bottom-[10px] left-[10px] w-4 h-4 border-b-[1.5px] border-l-[1.5px] border-[var(--film-gold-35)]" />
          <span aria-hidden className="absolute bottom-[10px] right-[10px] w-4 h-4 border-b-[1.5px] border-r-[1.5px] border-[var(--film-gold-35)]" />

          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">

            {/* Server error */}
            {serverError && (
              <div
                className="flex items-center gap-2.5 px-4 py-3 rounded-[3px] border font-courier text-[0.75rem] tracking-[0.03em]"
                style={{
                  background:  "var(--film-alert-error-bg)",
                  borderColor: "var(--film-alert-error-border)",
                  color:       "var(--film-alert-error-text)",
                }}
                role="alert"
              >
                <span className="flex-shrink-0">⚠</span>
                <span className="flex-1">{serverError}</span>
                <button
                  type="button"
                  onClick={() => setServerError(null)}
                  className="ml-auto text-base leading-none opacity-60 hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer p-0"
                >
                  ×
                </button>
              </div>
            )}

            {/* Event name */}
            <FilmField
              id="eventName"
              label="Event name"
              error={form.formState.errors.eventName?.message}
            >
              <input
                id="eventName"
                placeholder="Sarah & James · Wedding"
                className={inputClass}
                {...form.register("eventName")}
              />
            </FilmField>

            {/* Email */}
            <FilmField
              id="email"
              label="Your email"
              error={form.formState.errors.email?.message}
            >
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className={inputClass}
                {...form.register("email")}
              />
            </FilmField>

            {/* Max uploads — number field with +/- stepper */}
            <FilmField
              id="maxUploadsPerGuest"
              label="Max uploads per guest"
              error={form.formState.errors.maxUploadsPerGuest?.message}
            >
              <div className="flex items-center rounded-[3px] border border-[var(--film-gold-15)] overflow-hidden bg-[var(--film-surface-deep)] focus-within:border-[var(--film-gold-45)] transition-colors duration-150">
                <button
                  type="button"
                  onClick={() => {
                    const cur = form.getValues("maxUploadsPerGuest");
                    if (cur > 1) form.setValue("maxUploadsPerGuest", cur - 1, { shouldValidate: true });
                  }}
                  className="px-3.5 py-3 font-courier text-[1rem] text-[var(--film-gold-45)] hover:text-[var(--film-gold)] hover:bg-[var(--film-gold-05)] transition-all duration-150 border-none bg-transparent cursor-pointer leading-none"
                >
                  −
                </button>
                <input
                  id="maxUploadsPerGuest"
                  type="number"
                  min={1}
                  max={50}
                  className={[
                    "flex-1 text-center border-none bg-transparent",
                    "font-courier text-[0.9rem] tracking-[0.08em] text-[var(--film-text-label)]",
                    "focus:outline-none",
                    "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                  ].join(" ")}
                  {...form.register("maxUploadsPerGuest", { valueAsNumber: true })}
                />
                <button
                  type="button"
                  onClick={() => {
                    const cur = form.getValues("maxUploadsPerGuest");
                    if (cur < 50) form.setValue("maxUploadsPerGuest", cur + 1, { shouldValidate: true });
                  }}
                  className="px-3.5 py-3 font-courier text-[1rem] text-[var(--film-gold-45)] hover:text-[var(--film-gold)] hover:bg-[var(--film-gold-05)] transition-all duration-150 border-none bg-transparent cursor-pointer leading-none"
                >
                  +
                </button>
              </div>
              <p className="font-courier text-[0.6rem] tracking-[0.06em] text-[var(--film-text-muted)] mt-1">
                Between 1 and 50 frames per guest
              </p>
            </FilmField>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={[
                "w-full mt-2 py-3.5 px-6 rounded-[3px]",
                "font-courier text-[0.78rem] tracking-[0.14em] uppercase font-bold",
                "flex items-center justify-center gap-2",
                "transition-all duration-200 cursor-pointer border-none",
                "hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100",
              ].join(" ")}
              style={{ background: "var(--film-gold)", color: "var(--film-bg)" }}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="w-3.5 h-3.5 rounded-full border-[1.5px] animate-film-spin"
                    style={{ borderColor: "rgba(12,9,6,0.3)", borderTopColor: "var(--film-bg)" }}
                  />
                  Loading the roll…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
                    <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                    {[0, 60, 120, 180, 240, 300].map((a) => (
                      <line
                        key={a}
                        x1="7" y1="7"
                        x2={7 + 6 * Math.cos((a * Math.PI) / 180)}
                        y2={7 + 6 * Math.sin((a * Math.PI) / 180)}
                        stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5"
                      />
                    ))}
                  </svg>
                  Create event
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center font-courier text-[0.62rem] tracking-[0.06em] text-[var(--film-text-muted)] mt-5">
          A unique link will be generated for your guests to upload photos.
        </p>
      </div>
    </div>
  );
}