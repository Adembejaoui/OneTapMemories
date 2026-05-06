"use client";

import { useRef, useState, DragEvent } from "react";

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
}

export default function UploadZone({
  onFilesSelected,
  disabled = false,
  maxFiles,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, maxFiles);
    if (files.length > 0) onFilesSelected(files);
  };
  const handleClick = () => { if (!disabled) inputRef.current?.click(); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, maxFiles);
    if (files.length > 0) onFilesSelected(files);
    e.target.value = "";
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        /* layout */
        "relative rounded-[4px] px-8 py-12 text-center overflow-hidden",
        "transition-all duration-300 ease-in-out",
        /* striped bg + border */
        "upload-zone-bg upload-zone-bg-hover",
        "border-[1.5px] border-dashed",
        /* state-based colour */
        isDragging && !disabled
          ? "border-[var(--film-gold)] !border-solid scale-[1.005] !bg-[rgba(210,160,80,0.06)]"
          : "border-[var(--film-gold-35)] hover:border-[var(--film-gold-60)]",
        disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : "cursor-pointer",
      ].join(" ")}
    >
      {/* Radial centre glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(210,160,80,0.04) 0%, transparent 70%)" }}
      />

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />

      {/* Film-frame corner brackets */}
      <span aria-hidden className="absolute top-[10px] left-[10px] w-4 h-4 border-t-[1.5px] border-l-[1.5px] border-[var(--film-gold-60)]" />
      <span aria-hidden className="absolute top-[10px] right-[10px] w-4 h-4 border-t-[1.5px] border-r-[1.5px] border-[var(--film-gold-60)]" />
      <span aria-hidden className="absolute bottom-[10px] left-[10px] w-4 h-4 border-b-[1.5px] border-l-[1.5px] border-[var(--film-gold-60)]" />
      <span aria-hidden className="absolute bottom-[10px] right-[10px] w-4 h-4 border-b-[1.5px] border-r-[1.5px] border-[var(--film-gold-60)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-2">

        {/* Camera shutter icon */}
        <svg
          width="48" height="48" viewBox="0 0 48 48" fill="none"
          className={[
            "mb-2 transition-[color,transform] duration-300 ease-in-out",
            isDragging
              ? "text-[var(--film-gold)] rotate-[30deg]"
              : "text-[var(--film-gold-45)]",
          ].join(" ")}
        >
          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="1.5" />
          {[0, 60, 120, 180, 240, 300].map((a) => {
            const rad = (a * Math.PI) / 180;
            const x2 = 24 + 20 * Math.cos(rad);
            const y2 = 24 + 20 * Math.sin(rad);
            return (
              <line
                key={a}
                x1="24" y1="24"
                x2={Math.round(x2 * 10000) / 10000}
                y2={Math.round(y2 * 10000) / 10000}
                stroke="currentColor" strokeWidth="1" strokeOpacity="0.4"
              />
            );
          })}
        </svg>

        <p className="font-playfair text-[1.1rem] font-medium tracking-[0.01em] m-0 text-[var(--film-text-label)]">
          {isDragging ? "Drop your frames here" : "Add your memories"}
        </p>

        <p className="text-[0.75rem] tracking-[0.04em] m-0 text-[var(--film-text-faint)]">
          Drag &amp; drop or click to select · JPEG, PNG, WEBP, GIF · max 10MB
        </p>

   
      </div>
    </div>
  );
}