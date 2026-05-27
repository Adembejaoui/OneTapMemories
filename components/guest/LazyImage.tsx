import { useState, useEffect, useRef, useCallback, memo } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage = memo(function LazyImage({ 
  src, 
  alt, 
  className, 
  onClick,
  onLoad,
  onError 
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "50px", threshold: 0.01 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  return (
    <div 
      ref={imgRef} 
      className={`relative w-full h-full ${className ?? ""}`}
      onClick={onClick}
    >
      {!isInView && (
        <div 
          className="absolute inset-0 animate-pulse bg-[var(--film-gold-05)] rounded-[2px]"
          style={{ background: "var(--film-surface-deep)" }}
        />
      )}
      
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover film-img transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading="eager"
          decoding="async"
        />
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center text-[var(--film-text-muted)] text-[0.7rem]">
          Failed to load
        </div>
      )}
    </div>
  );
});

interface VirtualizedGalleryProps {
  items: Array<{ id: string; url: string; createdAt: string; guestToken: string }>;
  itemHeight?: number;
  itemsPerRow?: number;
  renderItem: (item: { id: string; url: string; createdAt: string; guestToken: string }, index: number) => React.ReactNode;
}

export function VirtualizedGallery({
  items,
  itemHeight = 120,
  itemsPerRow = 3,
  renderItem,
}: VirtualizedGalleryProps) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const containerRef = useRef<HTMLDivElement>(null);

  const updateVisibleRange = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollTop = window.scrollY;
    const containerTop = container.offsetTop;
    const windowHeight = window.innerHeight;

    const start = Math.max(0, Math.floor((scrollTop - containerTop + windowHeight) / (itemHeight * 1.5)) * itemsPerRow);
    const end = Math.min(
      items.length,
      start + itemsPerRow * (Math.ceil(windowHeight / (itemHeight * 0.8)) + itemsPerRow * 2)
    );

    setVisibleRange({ start, end });
  }, [items.length, itemHeight, itemsPerRow]);

  useEffect(() => {
    updateVisibleRange();
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateVisibleRange();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [updateVisibleRange]);

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);

  return (
    <div ref={containerRef} className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
      {visibleItems.map((item, index) => renderItem(item, visibleRange.start + index))}
    </div>
  );
}