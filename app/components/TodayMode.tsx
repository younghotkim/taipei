"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  Clock,
  Loader2,
  MapPin,
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
  getStopMemory,
  newCommentId,
  type CommentAuthor,
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

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
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="quest-capture">
      <div className="quest-capture__rating">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            className={s <= memory.rating ? "quest-star quest-star--on" : "quest-star"}
            onClick={() => onChange({ rating: s })}
            aria-label={`${s}점`}
          >
            <Star size={20} fill={s <= memory.rating ? "currentColor" : "none"} />
          </button>
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
      <div className="quest-capture__photo">
        <button
          className="quest-photo-btn"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 size={14} className="weather-bar__spinner" /> : <Camera size={14} />}
          {uploading ? "올리는 중…" : memory.photos.length > 0 ? `사진 ${memory.photos.length}장 · 추가` : "사진 추가"}
        </button>
        <input
          ref={inputRef}
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
            {memory.photos.slice(-4).map((url, i) => (
              <img key={i} src={url} alt={`photo-${i}`} loading="lazy" />
            ))}
          </div>
        )}
      </div>
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

export function TodayMode({
  activeStop: _activeStop,
  memoryBook,
  onSelectStop,
  onUpdateMemory
}: {
  activeStop: TripStop;
  memoryBook: MemoryBook;
  onSelectStop: (stop: TripStop) => void;
  onUpdateMemory: (stopId: string, patch: Partial<Memory>) => void;
}) {
  const { snapshot } = useItineraryContext();
  const stops = snapshot.stops;
  const days = snapshot.days;
  const [clock, setClock] = useState(() => new Date());
  const [toast, setToast] = useState<{ id: number; text: string; type: "done" | "skip" } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

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

  return (
    <div className="journey-stage">
      {toast && (
        <div key={toast.id} className={`quest-toast quest-toast--${toast.type}`} role="status">
          {toast.text}
        </div>
      )}
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
                    {currentQuest.phrase}
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

          <a
            className="quest-maps"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentQuest.mapsQuery)}`}
            target="_blank"
            rel="noreferrer"
          >
            <MapPin size={14} />
            Google Maps에서 길찾기
          </a>
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
              </button>
            )}
          </div>
          <button className="quest-next__jump" onClick={() => onSelectStop(nextQuest)}>
            미리 보기 →
          </button>
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

      {/* ── GPS auto-advance ── */}
      <GpsAutoStatus
        memoryBook={memoryBook}
        onUpdateMemory={onUpdateMemory}
        onSelectStop={onSelectStop}
      />

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
                      {m.rating > 0 && ` · ${"★".repeat(m.rating)}`}
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
