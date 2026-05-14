"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BellOff,
  Camera,
  Check,
  Clock,
  ImagePlus,
  Loader2,
  Navigation,
  Send,
  SkipForward,
  Sparkles,
  Star,
  Trophy
} from "lucide-react";
import { MiniRouteStrip } from "./MapView";
import { categoryIcon } from "./icons";
import { WeatherBar } from "./WeatherBar";
import { TwdKrwLabel } from "./ExpenseDashboard";
import { NextStopEta } from "./NextStopEta";
import { GpsAutoStatus } from "./GpsAutoStatus";
import { NearbyPlaces } from "./NearbyPlaces";
import { PhotoLightbox } from "./PhotoLightbox";
import { useItineraryContext } from "./ItineraryContext";
import {
  categoryColors,
  categoryLabels,
  priorityLabels,
  type StopPlanMeta,
  type TripStop
} from "@/lib/trip-data";
import { getPlan } from "@/lib/itinerary";
import {
  authorLabels,
  combinedRating,
  expenseCategoryLabels,
  expenseMethodLabels,
  expensePayerLabels,
  getStopMemory,
  newCommentId,
  type CommentAuthor,
  type ExpenseCategory,
  type ExpenseMethod,
  type ExpensePayer,
  type Memory,
  type MemoryBook
} from "@/lib/memory-types";

const authorStorageKey = "taipei-trip-comment-author-v1";

