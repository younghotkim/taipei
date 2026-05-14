"use client";

import { Delete } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const PIN = "0102";
const UNLOCK_KEY = "taipei-trip-pin-unlocked-v1";
const PIN_LENGTH = 4;

// Routes that are intentionally public — the printable / shareable photobook.
const PUBLIC_PREFIXES = ["/recap/print"];

type GateState = "checking" | "locked" | "unlocked";

export function PinGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = pathname ? PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) : false;
  const [state, setState] = useState<GateState>("checking");
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isPublic) {
      setState("unlocked");
      return;
    }
    const unlocked = window.localStorage.getItem(UNLOCK_KEY) === "yes";
    setState(unlocked ? "unlocked" : "locked");
  }, [isPublic]);

  const submit = useCallback((value: string) => {
    if (value === PIN) {
      window.localStorage.setItem(UNLOCK_KEY, "yes");
      setError(false);
      setShake(false);
      // brief delay so the last dot can flash before the gate fades out
      setTimeout(() => setState("unlocked"), 160);
      return;
    }
    setError(true);
    setShake(true);
    setTimeout(() => {
      setPin("");
      setShake(false);
    }, 480);
  }, []);

  const pushDigit = useCallback(
    (digit: string) => {
      setPin((current) => {
        if (current.length >= PIN_LENGTH) return current;
        const next = current + digit;
        if (next.length === PIN_LENGTH) submit(next);
        return next;
      });
      if (error) setError(false);
    },
    [error, submit]
  );

  const popDigit = useCallback(() => {
    setPin((current) => current.slice(0, -1));
    if (error) setError(false);
  }, [error]);

  useEffect(() => {
    if (state !== "locked") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        pushDigit(event.key);
      } else if (event.key === "Backspace") {
        event.preventDefault();
        popDigit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, pushDigit, popDigit]);

  if (state === "checking") return null;
  if (state === "unlocked") return <>{children}</>;

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="pin-gate" role="dialog" aria-modal="true" aria-label="비밀번호 입력">
      <div className="pin-gate__bg" aria-hidden="true">
        <span className="pin-gate__kanji">西門町</span>
      </div>
      <div className="pin-gate__card">
        <header className="pin-gate__head">
          <span className="pin-gate__kicker">Y&amp;S · 西門町 NEON DIARY</span>
          <h1>비밀번호를 입력해 주세요</h1>
          <p>둘만의 일정 · 네 자리 비밀번호</p>
        </header>

        <div
          className={[
            "pin-dots",
            shake ? "pin-dots--shake" : "",
            error ? "pin-dots--error" : ""
          ]
            .filter(Boolean)
            .join(" ")}
          aria-live="polite"
        >
          {Array.from({ length: PIN_LENGTH }).map((_, index) => (
            <span
              key={index}
              className={pin.length > index ? "pin-dot pin-dot--filled" : "pin-dot"}
            />
          ))}
        </div>

        <p className={error ? "pin-gate__msg pin-gate__msg--error" : "pin-gate__msg"}>
          {error ? "비밀번호가 달라요. 다시 입력해 주세요." : " "}
        </p>

        <div className="pin-keypad" role="group" aria-label="숫자 키패드">
          {keys.map((key) => (
            <button
              key={key}
              type="button"
              className="pin-key"
              onClick={() => pushDigit(key)}
            >
              {key}
            </button>
          ))}
          <span className="pin-key pin-key--ghost" aria-hidden="true" />
          <button
            type="button"
            className="pin-key"
            onClick={() => pushDigit("0")}
          >
            0
          </button>
          <button
            type="button"
            className="pin-key pin-key--back"
            onClick={popDigit}
            aria-label="한 자리 지우기"
            disabled={pin.length === 0}
          >
            <Delete size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
