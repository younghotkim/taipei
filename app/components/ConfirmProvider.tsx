"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "neutral";
};

type ConfirmCtx = (options: ConfirmOptions) => Promise<boolean>;

const Context = createContext<ConfirmCtx | null>(null);

export function useConfirm(): ConfirmCtx {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}

type PendingRequest = {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingRequest | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  const confirm = useCallback<ConfirmCtx>((options) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setPending({ options, resolve });
    });
  }, []);

  const close = useCallback((result: boolean) => {
    const r = resolverRef.current;
    resolverRef.current = null;
    setPending(null);
    if (r) r(result);
  }, []);

  // Focus the confirm button when the dialog opens, restore body scroll lock.
  useEffect(() => {
    if (!pending) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => confirmBtnRef.current?.focus(), 30);
    return () => {
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [pending]);

  useEffect(() => {
    if (!pending) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(false);
      } else if (event.key === "Enter") {
        event.preventDefault();
        close(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, close]);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <Context.Provider value={value}>
      {children}
      {pending && (
        <div
          className="confirm-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) close(false);
          }}
        >
          <div
            className={`confirm-dialog confirm-dialog--${pending.options.tone ?? "danger"}`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={pending.options.description ? "confirm-desc" : undefined}
          >
            <button
              type="button"
              className="confirm-dialog__close"
              onClick={() => close(false)}
              aria-label="닫기"
            >
              <X size={16} />
            </button>
            <div className="confirm-dialog__icon" aria-hidden="true">
              <AlertTriangle size={22} />
            </div>
            <h2 id="confirm-title" className="confirm-dialog__title">
              {pending.options.title}
            </h2>
            {pending.options.description && (
              <p id="confirm-desc" className="confirm-dialog__desc">
                {pending.options.description}
              </p>
            )}
            <div className="confirm-dialog__actions">
              <button
                type="button"
                className="confirm-dialog__cancel"
                onClick={() => close(false)}
              >
                {pending.options.cancelLabel ?? "취소"}
              </button>
              <button
                type="button"
                ref={confirmBtnRef}
                className={`confirm-dialog__confirm confirm-dialog__confirm--${pending.options.tone ?? "danger"}`}
                onClick={() => close(true)}
              >
                {(pending.options.tone ?? "danger") === "danger" && <Trash2 size={15} />}
                {pending.options.confirmLabel ?? "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Context.Provider>
  );
}
