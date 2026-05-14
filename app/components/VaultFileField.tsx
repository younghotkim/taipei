"use client";

import { useRef, useState } from "react";
import { ExternalLink, Loader2, Paperclip, X } from "lucide-react";

const IMAGE_EXT = /\.(jpe?g|png|webp|heic|gif)(\?|$)/i;

function fileLabel(url: string): string {
  try {
    const path = new URL(url).pathname;
    const base = decodeURIComponent(path.split("/").pop() ?? "");
    return base || "첨부 파일";
  } catch {
    return "첨부 파일";
  }
}

export function VaultFileField({
  value,
  itemId,
  onChange,
  label = "첨부 파일 — 탑승권 PDF · 바우처 이미지 등 (선택)",
  addLabel = "파일 첨부"
}: {
  value: string;
  itemId: string;
  onChange: (url: string) => void;
  label?: string;
  addLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("stopId", `vault-${itemId}`);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? `업로드 실패 (${res.status})`);
      }
      const payload = (await res.json()) as { url?: string };
      if (payload.url) onChange(payload.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const isImage = value && IMAGE_EXT.test(value);

  return (
    <label className="field field--wide vault-file">
      <span>{label}</span>
      {value ? (
        <div className="vault-file__row">
          {isImage ? (
            <a href={value} target="_blank" rel="noreferrer" className="vault-file__thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="첨부 미리보기" loading="lazy" />
            </a>
          ) : (
            <span className="vault-file__icon"><Paperclip size={16} /></span>
          )}
          <a href={value} target="_blank" rel="noreferrer" className="vault-file__name">
            <ExternalLink size={13} />
            {fileLabel(value)}
          </a>
          <button type="button" className="vault-file__clear" onClick={() => onChange("")} aria-label="첨부 제거">
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="vault-file__add"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 size={15} className="spin" /> : <Paperclip size={15} />}
          {uploading ? "업로드 중…" : addLabel}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
      {error && <em className="vault-file__error">{error}</em>}
    </label>
  );
}
