"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import UploadZone from "./UploadZone";
import PhotoThumbnail from "./PhotoThumbnail";
import UploadedPhoto from "./UploadedPhoto";
import UploadProgress from "./UploadProgress";
import PhotoModal from "./PhotoModal";
import { validateFileType, validateFileSize, validateFileContent } from "@/lib/upload-validator";
import { compressImage } from "@/lib/image-processor";

type FileStatus = {
  name: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  progress?: number;
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

const MAX_CONCURRENT_UPLOADS = 3;
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;
const GALLERY_PAGE_SIZE = 20;

export default function GuestUploadPage({ event }: GuestUploadPageProps) {
  const [guestToken, setGuestToken] = useState<string>("");
  const [uploadedCount, setUploadedCount] = useState<number>(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileStatuses, setFileStatuses] = useState<Map<string, FileStatus>>(new Map());
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [eventUploads, setEventUploads] = useState<Upload[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [totalEventImages, setTotalEventImages] = useState<number>(0);
  const [displayCount, setDisplayCount] = useState<number>(GALLERY_PAGE_SIZE);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  const updateFileStatus = useCallback((filename: string, status: Partial<FileStatus>) => {
    setFileStatuses(prev => {
      const m = new Map(prev);
      const existing = m.get(filename) ?? { name: filename, status: "pending" };
      m.set(filename, { ...existing, ...status });
      return m;
    });
  }, []);

const fetchUploadUrls = useCallback(async (files: {name: string; size: number}[]): Promise<{
     success: boolean;
     uploadUrls: Array<{
       filename: string;
       success: boolean;
       uploadUrl?: string;
       path?: string;
       error?: string;
     }>;
   }> => {
     const filenames = files.map(f => f.name);
     const fileSizes = files.map(f => f.size);
     
     const res = await fetch("/api/upload/url", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
         filenames,
         fileSizes,
         eventSlug: event.slug,
         guestToken,
       }),
     });
     const json = await res.json();
     if (!res.ok) {
       setGlobalError(json.error || "Failed to get upload URLs");
       return { success: false, uploadUrls: [] };
     }
     return json;
   }, [event.slug, guestToken]);

  const uploadWithRetry = useCallback(async (
    file: File,
    uploadUrl: string,
  ): Promise<boolean> => {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        updateFileStatus(file.name, { status: "uploading", progress: 0 });

        const xhr = new XMLHttpRequest();
        const uploadPromise = new Promise<boolean>((resolve, reject) => {
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              updateFileStatus(file.name, { progress: percent });
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(true);
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Network error"));
          });

          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });

        await uploadPromise;
        updateFileStatus(file.name, { status: "done", progress: 100 });
        return true;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    updateFileStatus(file.name, { status: "error", error: lastError, progress: 0 });
    return false;
  }, [updateFileStatus]);

  const createUploadRecords = useCallback(async (uploads: { url: string }[]): Promise<Upload[]> => {
    const res = await fetch("/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: event.id,
        uploads,
        guestToken,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to save uploads");
    }
    return json.data;
  }, [event.id, guestToken]);

  const processAndUploadFiles = useCallback(async (files: File[]): Promise<File[]> => {
    const compressionPromises = files.map(async (file) => {
      try {
        // Validate file content (magic bytes) before processing for security
        const contentCheck = await validateFileContent(file);
        if (!contentCheck.valid) {
          updateFileStatus(file.name, { status: "error", error: contentCheck.error });
          return null;
        }
        const compressed = await compressImage(file, 0.85, 1920, 1920);
        return compressed;
      } catch (e) {
        updateFileStatus(file.name, { status: "error", error: "Failed to process image" });
        return null;
      }
    });

    const results = await Promise.all(compressionPromises);
    return results.filter((f): f is File => f !== null);
  }, [updateFileStatus]);

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;
    setShowSuccess(false);
    setGlobalError(null);

    try {
      const processedFiles = await processAndUploadFiles(selectedFiles);
      
      // Validate files (MIME type, extension, size)
      const validFiles: File[] = []
      for (const f of processedFiles) {
        const typeCheck = validateFileType(f);
        if (!typeCheck.valid) {
          updateFileStatus(f.name, { status: "error", error: typeCheck.error });
          continue;
        }
        const sizeCheck = validateFileSize(f);
        if (!sizeCheck.valid) {
          updateFileStatus(f.name, { status: "error", error: sizeCheck.error });
          continue;
        }
        validFiles.push(f)
      }

      // Pass both filenames and sizes for server validation
      const filesWithSizes = validFiles.map(f => ({ name: f.name, size: f.size }));
      const urlResult = await fetchUploadUrls(filesWithSizes);

      if (!urlResult.success) {
        return;
      }

      const successfulUrls = urlResult.uploadUrls.filter(u => u.success && u.uploadUrl && u.path);
      const failedUrls = urlResult.uploadUrls.filter(u => !u.success);

      for (const failed of failedUrls) {
        updateFileStatus(failed.filename, { status: "error", error: failed.error });
      }

      // Semaphore-based concurrent upload limiting (efficient)
      const semaphore = MAX_CONCURRENT_UPLOADS;
      let activeUploads = 0;
      const uploadedPaths: { url: string }[] = [];
      
      const waitForSlot = () => new Promise<void>(resolve => {
        const check = () => {
          if (activeUploads < semaphore) resolve();
          else setTimeout(check, 25);
        };
        check();
      });

      const uploadTasks = validFiles.map(async (file) => {
        const urlData = successfulUrls.find(u => u.filename === file.name);
        if (!urlData?.uploadUrl) {
          updateFileStatus(file.name, { status: "error", error: "No upload URL available" });
          return;
        }
        await waitForSlot();
        activeUploads++;
        try {
          const success = await uploadWithRetry(file, urlData.uploadUrl);
          if (success) {
            const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/events/${urlData.path}`;
            uploadedPaths.push({ url: publicUrl });
          }
        } finally {
          activeUploads--;
        }
      });

      await Promise.all(uploadTasks);

      if (uploadedPaths.length > 0) {
        const savedUploads = await createUploadRecords(uploadedPaths);
        setEventUploads(prev => [...savedUploads.reverse(), ...prev]);
        setUploadedCount(c => c + savedUploads.length);
        setTotalEventImages(c => c + savedUploads.length);
      }

      setShowSuccess(true);
      setSelectedFiles([]);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Upload failed");
    }
  };

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

    const fetchUploads = async () => {
      try {
        const res = await fetch(`/api/uploads?eventId=${event.id}`);
        if (res.ok) {
          const json = await res.json();
          const uploads = json.data ?? [];
          setEventUploads(uploads);
          setTotalEventImages(uploads.length);
          const myToken = sessionStorage.getItem(key);
          setUploadedCount(uploads.filter((u: Upload) => u.guestToken === myToken).length);
        }
      } catch (err) {
        console.error('Failed to fetch uploads:', err);
      } finally {
        setLoadingGallery(false);
      }
    };
    fetchUploads();
  }, [event.id]);

  const slotsRemaining = event.maxUploadsPerGuest - uploadedCount;
  const isUploading = Array.from(fileStatuses.values()).some(s => s.status === "uploading");
  const canUpload = slotsRemaining > 0 && selectedFiles.length > 0 && !isUploading;
  const limitReached = uploadedCount >= event.maxUploadsPerGuest;

  const handleRemoveFile = useCallback((fileName: string) => {
    setSelectedFiles(prev => prev.filter(f => f.name !== fileName));
    setFileStatuses(prev => {
      const m = new Map(prev);
      m.delete(fileName);
      return m;
    });
  }, []);

  const openModal = useCallback((url: string, index: number) => {
    setSelectedImageUrl(url);
    setSelectedImageIndex(index);
    setModalOpen(true);
  }, []);
  
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedImageUrl("");
    setSelectedImageIndex(0);
  }, []);

  const goToPrev = useCallback(() => {
    const newIndex = selectedImageIndex - 1;
    if (newIndex >= 0) {
      const upload = eventUploads[newIndex];
      if (upload) {
        setSelectedImageIndex(newIndex);
        setSelectedImageUrl(upload.url);
      }
    }
  }, [selectedImageIndex, eventUploads]);

  const goToNext = useCallback(() => {
    const newIndex = selectedImageIndex + 1;
    if (newIndex < eventUploads.length) {
      const upload = eventUploads[newIndex];
      if (upload) {
        setSelectedImageIndex(newIndex);
        setSelectedImageUrl(upload.url);
      }
    }
  }, [selectedImageIndex, eventUploads]);

  const loadMore = useCallback(() => {
    setDisplayCount(prev => Math.min(prev + GALLERY_PAGE_SIZE, eventUploads.length));
  }, [eventUploads.length]);

  const visibleUploads = useMemo(() => 
    eventUploads.slice(0, displayCount), 
  [eventUploads, displayCount]);

  const thumbnailUrl = useCallback((url: string): string => {
    if (!url) return "";
    const baseUrl = url.split("?")[0];
    return `${baseUrl}?width=400&height=400&resize=cover`;
  }, []);

  return (
    
    <div
      className="relative min-h-screen overflow-x-hidden film-page-grain film-page-vignette"
      style={{ background: "var(--film-bg)", color: "var(--film-text-primary)" }}
    >
     {["left", "right"].map((side) => (
        <div
          key={side}
          aria-hidden
          className={`fixed top-0 bottom-0 z-10 w-[22px] flex flex-col items-center justify-around py-3 ${
            side === "left" ? "left-0 border-r" : "right-0 border-l"
          } border-[var(--film-gold-10)]`}
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

      <div className="relative z-[5] max-w-[760px] mx-auto px-12 pt-16 pb-24 sm:px-7 sm:pt-10 sm:pb-16">

        <header className="mb-10 text-center">
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
            Upload up to {event.maxUploadsPerGuest} photos — every frame tells a story
        </p>
          
        </header>

        <UploadProgress
          uploaded={uploadedCount}
          max={event.maxUploadsPerGuest}
          totalEvent={totalEventImages}
        />

        {globalError && (
          <div
            className="flex items-center gap-2.5 px-4 py-3 rounded-[3px] border font-courier text-[0.8rem] tracking-[0.03em] mb-5"
            style={{
              background: "var(--film-alert-error-bg)",
              borderColor: "var(--film-alert-error-border)",
              color: "var(--film-alert-error-text)",
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

        {showSuccess && !globalError && selectedFiles.length === 0 && (
          <div
            className="flex items-center gap-2.5 px-4 py-3 rounded-[3px] border font-courier text-[0.8rem] tracking-[0.03em] mb-5"
            style={{
              background: "var(--film-alert-ok-bg)",
              borderColor: "var(--film-alert-ok-border)",
              color: "var(--film-alert-ok-text)",
            }}
            role="alert"
          >
            <span className="flex-shrink-0 text-base">✓</span>
            <span>
              Frames developed successfully!
              {slotsRemaining > 0 && ` ${slotsRemaining} slot${slotsRemaining > 1 ? "s" : ""} remaining on this roll.`}
            </span>
          </div>
        )}

        {limitReached ? (
          <div
            className="text-center py-12 px-8 rounded-[3px] border mt-4"
            style={{
              borderColor: "var(--film-gold-15)",
              background: "var(--film-gold-05)",
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
                <div className="flex items-baseline gap-2 mb-4">
                  <h2 className="font-playfair text-[1rem] font-normal text-[var(--film-text-muted)] m-0 flex items-center gap-2">
                    Selected frames
                    <span className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full border border-[var(--film-gold-35)] font-courier text-[0.7rem] text-[var(--film-gold-60)]">
                      {selectedFiles.length}
                    </span>
                  </h2>
                </div>

                <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 mb-6 sm:grid-cols-[repeat(auto-fill,minmax(90px,1fr))] sm:gap-2">
                  {selectedFiles.map((file) => {
                    const status = fileStatuses.get(file.name) ?? {
                      name: file.name,
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

                <button
                  onClick={uploadFiles}
                  disabled={!canUpload}
                  className={`relative w-full py-[0.9rem] px-6 overflow-hidden rounded-[3px] border border-[var(--film-gold-45)] font-courier text-[0.85rem] tracking-[0.12em] uppercase text-[var(--film-text-label)] bg-transparent flex items-center justify-center gap-0 transition-all duration-200 ease-in-out cursor-pointer hover:enabled:border-[var(--film-gold)] hover:enabled:text-[var(--film-text-primary)] hover:enabled:bg-[rgba(210,160,80,0.08)] active:enabled:scale-[0.99] disabled:opacity-35 disabled:cursor-not-allowed`}
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

            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 mb-4 sm:grid-cols-[repeat(auto-fill,minmax(90px,1fr))] sm:gap-2">
              {visibleUploads.map((upload, index) => (
                <UploadedPhoto
                  key={upload.id}
                  url={thumbnailUrl(upload.url)}
                  uploadedAt={upload.createdAt}
                  guestLabel={`Guest ${upload.guestToken.slice(0, 4)}`}
                  onClick={() => openModal(upload.url, index)}
                />
              ))}
            </div>

            {displayCount < eventUploads.length && (
              <button
                onClick={loadMore}
                className="w-full py-3 rounded-[3px] border border-[var(--film-gold-45)] font-courier text-[0.75rem] tracking-[0.1em] uppercase text-[var(--film-text-label)] bg-transparent hover:enabled:border-[var(--film-gold)] hover:enabled:text-[var(--film-text-primary)] hover:enabled:bg-[rgba(210,160,80,0.08)] transition-all duration-200"
              >
                Load {Math.min(GALLERY_PAGE_SIZE, eventUploads.length - displayCount)} more
              </button>
            )}
          </section>
        )}
      </div>

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