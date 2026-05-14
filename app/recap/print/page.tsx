"use client";

import "./print.css";
import { useEffect, useMemo, useState } from "react";
import { Check, Link2, Printer, Sparkles } from "lucide-react";
import { TaiwanFlag } from "../../components/TaiwanFlag";
import { PhotoLightbox } from "../../components/PhotoLightbox";
import {
  categoryColors,
  categoryLabels,
  type TripStop
} from "@/lib/trip-data";
import { useItinerary } from "@/lib/use-itinerary";
import { normalizeLedger } from "@/lib/expense-ledger";
import {
  authorLabels,
  combinedRating,
  emptyMemory,
  getStopMemory,
  isMemoryBook,
  normalizeMemory,
  type Memory,
  type MemoryBook
} from "@/lib/memory-types";

const storageKey = "taipei-trip-memory-book-v1";

function stopHasStory(memory: Memory): boolean {
  return Boolean(
    memory.note.trim() ||
      memory.comments.length > 0 ||
      memory.photos.length > 0 ||
      memory.photoUrl ||
      combinedRating(memory) > 0
  );
}

type FlatPhoto = { url: string; stop: TripStop };

export default function RecapPrintPage() {
  const { snapshot } = useItinerary();
  const tripStops = snapshot.stops;
  const tripDays = snapshot.days;
  const [memoryBook, setMemoryBook] = useState<MemoryBook>({});
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [onlyWritten, setOnlyWritten] = useState(true);
  const [copied, setCopied] = useState(false);
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number; caption?: string } | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as unknown;
        if (isMemoryBook(parsed)) setMemoryBook(parsed);
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
    void fetch("/api/expenses")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { entries?: unknown } | null) => {
        if (payload) setLedgerTotal(normalizeLedger(payload.entries).reduce((s, e) => s + e.amount, 0));
      })
      .catch(() => {});
  }, []);

  const stopsByDay = useMemo(
    () =>
      tripDays.map((day) => ({
        day,
        stops: tripStops.filter((stop) => stop.day === day.day)
      })),
    [tripDays, tripStops]
  );

  // Flatten all photos (in stop / day order) for the cover collage and lightbox sequencing.
  const allPhotos = useMemo<FlatPhoto[]>(() => {
    const acc: FlatPhoto[] = [];
    for (const { stops } of stopsByDay) {
      for (const stop of stops) {
        const m = normalizeMemory(getStopMemory(memoryBook, stop.id) ?? emptyMemory());
        for (const url of m.photos) acc.push({ url, stop });
      }
    }
    return acc;
  }, [stopsByDay, memoryBook]);

  const totalSpent =
    tripStops.reduce((sum, stop) => sum + getStopMemory(memoryBook, stop.id).expenseAmount, 0) + ledgerTotal;
  const totalPhotos = allPhotos.length;
  const totalComments = tripStops.reduce(
    (sum, stop) => sum + getStopMemory(memoryBook, stop.id).comments.length,
    0
  );
  const doneCount = tripStops.filter(
    (stop) => getStopMemory(memoryBook, stop.id).status === "done"
  ).length;

  // Cover hero — up to 5 photos arranged as a mosaic.
  const coverPhotos = allPhotos.slice(0, 5).map((entry) => entry.url);

  // ── Highlights (lightweight version of RecapWrapped) ──
  const entries = tripStops.map((stop) => ({ stop, memory: getStopMemory(memoryBook, stop.id) }));
  const ratedEntries = entries.filter((e) => combinedRating(e.memory) > 0);
  const bestStop = ratedEntries.reduce<typeof ratedEntries[number] | null>(
    (best, cur) => (best === null || combinedRating(cur.memory) > combinedRating(best.memory) ? cur : best),
    null
  );
  const yFav = entries
    .filter((e) => e.memory.ratingY > 0)
    .reduce<typeof entries[number] | null>(
      (best, cur) => (best === null || cur.memory.ratingY > best.memory.ratingY ? cur : best),
      null
    );
  const sFav = entries
    .filter((e) => e.memory.ratingS > 0)
    .reduce<typeof entries[number] | null>(
      (best, cur) => (best === null || cur.memory.ratingS > best.memory.ratingS ? cur : best),
      null
    );
  // Longest single comment as the "둘이 남긴 한마디" — most likely to be quotable.
  const topComment = entries
    .flatMap((e) => e.memory.comments.map((c) => ({ stop: e.stop, comment: c })))
    .reduce<{ stop: TripStop; comment: { author: "youngha" | "sohyun"; text: string; id: string; at: string } } | null>(
      (best, cur) => (best === null || cur.comment.text.length > best.comment.text.length ? cur : best),
      null
    );

  const hasAnyMemory = totalPhotos > 0 || totalComments > 0 || doneCount > 0 || ratedEntries.length > 0;

  const copyShareLink = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard may be blocked */
    }
  };

  // Build the lightbox sequence per call — uses the full flat list so swiping crosses stops naturally.
  const openLightbox = (url: string, caption?: string) => {
    const idx = allPhotos.findIndex((entry) => entry.url === url);
    if (idx < 0) return;
    setLightbox({
      photos: allPhotos.map((entry) => entry.url),
      index: idx,
      caption: caption ?? allPhotos[idx].stop.title
    });
  };

  return (
    <main className="book-shell">
      <div className="book-toolbar">
        <button onClick={() => window.print()}>
          <Printer size={14} />
          PDF로 저장 / 인쇄
        </button>
        <button onClick={() => void copyShareLink()}>
          {copied ? <Check size={14} /> : <Link2 size={14} />}
          {copied ? "복사됨" : "링크 복사"}
        </button>
        <label className="book-toolbar__toggle">
          <input
            type="checkbox"
            checked={onlyWritten}
            onChange={(e) => setOnlyWritten(e.target.checked)}
          />
          <span>기록 있는 stop만</span>
        </label>
        <small>잠금 없이 공유 가능한 페이지입니다.</small>
      </div>

      <section className="book-cover">
        {coverPhotos.length > 0 ? (
          <div className={`book-cover__mosaic book-cover__mosaic--${coverPhotos.length}`}>
            {coverPhotos.map((url, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={`${url}-${index}`} src={url} alt={`cover-${index + 1}`} loading="lazy" />
            ))}
            <div className="book-cover__veil" aria-hidden="true" />
          </div>
        ) : (
          <div className="book-cover__placeholder" aria-hidden="true" />
        )}

        <div className="book-cover__inner">
          <header className="book-cover__head">
            <TaiwanFlag className="book-cover__flag" />
            <span className="book-cover__kicker">西門町 NEON DIARY</span>
          </header>
          <h1 className="book-cover__title">
            Y &amp; S<br />
            <em>Taipei</em>
          </h1>
          <p className="book-cover__sub">5월 15일 — 5월 18일 · 2026</p>
          <p className="book-cover__byline">영하 &amp; 소현이 함께 쓴 여행 일기</p>
          <div className="book-cover__stats">
            <div>
              <span>사진</span>
              <strong>{totalPhotos}</strong>
            </div>
            <div>
              <span>코멘트</span>
              <strong>{totalComments}</strong>
            </div>
            <div>
              <span>완주 스톱</span>
              <strong>{doneCount}<small>/{tripStops.length}</small></strong>
            </div>
            <div>
              <span>총 지출</span>
              <strong>TWD {totalSpent.toLocaleString()}</strong>
              {exchangeRate && (
                <small>≈ ₩{Math.round(totalSpent * exchangeRate).toLocaleString()}</small>
              )}
            </div>
          </div>
        </div>
      </section>

      {!hasAnyMemory && (
        <section className="book-empty">
          <p>아직 작성된 기록이 거의 없어요.</p>
          <small>여행이 끝나면 이 페이지가 자동으로 채워집니다.</small>
        </section>
      )}

      {stopsByDay.map(({ day, stops }) => {
        const dayEntries = stops.map((stop) => ({
          stop,
          memory: normalizeMemory(getStopMemory(memoryBook, stop.id) ?? emptyMemory())
        }));
        const filteredEntries = onlyWritten
          ? dayEntries.filter(({ memory }) => stopHasStory(memory))
          : dayEntries;
        if (filteredEntries.length === 0) return null;

        // Pick a featured photo (first photo in the day).
        const featured = dayEntries
          .flatMap(({ stop, memory }) => memory.photos.map((url) => ({ url, stop })))
          .at(0);

        return (
          <section key={day.day} className="book-day">
            <header className="book-day__header">
              <div className="book-day__label">
                <span>DAY</span>
                <strong>{day.day}</strong>
              </div>
              <div>
                <span className="book-day__date">{day.date}</span>
                <h2>{day.title}</h2>
                {day.mood && <p className="book-day__mood">{day.mood}</p>}
                {day.summary && <p className="book-day__summary">{day.summary}</p>}
              </div>
            </header>

            {featured && (
              <button
                type="button"
                className="book-day__featured"
                onClick={() => openLightbox(featured.url, `Day ${day.day} · ${featured.stop.title}`)}
                aria-label={`Day ${day.day} 대표 사진 크게 보기`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={featured.url} alt={`Day ${day.day} featured`} loading="lazy" />
                <span>{featured.stop.title}</span>
              </button>
            )}

            <div className="book-day__stops">
              {filteredEntries.map(({ stop, memory }) => {
                const heroPhoto = memory.photos[0];
                const restPhotos = memory.photos.slice(1);
                return (
                  <article key={stop.id} className="book-stop">
                    <header className="book-stop__head">
                      <span
                        className="book-stop__cat"
                        style={{ background: categoryColors[stop.category] }}
                      >
                        {categoryLabels[stop.category]}
                      </span>
                      <span className="book-stop__time">{stop.time}</span>
                      <h3>{stop.title}</h3>
                      {stop.nameZh && <small className="book-stop__zh">{stop.nameZh}</small>}
                    </header>

                    {memory.note && (
                      <p className="book-stop__note">{memory.note}</p>
                    )}

                    {memory.comments.length > 0 && (
                      <div className="book-stop__comments">
                        {memory.comments.map((c) => (
                          <blockquote
                            key={c.id}
                            className={`book-stop__quote book-stop__quote--${c.author}`}
                          >
                            <p>{c.text}</p>
                            <footer>— {authorLabels[c.author]}</footer>
                          </blockquote>
                        ))}
                      </div>
                    )}

                    {heroPhoto && (
                      <button
                        type="button"
                        className="book-stop__hero"
                        onClick={() => openLightbox(heroPhoto, stop.title)}
                        aria-label={`${stop.title} 사진 크게 보기`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={heroPhoto} alt={stop.title} loading="lazy" />
                      </button>
                    )}

                    {restPhotos.length > 0 && (
                      <div className="book-stop__grid">
                        {restPhotos.map((url, index) => (
                          <button
                            type="button"
                            key={`${url}-${index}`}
                            className="book-stop__cell"
                            onClick={() => openLightbox(url, stop.title)}
                            aria-label={`${stop.title} 사진 ${index + 2} 크게 보기`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`${stop.title}-${index + 2}`} loading="lazy" />
                          </button>
                        ))}
                      </div>
                    )}

                    {(combinedRating(memory) > 0 || memory.expenseAmount > 0) && (
                      <footer className="book-stop__foot">
                        {combinedRating(memory) > 0 && (
                          <span className="book-stop__rating">
                            {"★".repeat(Math.round(combinedRating(memory)))}
                            <em> · 영하 {memory.ratingY || "·"} / 소현 {memory.ratingS || "·"}</em>
                          </span>
                        )}
                        {memory.expenseAmount > 0 && (
                          <span className="book-stop__spend">
                            TWD {memory.expenseAmount.toLocaleString()}
                          </span>
                        )}
                      </footer>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      {hasAnyMemory && (
        <section className="book-highlights">
          <header>
            <Sparkles size={16} />
            <h2>여행 하이라이트</h2>
            <span>WRAPPED</span>
          </header>
          <div className="book-highlights__grid">
            {bestStop && (
              <div className="book-highlight book-highlight--best">
                <span>최고의 한 곳</span>
                <strong>{bestStop.stop.title}</strong>
                <small>
                  ★ {combinedRating(bestStop.memory)} · Day {bestStop.stop.day}
                </small>
              </div>
            )}
            {yFav && (
              <div className="book-highlight book-highlight--y">
                <span>영하 최애</span>
                <strong>{yFav.stop.title}</strong>
                <small>{"★".repeat(yFav.memory.ratingY)}</small>
              </div>
            )}
            {sFav && (
              <div className="book-highlight book-highlight--s">
                <span>소현 최애</span>
                <strong>{sFav.stop.title}</strong>
                <small>{"★".repeat(sFav.memory.ratingS)}</small>
              </div>
            )}
            {topComment && (
              <div className="book-highlight book-highlight--quote">
                <span>둘이 남긴 한마디</span>
                <blockquote>“{topComment.comment.text}”</blockquote>
                <small>
                  — {authorLabels[topComment.comment.author]} · {topComment.stop.title}
                </small>
              </div>
            )}
          </div>
        </section>
      )}

      <footer className="book-foot">
        <span>Y &amp; S · 西門町 NEON DIARY · 2026</span>
        <small>둘이 같이 쓴 작은 여행 일기</small>
      </footer>

      {lightbox && (
        <PhotoLightbox
          photos={lightbox.photos}
          startIndex={lightbox.index}
          caption={lightbox.caption}
          onClose={() => setLightbox(null)}
        />
      )}
    </main>
  );
}
