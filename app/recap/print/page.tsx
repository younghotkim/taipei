"use client";

import "./print.css";
import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { TaiwanFlag } from "../../components/TaiwanFlag";
import {
  categoryColors,
  categoryLabels,
  priorityLabels
} from "@/lib/trip-data";
import { getPlan } from "@/lib/itinerary";
import { useItinerary } from "@/lib/use-itinerary";
import {
  authorLabels,
  emptyMemory,
  getStopMemory,
  isMemoryBook,
  normalizeMemory,
  type Memory,
  type MemoryBook
} from "@/lib/memory-types";

const storageKey = "taipei-trip-memory-book-v1";

const statusLabels: Record<Memory["status"], string> = {
  planned: "예정",
  going: "가는 중",
  done: "완료",
  skipped: "스킵"
};

export default function RecapPrintPage() {
  const { snapshot } = useItinerary();
  const tripStops = snapshot.stops;
  const tripDays = snapshot.days;
  const plans = snapshot.plans;
  const [memoryBook, setMemoryBook] = useState<MemoryBook>({});
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as unknown;
        if (isMemoryBook(parsed)) {
          setMemoryBook(parsed);
        }
      } catch {
        /* ignore */
      }
    }
    void fetch("/api/memories")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { memories?: unknown } | null) => {
        if (payload && isMemoryBook(payload.memories)) {
          const remote = payload.memories;
          setMemoryBook((current) => ({ ...current, ...remote }));
        }
      })
      .catch(() => {});
    void fetch("/api/exchange?from=TWD&to=KRW")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { rate?: number } | null) => {
        if (typeof payload?.rate === "number") setExchangeRate(payload.rate);
      })
      .catch(() => {});
  }, []);

  const totalSpent = tripStops.reduce(
    (sum, stop) => sum + getStopMemory(memoryBook, stop.id).expenseAmount,
    0
  );
  const stopsByDay = tripDays.map((day) => ({
    day,
    stops: tripStops.filter((stop) => stop.day === day.day)
  }));

  return (
    <main className="print-shell">
      <div className="print-toolbar">
        <button onClick={() => window.print()}>
          <Printer size={14} />
          인쇄 / PDF 저장
        </button>
        <small>브라우저 인쇄 대화상자에서 “PDF로 저장”을 선택하세요.</small>
      </div>

      <section className="print-cover">
        <header>
          <TaiwanFlag className="print-flag" />
          <div>
            <h1>台北 Y &amp; S Trip Diary</h1>
            <p>5/15 — 5/18 · 西門町 NEON DIARY</p>
          </div>
        </header>
        <div className="print-cover__stats">
          <div>
            <span>총 스톱</span>
            <strong>{tripStops.length}</strong>
          </div>
          <div>
            <span>총 지출 (TWD)</span>
            <strong>{totalSpent.toLocaleString()}</strong>
            {exchangeRate && (
              <small>≈ ₩{Math.round(totalSpent * exchangeRate).toLocaleString()}</small>
            )}
          </div>
          <div>
            <span>완료한 스톱</span>
            <strong>
              {tripStops.filter((stop) => getStopMemory(memoryBook, stop.id).visited).length}
            </strong>
          </div>
        </div>
      </section>

      {stopsByDay.map(({ day, stops }) => (
        <section key={day.day} className="print-day">
          <header>
            <span>Day {day.day}</span>
            <h2>{day.title}</h2>
            <p>{day.summary}</p>
          </header>
          {stops.map((stop) => {
            const memory = normalizeMemory(getStopMemory(memoryBook, stop.id) ?? emptyMemory());
            const plan = getPlan(plans, stop.id);
            return (
              <article key={stop.id} className="print-stop">
                <header>
                  <span
                    className="print-stop__cat"
                    style={{ background: categoryColors[stop.category] }}
                  >
                    {categoryLabels[stop.category]}
                  </span>
                  <strong>{stop.time}</strong>
                  <h3>{stop.title}</h3>
                  <small>{stop.nameZh}</small>
                </header>
                <p className="print-stop__sub">{stop.subtitle}</p>
                <div className="print-stop__meta">
                  <span>{priorityLabels[plan.priority]} · {plan.durationMinutes}분</span>
                  <span>{stop.mrt}</span>
                  <span>{statusLabels[memory.status]}</span>
                  {memory.rating > 0 && <span>{"★".repeat(memory.rating)}</span>}
                  {memory.expenseAmount > 0 && (
                    <span>TWD {memory.expenseAmount.toLocaleString()}</span>
                  )}
                </div>
                {(memory.note || memory.comments.length > 0) && (
                  <div className="print-stop__notes">
                    {memory.note && <p>{memory.note}</p>}
                    {memory.comments.map((c) => (
                      <p
                        key={c.id}
                        className={c.author === "youngha" ? "print-stop__y" : "print-stop__s"}
                      >
                        {authorLabels[c.author]} · {c.text}
                      </p>
                    ))}
                  </div>
                )}
                {memory.photos.length > 0 && (
                  <div className="print-stop__photos">
                    {memory.photos.slice(0, 6).map((url, index) => (
                      <img key={index} src={url} alt={`${stop.title}-${index}`} />
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      ))}
    </main>
  );
}
