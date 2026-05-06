"use client";

import { useEffect, useState } from "react";

interface PhotoModalProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export default function PhotoModal({ url, isOpen, onClose, onPrev, onNext, hasPrev, hasNext }: PhotoModalProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      setImgError(false);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(5, 4, 2, 0.98)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-3 right-3 z-10 w-8 h-8 sm:top-6 sm:right-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[var(--film-gold-60)] hover:text-[var(--film-gold)] hover:bg-[rgba(210,160,80,0.15)] transition-all duration-200"
        style={{ background: "rgba(20,15,8,0.9)" }}
      >
        <svg width="14" height="14" className="sm:w-[20px] sm:h-[20px]" viewBox="0 0 20 20" fill="none">
          <path d="M16 6L4 16M4 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Modal content wrapper */}
      <div className="relative p-2 sm:p-4" onClick={(e) => e.stopPropagation()}>
        {/* Polaroid frame */}
        <div
          className="rounded-[3px] sm:rounded-[4px] p-2 sm:p-4 pb-6 sm:pb-12"
          style={{
            background: "var(--film-surface)",
            border: "1px solid var(--film-gold-15)",
            boxShadow: "0 6px 20px sm:0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.4)",
          }}
        >
          {/* Navigation buttons - positioned outside frame */}
          {hasPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
              aria-label="Previous image"
              className="absolute -left-8 sm:left-[-50px] top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[var(--film-gold-60)] hover:text-[var(--film-gold)] hover:bg-[rgba(210,160,80,0.15)] transition-all duration-200"
              style={{ background: "rgba(20,15,8,0.9)" }}
            >
              <svg width="14" height="14" className="sm:w-[24px] sm:h-[24px]" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {hasNext && (
            <button
              onClick={(e) => { e.stopPropagation(); onNext?.(); }}
              aria-label="Next image"
              className="absolute -right-8 sm:right-[-50px] top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[var(--film-gold-60)] hover:text-[var(--film-gold)] hover:bg-[rgba(210,160,80,0.15)] transition-all duration-200"
              style={{ background: "rgba(20,15,8,0.9)" }}
            >
              <svg width="14" height="14" className="sm:w-[24px] sm:h-[24px]" viewBox="0 0 24 24" fill="none">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Responsive square image container */}
          <div
            className="relative w-[80vw] sm:w-[92vw] max-w-[260px] sm:max-w-[900px] pb-[100%] overflow-hidden"
            style={{ background: "var(--film-photo-bg)" }}
          >
            {!imgError ? (
              <img
                src={url}
                alt="Enlarged photo"
                className="absolute inset-0 w-full h-full object-contain"
                style={{ imageRendering: "auto" }}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--film-text-muted)]">
                <span className="text-[0.7rem] sm:text-[0.9rem] mb-2">Image not available</span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.65rem] sm:text-[0.8rem] underline text-[var(--film-gold-60)] hover:text-[var(--film-gold)]"
                >
                  Open directly
                </a>
              </div>
            )}
          </div>

        
        </div>
      </div>
    </div>
  );
}
