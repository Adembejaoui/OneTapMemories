"use client";

interface UploadedPhotoProps {
  url: string;
  uploadedAt?: string;
  guestLabel?: string;
  onClick?: () => void;
}

export default function UploadedPhoto({ url, uploadedAt, guestLabel, onClick }: UploadedPhotoProps) {
  // Format date nicely
  const formattedDate = uploadedAt
    ? new Date(uploadedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div
      className="relative film-thumb-hover cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
      aria-label="View enlarged photo"
    >
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
          <img
            src={url}
            alt={guestLabel || 'Uploaded photo'}
            className="absolute inset-0 w-full h-full object-cover film-img"
            loading="lazy"
          />
        </div>

        {/* Caption strip */}
        <div className="absolute bottom-0 left-0 right-0 h-8 flex flex-col items-center justify-center px-1">
          <span className="font-courier text-[0.6rem] tracking-[0.03em] block text-center truncate max-w-full text-[var(--film-caption-name)]">
            {guestLabel || 'Frame'}
          </span>
          {formattedDate && (
            <span className="text-[0.55rem] tracking-[0.02em] text-[var(--film-caption-done)]">
              {formattedDate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
