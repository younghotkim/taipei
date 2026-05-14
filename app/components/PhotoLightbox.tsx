"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";

export function PhotoLightbox({
  photos,
  startIndex,
  caption,
  onClose
}: {
  photos: string[];
  startIndex: number;
  caption?: string;
  onClose: () => void;
}) {
  const safeStart = Math.min(Math.max(0, startIndex), Math.max(0, photos.length - 1));
  const [index, setIndex] = useState(safeStart);
  const touchStartX = useRef<number | null>(null);

  const total = photos.length;

  useEffect(() => {
    setIndex(safeStart);
  }, [safeStart]);

  const go = (delta: number) => {
    setIndex((current) => {
      const next = current + delta;
      if (next < 0) return 0;
      if (next > total - 1) return total - 1;
      return next;
    });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (total === 0) return null;
  const current = photos[index];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    go(delta > 0 ? -1 : 1);
  };

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="사진 보기"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        type="button"
        className="lightbox__close"
        onClick={onClose}
        aria-label="닫기"
      >
        <X size={20} />
      </button>

      <div className="lightbox__counter">
        {index + 1} / {total}
        {caption && <span>· {caption}</span>}
      </div>

      <div className="lightbox__stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={current} src={current} alt={caption ?? `photo-${index + 1}`} />
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            className="lightbox__nav lightbox__nav--prev"
            onClick={() => go(-1)}
            disabled={index === 0}
            aria-label="이전 사진"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            type="button"
            className="lightbox__nav lightbox__nav--next"
            onClick={() => go(1)}
            disabled={index === total - 1}
            aria-label="다음 사진"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      <div className="lightbox__actions">
        <a className="lightbox__open" href={current} target="_blank" rel="noreferrer">
          <ExternalLink size={14} />
          새 탭에서 원본 열기
        </a>
      </div>
    </div>
  );
}
