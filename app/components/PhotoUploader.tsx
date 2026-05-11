"use client";

import { useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";

export function PhotoUploader({
  stopId,
  photos,
  onChange
}: {
  stopId: string;
  photos: string[];
  onChange: (next: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    setError(null);
    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("stopId", stopId);
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? `업로드 실패 (${response.status})`);
        }
        const payload = (await response.json()) as { url?: string };
        if (payload.url) uploaded.push(payload.url);
      }
      onChange([...photos, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    const next = photos.filter((_, i) => i !== index);
    onChange(next);
  }

  return (
    <div className="photo-uploader">
      <div className="photo-uploader__head">
        <strong>사진</strong>
        <button
          type="button"
          className="photo-uploader__add"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 size={14} className="weather-bar__spinner" /> : <Upload size={14} />}
          {uploading ? "업로드 중…" : "사진 추가"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files && event.target.files.length > 0) {
              void handleFiles(event.target.files);
            }
          }}
        />
      </div>
      {error && <div className="photo-uploader__error">{error}</div>}
      <div className="photo-uploader__grid">
        {photos.map((url, index) => (
          <div key={url} className="photo-uploader__cell">
            <img src={url} alt={`photo-${index + 1}`} loading="lazy" />
            <button
              type="button"
              className="photo-uploader__remove"
              onClick={() => removeAt(index)}
              title="제거"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {photos.length === 0 && (
          <div className="photo-uploader__empty">
            업로드된 사진이 없습니다. (Supabase Storage 버킷: trip-photos)
          </div>
        )}
      </div>
    </div>
  );
}
