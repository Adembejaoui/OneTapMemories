"use client";

import { useEffect, useState } from "react";

type FileStatus = {
  name: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

interface PhotoThumbnailProps {
  file: File;
  status: FileStatus;
  onRemove?: () => void;
}

export default function PhotoThumbnail({ file, status, onRemove }: PhotoThumbnailProps) {
  const [objectUrl, setObjectUrl] = useState<string>("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shortName = file.name.length > 14 ? `${file.name.slice(0, 14)}…` : file.name;

  return (
    /* Polaroid wrapper — lifts & tilts on hover */
    <div className="relative film-thumb-hover">

      {/* Polaroid frame */}
      <div
        className="rounded-[2px] p-[6px] pb-8"
        style={{
          background: "var(--film-surface)",
          border: "1px solid var(--film-gold-15)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.3)",
        }}
      >
        {/* Square photo frame */}
        <div className="relative w-full pb-[100%] overflow-hidden film-grain" style={{ background: "var(--film-photo-bg)" }}>

          {objectUrl && (
            <img
              src={objectUrl}
              alt={file.name}
              className="absolute inset-0 w-full h-full object-cover film-img"
            />
          )}

          {/* Status overlays */}
          {status.status === "uploading" && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "var(--film-upload-overlay)" }}>
              <div
                className="w-7 h-7 rounded-full border-2 border-t-[var(--film-gold)] animate-film-spin"
                style={{ borderColor: "rgba(210,160,80,0.25)", borderTopColor: "var(--film-gold)" }}
              />
            </div>
          )}

          {status.status === "done" && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "var(--film-done-overlay)" }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke="rgba(180,230,160,0.9)" strokeWidth="1.5" />
                <polyline points="8,14 12,18 20,10" stroke="rgba(180,230,160,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {status.status === "error" && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "var(--film-error-overlay)" }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke="rgba(240,140,100,0.9)" strokeWidth="1.5" />
                <line x1="10" y1="10" x2="18" y2="18" stroke="rgba(240,140,100,0.9)" strokeWidth="2" strokeLinecap="round" />
                <line x1="18" y1="10" x2="10" y2="18" stroke="rgba(240,140,100,0.9)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          )}

          {/* Remove button — pending only */}
          {status.status === "pending" && onRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              aria-label="Remove photo"
              className={[
                "absolute top-1 right-1 z-10",
                "w-5 h-5 rounded-full flex items-center justify-center",
                "text-[var(--film-gold)] text-base leading-none",
                "border border-[var(--film-gold-45)] cursor-pointer",
                "transition-all duration-150",
                "hover:bg-[rgba(180,50,30,0.7)] hover:border-[rgba(240,140,100,0.6)] hover:text-white",
              ].join(" ")}
              style={{ background: "rgba(20,15,8,0.85)" }}
            >
              ×
            </button>
          )}
        </div>

        {/* Caption strip */}
        <div className="absolute bottom-0 left-0 right-0 h-8 flex flex-col items-center justify-center px-1">
          <span className="font-courier text-[0.6rem] tracking-[0.03em] block text-center truncate max-w-full text-[var(--film-caption-name)]">
            {shortName}
          </span>
          {status.status === "error" && (
            <span className="text-[0.55rem] tracking-[0.02em] text-[var(--film-caption-error)]">
              {status.error || "Failed"}
            </span>
          )}
          {status.status === "done" && (
            <span className="text-[0.55rem] tracking-[0.02em] text-[var(--film-caption-done)]">
              Developed ✓
            </span>
          )}
          {status.status === "uploading" && (
            <span className="text-[0.55rem] tracking-[0.02em] text-[var(--film-caption-uploading)] animate-film-pulse">
              Developing…
            </span>
          )}
        </div>
      </div>
    </div>
  );
}