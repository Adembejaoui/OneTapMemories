"use client";

import { useEffect, useState } from "react";
import UploadZone from "./UploadZone";
import PhotoThumbnail from "./PhotoThumbnail";
import UploadedPhoto from "./UploadedPhoto";
import UploadProgress from "./UploadProgress";
import PhotoModal from "./PhotoModal";

type FileStatus = {
  name: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

interface Upload {
  id: string;
  url: string;
  guestToken: string;
  createdAt: string;
}

interface GuestUploadPageProps {
  event: {
    id: string;
    name: string;
    slug: string;
    maxUploadsPerGuest: number;
    image?: string | null;
  };
}

export default function GuestUploadPage({ event }: GuestUploadPageProps) {
  const [guestToken,    setGuestToken]    = useState<string>("");
  const [uploadedCount, setUploadedCount] = useState<number>(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileStatuses,  setFileStatuses]  = useState<Map<string, FileStatus>>(new Map());
  const [globalError,   setGlobalError]   = useState<string | null>(null);
  const [showSuccess,   setShowSuccess]   = useState(false);
  const [eventUploads, setEventUploads] = useState<Upload[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [totalEventImages, setTotalEventImages] = useState<number>(0);
  const [displayCount, setDisplayCount] = useState<number>(20); // pagination: images per page
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  /* ── Guest token ── */
  useEffect(() => {
    const key = `guest_token_${event.id}`;
    const existing = sessionStorage.getItem(key);
    if (existing) {
      setGuestToken(existing);
    } else {
      const token = crypto.randomUUID();
      sessionStorage.setItem(key, token);
      setGuestToken(token);
    }
  }, [event.id]);

  /* ── Fetch existing uploads for gallery ── */
  useEffect(() => {
    const fetchUploads = async () => {
      try {
        const res = await fetch(`/api/uploads?eventId=${event.id}`);
        if (res.ok) {
          const json = await res.json();
          const uploads = json.data ?? [];
          setEventUploads(uploads);
          setTotalEventImages(uploads.length);
          setDisplayCount(20); // reset pagination when event changes
        }
      } catch (err) {
        console.error('Failed to fetch uploads:', err);
      } finally {
        setLoadingGallery(false);
      }
    };
    fetchUploads();
  }, [event.id]);

   /* ── Upload handler ── */
   const uploadFiles = async () => {
     if (selectedFiles.length === 0) return;
     setShowSuccess(false);

     // Set all files to uploading
     const initialStatuses = new Map(fileStatuses);
     selectedFiles.forEach(file => {
       initialStatuses.set(file.name, { name: file.name, status: "uploading" });
     });
     setFileStatuses(initialStatuses);

     // Build batch formData
     const formData = new FormData();
     selectedFiles.forEach(file => {
       formData.append("files", file);
     });
     formData.append("eventSlug", event.slug);
     formData.append("guestToken", guestToken);

     try {
       const res = await fetch("/api/upload/batch", { method: "POST", body: formData });
       const json = await res.json();

       if (res.ok && json.success) {
         // Process per-file results
         json.results.forEach((result: { fileName: string; success: boolean; error?: string }) => {
           if (result.success) {
             setFileStatuses(prev => {
               const m = new Map(prev);
               m.set(result.fileName, { name: result.fileName, status: "done" });
               return m;
             });
           } else {
             setFileStatuses(prev => {
               const m = new Map(prev);
               m.set(result.fileName, {
                 name: result.fileName,
                 status: "error",
                 error: result.error || "Upload failed",
               });
               return m;
             });
           }
         });

         const succeededCount = json.results.filter((r: { success: boolean }) => r.success).length;
         setUploadedCount(c => c + succeededCount);
         setTotalEventImages(c => c + succeededCount);

         if (succeededCount < selectedFiles.length) {
           setGlobalError(`Some files failed to upload. ${json.summary.failed} of ${json.summary.total} failed.`);
         }
       } else {
         // Handle batch-level errors (validation, limit, etc.)
         setGlobalError(json.error || "Upload failed");
         // Reset all to error state
         selectedFiles.forEach(file => {
           setFileStatuses(prev => {
             const m = new Map(prev);
             m.set(file.name, { name: file.name, status: "error", error: json.error || "Upload failed" });
             return m;
           });
         });
       }
     } catch {
       setGlobalError("Network error");
       selectedFiles.forEach(file => {
         setFileStatuses(prev => {
           const m = new Map(prev);
           m.set(file.name, { name: file.name, status: "error", error: "Network error" });
           return m;
         });
       });
     }

     setShowSuccess(true);
     setSelectedFiles([]);
   };

  /* ── Derived state ── */
  const slotsRemaining = event.maxUploadsPerGuest - uploadedCount;
  const isUploading    = Array.from(fileStatuses.values()).some((s) => s.status === "uploading");
  const canUpload      = slotsRemaining > 0 && selectedFiles.length > 0 && !isUploading;
  const limitReached   = uploadedCount >= event.maxUploadsPerGuest;

  const handleRemoveFile = (fileName: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== fileName));
    setFileStatuses((prev) => { const m = new Map(prev); m.delete(fileName); return m; });
  };

  const openModal = (url: string, index: number) => {
    setSelectedImageUrl(url);
    setSelectedImageIndex(index);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setSelectedImageUrl("");
    setSelectedImageIndex(0);
  };

  const goToPrev = () => {
    const newIndex = selectedImageIndex - 1;
    if (newIndex >= 0) {
      const upload = eventUploads[newIndex];
      if (upload) {
        setSelectedImageIndex(newIndex);
        setSelectedImageUrl(upload.url);
      }
    }
  };

  const goToNext = () => {
    const newIndex = selectedImageIndex + 1;
    if (newIndex < eventUploads.length) {
      const upload = eventUploads[newIndex];
      if (upload) {
        setSelectedImageIndex(newIndex);
        setSelectedImageUrl(upload.url);
      }
    }
  };

  const loadMore = () => {
    setDisplayCount((prev) => Math.min(prev + 20, eventUploads.length));
  };

  /* ═══════════════════════════════════════
     Render
  ═══════════════════════════════════════ */
  return (
    <div
      className="relative min-h-screen overflow-x-hidden film-page-grain film-page-vignette"
      style={{ background: "var(--film-bg)", color: "var(--film-text-primary)" }}
    >
      {/* ── Film strip edges ── */}
      {["left", "right"].map((side) => (
        <div
          key={side}
          aria-hidden
          className={[
            "fixed top-0 bottom-0 z-10 w-[22px] flex flex-col items-center justify-around py-3",
            side === "left"
              ? "left-0 border-r border-[var(--film-gold-10)]"
              : "right-0 border-l border-[var(--film-gold-10)]",
          ].join(" ")}
          style={{ background: "#050402" }}
        >
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="w-[9px] h-[7px] rounded-[1px] flex-shrink-0 border border-[var(--film-gold-15)]"
              style={{ background: "#1a120a" }}
            />
          ))}
        </div>
      ))}

      {/* ── Main content ── */}
      <div className="relative z-[5] max-w-[760px] mx-auto px-12 pt-16 pb-24 sm:px-7 sm:pt-10 sm:pb-16">

        {/* ── Header ── */}
        <header className="mb-10 text-center">
          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-2.5 mb-5">
            <span className="flex-1 max-w-[60px] h-px bg-[var(--film-gold-20)]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--film-gold-60)]" />
            <span className="font-courier text-[0.7rem] tracking-[0.2em] uppercase text-[var(--film-gold-60)]">
              Event Memories
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--film-gold-60)]" />
            <span className="flex-1 max-w-[60px] h-px bg-[var(--film-gold-20)]" />
          </div>

          <h1 className="font-playfair text-[clamp(2rem,5vw,3.2rem)] font-semibold leading-[1.15] tracking-[-0.01em] mb-2 text-[var(--film-text-primary)]">
            {event.name}
          </h1>

          <p className="font-playfair italic text-[0.95rem] tracking-[0.02em] text-[var(--film-text-muted)]">
            Share your moments — every frame tells a story
          </p>
        </header>

         {/* ── Event gallery ── */}
      

        {/* ── Film strip progress ── */}
        <UploadProgress
          uploaded={uploadedCount}
          max={event.maxUploadsPerGuest}
          totalEvent={totalEventImages}
        />

        {/* ── Global error alert ── */}
        {globalError && (
          <div
            className="flex items-center gap-2.5 px-4 py-3 rounded-[3px] border font-courier text-[0.8rem] tracking-[0.03em] mb-5"
            style={{
              background:   "var(--film-alert-error-bg)",
              borderColor:  "var(--film-alert-error-border)",
              color:        "var(--film-alert-error-text)",
            }}
            role="alert"
          >
            <span className="flex-shrink-0 text-base">⚠</span>
            <span className="flex-1">{globalError}</span>
            <button
              onClick={() => setGlobalError(null)}
              className="ml-auto text-[1.1rem] leading-none opacity-60 hover:opacity-100 transition-opacity duration-150 cursor-pointer bg-transparent border-none p-0"
            >
              ×
            </button>
          </div>
        )}

        {/* ── Success banner ── */}
        {showSuccess && !globalError && selectedFiles.length === 0 && (
          <div
            className="flex items-center gap-2.5 px-4 py-3 rounded-[3px] border font-courier text-[0.8rem] tracking-[0.03em] mb-5"
            style={{
              background:  "var(--film-alert-ok-bg)",
              borderColor: "var(--film-alert-ok-border)",
              color:       "var(--film-alert-ok-text)",
            }}
            role="alert"
          >
            <span className="flex-shrink-0 text-base">✓</span>
            <span>
              Frames developed successfully!
              {slotsRemaining > 0 &&
                ` ${slotsRemaining} slot${slotsRemaining > 1 ? "s" : ""} remaining on this roll.`}
            </span>
          </div>
        )}

        {/* ── Upload section ── */}
        {limitReached ? (
          /* Roll complete state */
          <div
            className="text-center py-12 px-8 rounded-[3px] border mt-4"
            style={{
              borderColor: "var(--film-gold-15)",
              background:  "var(--film-gold-05)",
            }}
          >
            <div className="mb-4 flex justify-center">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="rgba(210,160,80,0.5)" strokeWidth="1.5" />
                <path d="M14 20l4 4 8-8" stroke="rgba(210,160,80,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-playfair text-[1.2rem] mb-1 text-[var(--film-text-label)]">
              Your roll is complete
            </p>
            <p className="font-courier text-[0.75rem] tracking-[0.04em] text-[var(--film-text-muted)]">
              You&apos;ve shared {uploadedCount} frame{uploadedCount !== 1 ? "s" : ""} with this event
            </p>
          </div>

        ) : (
          <>
            <UploadZone
              onFilesSelected={setSelectedFiles}
              disabled={limitReached || isUploading}
              maxFiles={slotsRemaining}
            />

            {selectedFiles.length > 0 && (
              <section className="mt-8 animate-film-fadeup">

                {/* Section header */}
                <div className="flex items-baseline gap-2 mb-4">
                  <h2 className="font-playfair text-[1rem] font-normal text-[var(--film-text-muted)] m-0 flex items-center gap-2">
                    Selected frames
                    <span className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full border border-[var(--film-gold-35)] font-courier text-[0.7rem] text-[var(--film-gold-60)]">
                      {selectedFiles.length}
                    </span>
                  </h2>
                </div>

                {/* Polaroid grid */}
                <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 mb-6 sm:grid-cols-[repeat(auto-fill,minmax(90px,1fr))] sm:gap-2">
                  {selectedFiles.map((file) => {
                    const status = fileStatuses.get(file.name) ?? {
                      name:   file.name,
                      status: "pending" as const,
                    };
                    return (
                      <PhotoThumbnail
                        key={file.name}
                        file={file}
                        status={status}
                        onRemove={
                          status.status === "pending"
                            ? () => handleRemoveFile(file.name)
                            : undefined
                        }
                      />
                    );
                  })}
                </div>

                {/* Develop button */}
                <button
                  onClick={uploadFiles}
                  disabled={!canUpload}
                  className={[
                    "relative w-full py-[0.9rem] px-6 overflow-hidden",
                    "rounded-[3px] border border-[var(--film-gold-45)]",
                    "font-courier text-[0.85rem] tracking-[0.12em] uppercase",
                    "text-[var(--film-text-label)] bg-transparent",
                    "flex items-center justify-center gap-0",
                    "transition-all duration-200 ease-in-out",
                    "cursor-pointer",
                    "hover:enabled:border-[var(--film-gold)] hover:enabled:text-[var(--film-text-primary)] hover:enabled:bg-[rgba(210,160,80,0.08)]",
                    "active:enabled:scale-[0.99]",
                    "disabled:opacity-35 disabled:cursor-not-allowed",
                  ].join(" ")}
                >
                  {isUploading ? (
                    <>
                      <span
                        className="w-3.5 h-3.5 rounded-full border-[1.5px] animate-film-spin mr-2 flex-shrink-0"
                        style={{ borderColor: "rgba(210,160,80,0.3)", borderTopColor: "var(--film-gold)" }}
                      />
                      Developing…
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mr-2 flex-shrink-0">
                        <path d="M8 2v8M5 5l3-3 3 3M3 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Develop {selectedFiles.length} frame{selectedFiles.length !== 1 ? "s" : ""}
                    </>
                  )}
                </button>
              </section>
            )}
          </>
         )}
         {!loadingGallery && eventUploads.length > 0 && (
           <section className="pt-10 mb-10">
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <h2 className="font-playfair text-[1rem] font-normal text-[var(--film-text-muted)] m-0 flex items-center gap-2">
                Event gallery
                <span className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full border border-[var(--film-gold-35)] font-courier text-[0.7rem] text-[var(--film-gold-60)]">
                  {eventUploads.length}
                </span>
              </h2>
              <span className="font-courier text-[0.65rem] text-[var(--film-text-muted)]">
                {displayCount >= eventUploads.length
                  ? `All ${eventUploads.length} frames`
                  : `Showing 1–${displayCount} of ${eventUploads.length}`
                }
              </span>
            </div>

             {/* Image grid - paginated */}
             <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 mb-4 sm:grid-cols-[repeat(auto-fill,minmax(90px,1fr))] sm:gap-2">
               {eventUploads.map((upload, index) => {
                 if (index >= displayCount) return null;
                 return (
                   <UploadedPhoto
                     key={upload.id}
                     url={upload.url}
                     uploadedAt={upload.createdAt}
                     guestLabel={`Guest ${upload.guestToken.slice(0, 4)}`}
                     onClick={() => openModal(upload.url, index)}
                   />
                 );
               })}
             </div>

             {/* Load More button */}
             {displayCount < eventUploads.length && (
               <button
                 onClick={loadMore}
                 className="w-full py-3 rounded-[3px] border border-[var(--film-gold-45)] font-courier text-[0.75rem] tracking-[0.1em] uppercase text-[var(--film-text-label)] bg-transparent hover:enabled:border-[var(--film-gold)] hover:enabled:text-[var(--film-text-primary)] hover:enabled:bg-[rgba(210,160,80,0.08)] transition-all duration-200"
               >
                 Load {Math.min(20, eventUploads.length - displayCount)} more
               </button>
             )}
           </section>
         )}
       </div>

      {/* Photo lightbox modal */}
      <PhotoModal
        url={selectedImageUrl}
        isOpen={modalOpen}
        onClose={closeModal}
        onPrev={goToPrev}
        onNext={goToNext}
        hasPrev={selectedImageIndex > 0}
        hasNext={selectedImageIndex < eventUploads.length - 1}
      />
    </div>
  );
}