function nowHHMM(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function timeToMinutes(time: string): number | null {
  const m = time.match(/^(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

function CompactCapture({
  stop,
  memory,
  onChange
}: {
  stop: TripStop;
  memory: Memory;
  onChange: (patch: Partial<Memory>) => void;
}) {
  const [author, setAuthor] = useState<CommentAuthor>("youngha");
  const [text, setText] = useState("");
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(authorStorageKey);
    if (stored === "youngha" || stored === "sohyun") setAuthor(stored);
  }, []);

  const pickAuthor = (a: CommentAuthor) => {
    setAuthor(a);
    window.localStorage.setItem(authorStorageKey, a);
  };

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onChange({
      comments: [...memory.comments, { id: newCommentId(), author, text: t, at: new Date().toISOString() }]
    });
    setText("");
  };

  async function handleFiles(files: FileList) {
    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("stopId", stop.id);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) break;
        const payload = (await res.json()) as { url?: string };
        if (payload.url) uploaded.push(payload.url);
      }
      if (uploaded.length) onChange({ photos: [...memory.photos, ...uploaded] });
    } finally {
      setUploading(false);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  return (
    <div className="quest-capture">
      <div className="quest-capture__ratings">
        {([
          ["youngha", "영하", memory.ratingY, (v: number) => onChange({ ratingY: v })],
          ["sohyun", "소현", memory.ratingS, (v: number) => onChange({ ratingS: v })]
        ] as const).map(([key, label, value, set]) => (
          <div key={key} className={`quest-rating-row quest-rating-row--${key}`}>
            <span className="quest-rating-row__who">{label}</span>
            <div className="quest-capture__rating">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  className={s <= value ? "quest-star quest-star--on" : "quest-star"}
                  onClick={() => set(s === value ? 0 : s)}
                  aria-label={`${label} ${s}점`}
                >
                  <Star size={18} fill={s <= value ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="quest-capture__comment">
        <div className="quest-capture__who">
          {(["youngha", "sohyun"] as CommentAuthor[]).map((a) => (
            <button
              key={a}
              className={
                author === a
                  ? `comment-who comment-who--${a} comment-who--active`
                  : `comment-who comment-who--${a}`
              }
              onClick={() => pickAuthor(a)}
            >
              {authorLabels[a]}
            </button>
          ))}
        </div>
        <div className="quest-capture__row">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={`${authorLabels[author]} 한 마디...`}
          />
          <button className="comment-send" onClick={submit} disabled={!text.trim()} aria-label="남기기">
            <Send size={14} />
          </button>
        </div>
      </div>
      <div className="quest-capture__expense">
        <label className="quest-expense__amount">
          <span>지출 TWD</span>
          <input
            inputMode="numeric"
            value={memory.expenseAmount ? String(memory.expenseAmount) : ""}
            onChange={(e) => onChange({ expenseAmount: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })}
            placeholder="0"
          />
        </label>
        <select
          value={memory.expenseCategory}
          onChange={(e) => onChange({ expenseCategory: e.target.value as ExpenseCategory })}
          aria-label="지출 분류"
        >
          {(Object.keys(expenseCategoryLabels) as ExpenseCategory[]).map((c) => (
            <option key={c} value={c}>{c === "none" ? "분류" : expenseCategoryLabels[c]}</option>
          ))}
        </select>
        <select
          value={memory.expensePayer}
          onChange={(e) => onChange({ expensePayer: e.target.value as ExpensePayer })}
          aria-label="결제자"
        >
          {(Object.keys(expensePayerLabels) as ExpensePayer[]).map((p) => (
            <option key={p} value={p}>{p === "none" ? "결제자" : expensePayerLabels[p]}</option>
          ))}
        </select>
        <select
          value={memory.expenseMethod}
          onChange={(e) => onChange({ expenseMethod: e.target.value as ExpenseMethod })}
          aria-label="결제 수단"
        >
          {(Object.keys(expenseMethodLabels) as ExpenseMethod[]).map((m) => (
            <option key={m} value={m}>{expenseMethodLabels[m]}</option>
          ))}
        </select>
      </div>
      <div className="quest-capture__photo">
        <div className="quest-photo-actions">
          <button
            className="quest-photo-btn quest-photo-btn--camera"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={14} className="weather-bar__spinner" /> : <Camera size={14} />}
            {uploading ? "올리는 중…" : " 사진 찍기"}
          </button>
          <button
            className="quest-photo-btn quest-photo-btn--gallery"
            onClick={() => galleryInputRef.current?.click()}
            disabled={uploading}
            aria-label="갤러리에서 선택"
          >
            <ImagePlus size={14} />
            갤러리
          </button>
        </div>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            if (e.target.files && e.target.files.length) void handleFiles(e.target.files);
          }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files && e.target.files.length) void handleFiles(e.target.files);
          }}
        />
        {memory.photos.length > 0 && (
          <div className="quest-photo-strip">
            {memory.photos.slice(-4).map((url, i) => {
              const realIndex = memory.photos.length - Math.min(4, memory.photos.length) + i;
              return (
                <button
                  key={`${url}-${i}`}
                  type="button"
                  className="quest-photo-strip__cell"
                  onClick={() => setLightboxIndex(realIndex)}
                  aria-label={`사진 ${realIndex + 1} 크게 보기`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`photo-${realIndex + 1}`} loading="lazy" />
                </button>
              );
            })}
            {memory.photos.length > 4 && (
              <button
                type="button"
                className="quest-photo-strip__more"
                onClick={() => setLightboxIndex(0)}
              >
                +{memory.photos.length - 4}
              </button>
            )}
          </div>
        )}
      </div>
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={memory.photos}
          startIndex={lightboxIndex}
          caption={stop.title}
          onClose={() => setLightboxIndex(null)}
        />
      )}
      {memory.comments.length > 0 && (
        <div className="quest-capture__log">
          {memory.comments.slice(-3).map((c) => (
            <span key={c.id} className={`quest-comment quest-comment--${c.author}`}>
              <b>{authorLabels[c.author]}</b> {c.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const notifyStorageKey = "taipei-trip-quest-notify-v1";

const dirUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
const transitUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=transit`;
const nearUrl = (query: string, lat: number, lng: number) =>
  `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lng},16z`;

export function TodayMode({
  activeStop: _activeStop,
  memoryBook,
  todayTripDay,
  onSelectStop,
  onUpdateMemory
}: {
  activeStop: TripStop;
  memoryBook: MemoryBook;
  todayTripDay: number | null;
  onSelectStop: (stop: TripStop) => void;
  onUpdateMemory: (stopId: string, patch: Partial<Memory>) => void;
}) {
  const { snapshot } = useItineraryContext();
  const stops = snapshot.stops;
  const days = snapshot.days;
  const [clock, setClock] = useState(() => new Date());
  const [toast, setToast] = useState<{ id: number; text: string; type: "done" | "skip" } | null>(null);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifySupported, setNotifySupported] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedNotifsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const supported = "Notification" in window;
    setNotifySupported(supported);
    if (supported && window.localStorage.getItem(notifyStorageKey) === "1" && Notification.permission === "granted") {
      setNotifyEnabled(true);
    }
  }, []);

  const toggleNotify = async () => {
    if (notifyEnabled) {
      setNotifyEnabled(false);
      window.localStorage.setItem(notifyStorageKey, "0");
      return;
    }
    if (typeof Notification === "undefined") return;
    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    if (perm === "granted") {
      setNotifyEnabled(true);
      window.localStorage.setItem(notifyStorageKey, "1");
    }
  };

  const flash = (text: string, type: "done" | "skip") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ id: Date.now(), text, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 2700);
  };

  const memOf = (id: string) => getStopMemory(memoryBook, id);
  const isCleared = (s: TripStop) => {
    const st = memOf(s.id).status;
    return st === "done" || st === "skipped";
  };
  const currentIndex = stops.findIndex((s) => !isCleared(s));
  const currentQuest: TripStop | null = currentIndex >= 0 ? stops[currentIndex] : null;
  const nextQuest: TripStop | null = currentIndex >= 0 ? stops[currentIndex + 1] ?? null : null;
  const doneCount = stops.filter((s) => memOf(s.id).status === "done").length;
  const skippedCount = stops.filter((s) => memOf(s.id).status === "skipped").length;
  const allComplete = currentQuest === null;

  // Keep the parent's active stop in sync with the quest (so other modes show it).
  const lastSyncedRef = useRef<string | null>(null);
  useEffect(() => {
    const target = currentQuest ?? stops[stops.length - 1] ?? null;
    if (target && lastSyncedRef.current !== target.id) {
      onSelectStop(target);
      lastSyncedRef.current = target.id;
    }
  }, [currentQuest, stops, onSelectStop]);

  // Most-recently fully-cleared day, if there's still progress to make beyond it.
  const fullyClearedDay = (() => {
    if (!currentQuest) return Math.max(...days.map((d) => d.day));
    const sorted = days.map((d) => d.day).sort((a, b) => a - b);
    let best: number | null = null;
    for (const d of sorted) {
      if (d >= currentQuest.day) break;
      const dayStops = stops.filter((s) => s.day === d);
      if (dayStops.length > 0 && dayStops.every(isCleared)) best = d;
    }
    return best;
  })();

  const completeQuest = (stop: TripStop) => {
    onUpdateMemory(stop.id, { status: "done", visited: true });
    const remaining = stops.filter((s) => !isCleared(s) && s.id !== stop.id);
    const dayWrap = stops.filter((s) => s.day === stop.day).every((s) => s.id === stop.id || isCleared(s));
    flash(
      remaining.length === 0
        ? `🇹🇼 여정 완료! ${stop.title} 까지 완주`
        : dayWrap
          ? `🏆 Day ${stop.day} 클리어! · ${stop.title}`
          : `🎉 ${stop.title} 클리어!`,
      "done"
    );
  };
  const skipQuest = (stop: TripStop) => {
    onUpdateMemory(stop.id, { status: "skipped" });
    flash(`⏭ 스킵: ${stop.title}`, "skip");
  };

  const currentPlan: StopPlanMeta | null = currentQuest ? getPlan(snapshot.plans, currentQuest.id) : null;
  const currentMemory = currentQuest ? memOf(currentQuest.id) : null;

  // Schedule-vs-now hint for the current quest.
  let scheduleHint: { text: string; tone: "ontime" | "behind" | "ahead" } | null = null;
  if (currentQuest) {
    const sched = timeToMinutes(currentQuest.time);
    if (sched !== null) {
      const nowM = clock.getHours() * 60 + clock.getMinutes();
      const diff = nowM - sched;
      if (diff > 20) scheduleHint = { text: `예정보다 ${Math.round(diff / 5) * 5}분쯤 늦음`, tone: "behind" };
      else if (diff < -30) scheduleHint = { text: `예정보다 ${Math.round(-diff / 5) * 5}분쯤 이름`, tone: "ahead" };
      else scheduleHint = { text: "거의 일정대로", tone: "ontime" };
    }
  }

  const todaySpend = stops
    .filter((s) => currentQuest && s.day === currentQuest.day)
    .reduce((sum, s) => sum + memOf(s.id).expenseAmount, 0);

  // ── Schedule reminder: how soon is the next quest's scheduled time? ──
  const nowMinutes = clock.getHours() * 60 + clock.getMinutes();
  let reminder: { text: string; soon: boolean } | null = null;
  if (nextQuest && todayTripDay === nextQuest.day) {
    const sched = timeToMinutes(nextQuest.time);
    if (sched !== null) {
      const until = sched - nowMinutes;
      if (until > 0 && until <= 45) {
        reminder = { text: `⏰ 다음 일정 ${nextQuest.time} · ${nextQuest.title} — ${until}분 후`, soon: until <= 15 };
      } else if (until <= 0 && until > -25) {
        reminder = { text: `⏰ ${nextQuest.title}(${nextQuest.time}) 시간 됐어요`, soon: true };
      }
    }
  }

  // Fire a browser notification when an upcoming quest's scheduled time arrives (app must be open).
  useEffect(() => {
    if (!notifyEnabled || todayTripDay === null) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const now = clock.getHours() * 60 + clock.getMinutes();
    for (const s of stops) {
      if (s.day !== todayTripDay) continue;
      if (isCleared(s)) continue;
      const sched = timeToMinutes(s.time);
      if (sched === null) continue;
      const diff = now - sched; // 0 .. 1 means it just arrived
      if (diff >= 0 && diff <= 1 && !firedNotifsRef.current.has(s.id)) {
        firedNotifsRef.current.add(s.id);
        try {
          new Notification("Y & S Taipei — 다음 일정", { body: `${s.time} · ${s.title}`, tag: `quest-${s.id}` });
        } catch {
          /* notifications may be blocked at the OS level */
        }
      }
    }
  }, [clock, notifyEnabled, todayTripDay, stops, memoryBook]);

  return (
    <div className="journey-stage">
      {toast && (
        <div key={toast.id} className={`quest-toast quest-toast--${toast.type}`} role="status">
          {toast.text}
        </div>
      )}
      {reminder && (
        <div className={reminder.soon ? "quest-reminder quest-reminder--soon" : "quest-reminder"}>
          {reminder.text}
        </div>
      )}

      {/* ── Today pulse: today-only rail + big countdown ── */}
      {todayTripDay !== null && (() => {
        const day = days.find((d) => d.day === todayTripDay);
        const todayStops = stops.filter((s) => s.day === todayTripDay);
        if (todayStops.length === 0) return null;
        const nowM = clock.getHours() * 60 + clock.getMinutes();
        const nextScheduled = todayStops.find((s) => {
          if (isCleared(s)) return false;
          const m = timeToMinutes(s.time);
          return m !== null && m >= nowM;
        }) ?? null;
        const passedNext = todayStops.find((s) => {
          if (isCleared(s)) return false;
          const m = timeToMinutes(s.time);
          return m !== null && m < nowM;
        }) ?? null;
        const focus = nextScheduled ?? passedNext;
        const focusM = focus ? timeToMinutes(focus.time) : null;
        const focusDelta = focusM !== null ? focusM - nowM : null;
        const fmtMins = (mins: number) => {
          const abs = Math.abs(mins);
          if (abs < 60) return `${abs}분`;
          const h = Math.floor(abs / 60);
          const m = abs % 60;
          return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
        };
        return (
          <section className="today-pulse" aria-label="오늘 흐름">
            <header className="today-pulse__head">
              <span className="today-pulse__day">
                DAY {todayTripDay}
                {day?.date && <em>· {day.date}</em>}
              </span>
              <span className="today-pulse__clock">
                <Clock size={12} /> {nowHHMM(clock)}
              </span>
            </header>
            <ol className="today-pulse__rail" role="list">
              {todayStops.map((s) => {
                const st = memOf(s.id).status;
                const isCurrent = currentQuest?.id === s.id;
                const isFocus = focus?.id === s.id;
                const cls = [
                  "today-pulse__cell",
                  st === "done" && "today-pulse__cell--done",
                  st === "skipped" && "today-pulse__cell--skip",
                  isCurrent && "today-pulse__cell--current",
                  isFocus && !isCurrent && "today-pulse__cell--focus"
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={cls}
                      onClick={() => onSelectStop(s)}
                      title={`${s.time} ${s.title}`}
                    >
                      <span className="today-pulse__time">{s.time || "—"}</span>
                      <span
                        className="today-pulse__dot"
                        style={{ ["--cat" as string]: categoryColors[s.category] }}
                        aria-hidden="true"
                      >
                        {st === "done" ? (
                          <Check size={11} />
                        ) : st === "skipped" ? (
                          <SkipForward size={11} />
                        ) : (
                          categoryIcon(s.category, 11)
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            {focus && focusDelta !== null && (
              <button
                type="button"
                className={
                  "today-pulse__next" +
                  (focusDelta < 0
                    ? " today-pulse__next--late"
                    : focusDelta <= 15
                      ? " today-pulse__next--soon"
                      : "")
                }
                onClick={() => onSelectStop(focus)}
              >
                <span className="today-pulse__next-label">
                  {focusDelta < 0 ? "예정 지난 다음" : "다음까지"}
                </span>
                <strong className="today-pulse__countdown">
                  {focusDelta < 0 ? `${fmtMins(focusDelta)} 지남` : `${fmtMins(focusDelta)} 후`}
                </strong>
                <span className="today-pulse__next-stop">
                  {focus.time} · {focus.title}
                </span>
              </button>
            )}
            {!focus && (
              <div className="today-pulse__next today-pulse__next--done">
                <strong>오늘 일정 끝 — 푹 쉬어요 🍻</strong>
              </div>
            )}
          </section>
        );
      })()}

      {/* ── Progress / timeline ── */}
      <section className="journey-progress">
        <div className="journey-progress__head">
          <span>여정</span>
          <strong>
            {doneCount}
            <small> / {stops.length} 클리어</small>
          </strong>
          {skippedCount > 0 && <em>{skippedCount} 스킵</em>}
          <span className="journey-progress__clock">
            <Clock size={13} /> {nowHHMM(clock)}
          </span>
        </div>
        <div className="journey-progress__bar">
          <div
            className="journey-progress__fill"
            style={{ width: `${stops.length ? (doneCount / stops.length) * 100 : 0}%` }}
          />
        </div>
        <div className="journey-timeline">
          {days.map((day) => {
            const dayStops = stops.filter((s) => s.day === day.day);
            const allDayCleared = dayStops.length > 0 && dayStops.every(isCleared);
            return (
              <div key={day.day} className={allDayCleared ? "journey-day journey-day--done" : "journey-day"}>
                <span className="journey-day__label">
                  Day {day.day}
                  {allDayCleared && <Check size={10} />}
                </span>
                <div className="journey-dots">
                  {dayStops.map((s) => {
                    const st = memOf(s.id).status;
                    const isCurrent = currentQuest?.id === s.id;
                    const cls = isCurrent
                      ? "journey-dot journey-dot--current"
                      : st === "done"
                        ? "journey-dot journey-dot--done"
                        : st === "skipped"
                          ? "journey-dot journey-dot--skipped"
                          : st === "going"
                            ? "journey-dot journey-dot--going"
                            : "journey-dot";
                    return (
                      <button
                        key={s.id}
                        className={cls}
                        title={`${s.time} ${s.title}`}
                        onClick={() => onSelectStop(s)}
                        aria-label={`${s.time} ${s.title}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Day-clear celebration ── */}
      {fullyClearedDay !== null && (
        <div className={allComplete ? "journey-celebrate journey-celebrate--final" : "journey-celebrate"}>
          <Trophy size={18} />
          {allComplete ? (
            <strong>🇹🇼 여정 완료! · {doneCount}개 스톱 완주</strong>
          ) : (
            <strong>🇹🇼 Day {fullyClearedDay} 클리어! · {days.find((d) => d.day === fullyClearedDay)?.title}</strong>
          )}
        </div>
      )}

      {/* ── Current quest ── */}
      {currentQuest && currentPlan && currentMemory ? (
        <section className="quest-card">
          <header className="quest-card__head">
            <span className="quest-card__eyebrow">
              현재 퀘스트 · Day {currentQuest.day}
              {scheduleHint && <em className={`quest-hint quest-hint--${scheduleHint.tone}`}>{scheduleHint.text}</em>}
            </span>
            <h2>
              <span
                className="quest-card__cat"
                style={{ ["--cat" as string]: categoryColors[currentQuest.category] }}
              >
                {categoryIcon(currentQuest.category, 16)}
              </span>
              {currentQuest.title}
            </h2>
            <p>
              <span className="quest-card__time">{currentQuest.time} 예정</span> · {currentQuest.subtitle}
            </p>
            {currentQuest.nameZh && (
              <div className="quest-card__local">
                <span className="quest-card__zh">{currentQuest.nameZh}</span>
                {currentQuest.mrt && <span className="quest-card__mrt">MRT · {currentQuest.mrt}</span>}
                {currentQuest.phrase && (
                  <button
                    type="button"
                    className="quest-card__phrase"
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        void navigator.clipboard.writeText(currentQuest.phrase);
                      }
                    }}
                    title="복사"
                  >
                    <span className="quest-card__phrase-zh">{currentQuest.phrase}</span>
                    {currentQuest.phrasePron && (
                      <em className="quest-card__phrase-pron">{currentQuest.phrasePron}</em>
                    )}
                    {currentQuest.phraseHint && (
                      <em className="quest-card__phrase-ko">{currentQuest.phraseHint}</em>
                    )}
                  </button>
                )}
              </div>
            )}
          </header>

          <div className="quest-objective">
            <Sparkles size={16} />
            <div>
              <span>목표</span>
              <p>{currentQuest.prompt}</p>
            </div>
            <span className={`priority-badge priority-badge--${currentPlan.priority}`}>
              {priorityLabels[currentPlan.priority]}
            </span>
          </div>

          <CompactCapture
            stop={currentQuest}
            memory={currentMemory}
            onChange={(patch) => onUpdateMemory(currentQuest.id, patch)}
          />

          <div className="quest-actions">
            <button className="quest-skip" onClick={() => skipQuest(currentQuest)}>
              <SkipForward size={15} />
              스킵
            </button>
            <button className="quest-complete" onClick={() => completeQuest(currentQuest)}>
              <Check size={18} />
              완료 — 다음 퀘스트로
            </button>
          </div>

          <div className="quest-nav">
            <div className="quest-maps-row">
              <a
                className="quest-maps"
                href={dirUrl(currentQuest.lat, currentQuest.lng)}
                target="_blank"
                rel="noreferrer"
              >
                <Navigation size={14} />
                길찾기 (도보)
              </a>
              <a
                className="quest-maps quest-maps--transit"
                href={transitUrl(currentQuest.lat, currentQuest.lng)}
                target="_blank"
                rel="noreferrer"
              >
                🚇 대중교통(MRT)
              </a>
            </div>
            <div className="quest-near">
              {[
                { q: "화장실", label: "🚻 화장실" },
                { q: "편의점", label: "🏪 편의점" },
                { q: "ATM", label: "🏧 ATM" },
                { q: "약국", label: "💊 약국" }
              ].map(({ q, label }) => (
                <a
                  key={q}
                  href={nearUrl(q, currentQuest.lat, currentQuest.lng)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          <NearbyPlaces lat={currentQuest.lat} lng={currentQuest.lng} />
        </section>
      ) : (
        <section className="quest-card quest-card--done">
          <Trophy size={28} />
          <h2>모든 퀘스트 완료 🇹🇼</h2>
          <p>23개 스톱 여정을 끝냈어요. 회고 모드에서 정리하고 PDF 사진북을 만들어보세요.</p>
        </section>
      )}

      {/* ── Next quest preview ── */}
      {nextQuest && (
        <section className="quest-next">
          <div className="quest-next__head">
            <span>다음 퀘스트</span>
            <strong>{nextQuest.time} · {nextQuest.title}</strong>
          </div>
          <p>{nextQuest.subtitle}</p>
          {currentQuest && <MiniRouteStrip from={currentQuest} to={nextQuest} />}
          {currentQuest && <NextStopEta from={currentQuest} to={nextQuest} />}
          <div className="quest-next__meta">
            {nextQuest.mrt && <span>MRT · {nextQuest.mrt}</span>}
            {nextQuest.phrase && (
              <button
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    void navigator.clipboard.writeText(nextQuest.phrase);
                  }
                }}
              >
                {nextQuest.phrase}
                {nextQuest.phrasePron && <em className="quest-next__phrase-pron">{nextQuest.phrasePron}</em>}
                {nextQuest.phraseHint && <em className="quest-next__phrase-ko">{nextQuest.phraseHint}</em>}
              </button>
            )}
          </div>
          <div className="quest-next__actions">
            <a
              className="quest-next__dir"
              href={dirUrl(nextQuest.lat, nextQuest.lng)}
              target="_blank"
              rel="noreferrer"
            >
              <Navigation size={13} />
              도보
            </a>
            <a
              className="quest-next__dir quest-next__dir--transit"
              href={transitUrl(nextQuest.lat, nextQuest.lng)}
              target="_blank"
              rel="noreferrer"
            >
              🚇 MRT
            </a>
            <button className="quest-next__jump" onClick={() => onSelectStop(nextQuest)}>
              미리 보기 →
            </button>
          </div>
        </section>
      )}

      {/* ── Weather + today's spend ── */}
      <section className="journey-side">
        <div className="journey-side__weather">
          <WeatherBar coords={currentQuest ? { lat: currentQuest.lat, lng: currentQuest.lng } : undefined} />
        </div>
        {currentQuest && (
          <div className="journey-side__spend">
            <span>오늘 (Day {currentQuest.day}) 지출</span>
            <strong>TWD {todaySpend.toLocaleString()}</strong>
            <TwdKrwLabel twd={todaySpend} />
          </div>
        )}
      </section>

      {/* ── GPS auto-advance + schedule notifications ── */}
      <GpsAutoStatus
        memoryBook={memoryBook}
        onUpdateMemory={onUpdateMemory}
        onSelectStop={onSelectStop}
      />
      <div className={notifyEnabled ? "quest-notify quest-notify--on" : "quest-notify"}>
        <header>
          {notifyEnabled ? <Bell size={16} /> : <BellOff size={16} />}
          <strong>일정 알림</strong>
          {notifySupported ? (
            <label className="quest-notify__toggle">
              <input type="checkbox" checked={notifyEnabled} onChange={() => void toggleNotify()} />
              <span>{notifyEnabled ? "켜짐" : "꺼짐"}</span>
            </label>
          ) : (
            <span className="quest-notify__na">미지원</span>
          )}
        </header>
        <p>
          {!notifySupported
            ? "이 브라우저는 알림을 지원하지 않아요. 아이폰은 '홈 화면에 추가'(설치)한 뒤 열면 알림을 켤 수 있고, 안드로이드 Chrome은 바로 됩니다. (인앱 리마인더 배너는 어디서나 떠요.)"
            : notifyEnabled
              ? "여행 당일, 스톱 예정 시각이 되면 알림이 떠요 — 앱(탭)이 열려있을 때."
              : "켜면 스톱 예정 시각에 브라우저 알림. 권한 요청이 한 번 떠요."}
        </p>
      </div>

      {/* ── Journey log ── */}
      <section className="journey-log">
        <header>
          <Check size={15} />
          <strong>여정 로그</strong>
          <span>{doneCount + skippedCount}개 클리어</span>
        </header>
        <div className="journey-log__list">
          {stops.filter(isCleared).length === 0 && (
            <div className="journey-log__empty">아직 깬 퀘스트가 없어요. 첫 퀘스트를 완료해보세요.</div>
          )}
          {stops
            .filter(isCleared)
            .slice()
            .reverse()
            .map((s) => {
              const m = memOf(s.id);
              return (
                <button key={s.id} className="journey-log__item" onClick={() => onSelectStop(s)}>
                  <span className={m.status === "skipped" ? "journey-log__badge journey-log__badge--skip" : "journey-log__badge"}>
                    {m.status === "skipped" ? "스킵" : <Check size={12} />}
                  </span>
                  <span className="journey-log__main">
                    <strong>{s.time} {s.title}</strong>
                    <small>
                      Day {s.day} · {categoryLabels[s.category]}
                      {combinedRating(m) > 0 && ` · ★ ${combinedRating(m)}`}
                      {m.comments.length > 0 && ` · 💬${m.comments.length}`}
                      {m.photos.length > 0 && ` · 📷${m.photos.length}`}
                      {m.expenseAmount > 0 && ` · TWD ${m.expenseAmount.toLocaleString()}`}
                    </small>
                  </span>
                </button>
              );
            })}
        </div>
      </section>
    </div>
  );
}
