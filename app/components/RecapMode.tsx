"use client";

import { useState } from "react";
import { Download, FileText, Footprints, Gift, ImagePlus, Sparkles, Star } from "lucide-react";
import { categoryLabels, type TripStop } from "@/lib/trip-data";
import { authorLabels, combinedRating, getStopMemory, type Memory, type MemoryBook } from "@/lib/memory-types";
import { distanceMeters } from "@/lib/integrations";
import { type ExpenseEntry } from "@/lib/expense-ledger";
import { TwdKrwLabel } from "./ExpenseDashboard";
import { useItineraryContext } from "./ItineraryContext";
import { PhotoLightbox } from "./PhotoLightbox";

type RecapEntry = { stop: TripStop; memory: Memory };

function pick<T>(pool: T[], better: (a: T, b: T) => boolean): T | null {
  return pool.reduce<T | null>((best, cur) => (best === null || better(cur, best) ? cur : best), null);
}

// 연속 스톱 간 직선거리에 도시 보행 디투어 보정(×1.3)을 적용해 "도보 추정 거리"를 만든다.
// 2km를 넘는 구간은 MRT/택시로 이동했다고 보고 제외한다.
const WALK_DETOUR_FACTOR = 1.3;
const WALK_LEG_CAP_M = 2000;

function walkMetersForStops(stops: TripStop[]): number {
  const ordered = [...stops].sort((a, b) => a.time.localeCompare(b.time));
  let meters = 0;
  for (let i = 1; i < ordered.length; i += 1) {
    const leg = distanceMeters(ordered[i - 1], ordered[i]);
    if (leg > 0 && leg <= WALK_LEG_CAP_M) meters += leg * WALK_DETOUR_FACTOR;
  }
  return meters;
}

function formatKm(meters: number): string {
  if (meters < 950) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function RecapMode({
  memoryBook,
  ledgerEntries = [],
  onExport,
  onSelectStop
}: {
  memoryBook: MemoryBook;
  ledgerEntries?: ExpenseEntry[];
  onExport: () => void;
  onSelectStop: (stop: TripStop) => void;
}) {
  const { snapshot } = useItineraryContext();
  const tripStops = snapshot.stops;
  const tripDays = snapshot.days;
  const ledgerTotal = ledgerEntries.reduce((sum, e) => sum + e.amount, 0);
  const totalSpent =
    tripStops.reduce((sum, stop) => sum + getStopMemory(memoryBook, stop.id).expenseAmount, 0) + ledgerTotal;
  const visited = tripStops.filter(
    (stop) => getStopMemory(memoryBook, stop.id).status === "done"
  );
  const skipped = tripStops.filter(
    (stop) => getStopMemory(memoryBook, stop.id).status === "skipped"
  );
  const rated = tripStops
    .map((stop) => ({ stop, memory: getStopMemory(memoryBook, stop.id) }))
    .filter((entry) => combinedRating(entry.memory) > 0);
  const avgRating =
    rated.length === 0
      ? 0
      : rated.reduce((sum, entry) => sum + combinedRating(entry.memory), 0) / rated.length;
  const written = tripStops
    .map((stop) => ({ stop, memory: getStopMemory(memoryBook, stop.id) }))
    .filter((entry) => entry.memory.note.trim() || entry.memory.comments.length > 0);

  const expenseByDay = tripDays.map((day) => {
    const stops = tripStops.filter((stop) => stop.day === day.day);
    const sum =
      stops.reduce((acc, stop) => acc + getStopMemory(memoryBook, stop.id).expenseAmount, 0) +
      ledgerEntries.filter((e) => e.day === day.day).reduce((acc, e) => acc + e.amount, 0);
    return { day, sum };
  });
  const dayMax = Math.max(1, ...expenseByDay.map((entry) => entry.sum));

  const walkByDay = tripDays.map((day) => ({
    day,
    meters: walkMetersForStops(tripStops.filter((stop) => stop.day === day.day))
  }));
  const walkTotalM = walkByDay.reduce((acc, entry) => acc + entry.meters, 0);
  const walkDayMax = Math.max(1, ...walkByDay.map((entry) => entry.meters));

  const split = tripStops.reduce(
    (acc, stop) => {
      const m = getStopMemory(memoryBook, stop.id);
      if (m.expenseAmount <= 0) return acc;
      if (m.expensePayer === "y") acc.y += m.expenseAmount;
      else if (m.expensePayer === "s") acc.s += m.expenseAmount;
      else if (m.expensePayer === "shared") acc.shared += m.expenseAmount;
      else acc.unassigned += m.expenseAmount;
      return acc;
    },
    { y: 0, s: 0, shared: 0, unassigned: 0 }
  );
  for (const e of ledgerEntries) {
    if (e.amount <= 0) continue;
    if (e.payer === "y") split.y += e.amount;
    else if (e.payer === "s") split.s += e.amount;
    else if (e.payer === "shared") split.shared += e.amount;
    else split.unassigned += e.amount;
  }
  const settleText =
    split.y === 0 && split.s === 0
      ? "결제자 미지정"
      : split.y > split.s
        ? `S → Y  TWD ${Math.round((split.y - split.s) / 2).toLocaleString()}`
        : split.s > split.y
          ? `Y → S  TWD ${Math.round((split.s - split.y) / 2).toLocaleString()}`
          : "균등 — 정산 불필요";

  return (
    <div className="recap-stage">
      <header className="recap-head">
        <div>
          <span>회고 · RECAP</span>
          <h1>여행 정리</h1>
          <p>5/15 — 5/18 타이베이 + 이란 여행 기록을 한 페이지로.</p>
        </div>
        <div className="recap-head__actions">
          <a className="wide-link" href="/recap/print" target="_blank" rel="noreferrer">
            <FileText size={16} />
            PDF 사진북 (P4)
          </a>
          <button className="wide-link" onClick={onExport}>
            <Download size={16} />
            JSON 내보내기
          </button>
        </div>
      </header>

      <section className="recap-grid">
        <article className="recap-card recap-card--big">
          <span>총 지출</span>
          <strong>TWD {totalSpent.toLocaleString()}</strong>
          <TwdKrwLabel twd={totalSpent} />
        </article>
        <article className="recap-card">
          <span>완료</span>
          <strong>{visited.length}</strong>
          <small>/ {tripStops.length} 스톱</small>
        </article>
        <article className="recap-card">
          <span>스킵</span>
          <strong>{skipped.length}</strong>
          <small>이유 메모 확인</small>
        </article>
        <article className="recap-card">
          <span>평균 별점</span>
          <strong>{avgRating ? avgRating.toFixed(1) : "—"}</strong>
          <small>{rated.length}개 평가</small>
        </article>
        <article className="recap-card">
          <span>작성한 기록</span>
          <strong>{written.length}</strong>
          <small>스톱</small>
        </article>
        <article className="recap-card recap-card--walk">
          <span><Footprints size={12} /> 도보 추정</span>
          <strong>{formatKm(walkTotalM)}</strong>
          <small>스톱 간 이동, 대략</small>
        </article>
      </section>

      <section className="recap-settle">
        <header>
          <Sparkles size={16} />
          <strong>지출 정산</strong>
          <span>{settleText}</span>
        </header>
        <div className="recap-settle__grid">
          <div>
            <span>Y 결제</span>
            <strong>TWD {split.y.toLocaleString()}</strong>
          </div>
          <div>
            <span>S 결제</span>
            <strong>TWD {split.s.toLocaleString()}</strong>
          </div>
          <div>
            <span>공동</span>
            <strong>TWD {split.shared.toLocaleString()}</strong>
          </div>
          <div>
            <span>미지정</span>
            <strong>TWD {split.unassigned.toLocaleString()}</strong>
          </div>
        </div>
      </section>

      <section className="recap-chart">
        <header>
          <Sparkles size={16} />
          <strong>일자별 지출 (TWD)</strong>
        </header>
        <div className="recap-chart__bars">
          {expenseByDay.map((entry) => (
            <div key={entry.day.day} className="recap-bar">
              <div
                className="recap-bar__fill"
                style={{ height: `${(entry.sum / dayMax) * 100}%` }}
                aria-label={`Day ${entry.day.day} ${entry.sum}`}
              />
              <span>{entry.day.date}</span>
              <strong>{entry.sum.toLocaleString()}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="recap-chart recap-chart--walk">
        <header>
          <Footprints size={16} />
          <strong>일자별 도보 추정</strong>
          <span>스톱 사이 직선거리 × 1.3 · 2km 초과 구간(MRT/택시) 제외</span>
        </header>
        <div className="recap-chart__bars">
          {walkByDay.map((entry) => (
            <div key={entry.day.day} className="recap-bar">
              <div
                className="recap-bar__fill recap-bar__fill--walk"
                style={{ height: `${(entry.meters / walkDayMax) * 100}%` }}
                aria-label={`Day ${entry.day.day} ${Math.round(entry.meters)}m`}
              />
              <span>{entry.day.date}</span>
              <strong>{formatKm(entry.meters)}</strong>
            </div>
          ))}
        </div>
      </section>

      <RecapWrapped memoryBook={memoryBook} onSelectStop={onSelectStop} />

      <RecapPhotoGrid memoryBook={memoryBook} />

      <RecapStories memoryBook={memoryBook} onSelectStop={onSelectStop} />
    </div>
  );
}

function RecapWrapped({
  memoryBook,
  onSelectStop
}: {
  memoryBook: MemoryBook;
  onSelectStop: (stop: TripStop) => void;
}) {
  const { snapshot } = useItineraryContext();
  const tripStops = snapshot.stops;
  const tripDays = snapshot.days;
  const entries: RecapEntry[] = tripStops.map((stop) => ({ stop, memory: getStopMemory(memoryBook, stop.id) }));
  const done = entries.filter((e) => e.memory.status === "done");

  // 가장 많이 한 카테고리 (방문한 것 중)
  const catCount = new Map<string, number>();
  for (const e of done) catCount.set(e.stop.category, (catCount.get(e.stop.category) ?? 0) + 1);
  const topCat = pick([...catCount.entries()], (a, b) => a[1] > b[1]);

  // 최고 별점 스톱
  const bestStop = pick(
    entries.filter((e) => combinedRating(e.memory) > 0),
    (a, b) => combinedRating(a.memory) > combinedRating(b.memory)
  );

  // 제일 비쌌던 한 끼 (음식/술), 없으면 가장 큰 지출
  const meals = entries.filter(
    (e) => e.memory.expenseAmount > 0 && (e.memory.expenseCategory === "food" || e.memory.expenseCategory === "drink")
  );
  const pricyPool = meals.length ? meals : entries.filter((e) => e.memory.expenseAmount > 0);
  const priciest = pick(pricyPool, (a, b) => a.memory.expenseAmount > b.memory.expenseAmount);

  const commentCount = entries.reduce((s, e) => s + e.memory.comments.length, 0);
  const photoCount = entries.reduce((s, e) => s + e.memory.photos.length, 0);

  // 하루 평균 도보
  const daysWithStops = tripDays.filter((d) => tripStops.some((s) => s.day === d.day)).length || 1;
  const avgWalkM =
    tripDays.reduce((acc, d) => acc + walkMetersForStops(tripStops.filter((s) => s.day === d.day)), 0) / daysWithStops;

  // 가장 늦게까지
  const nightPool = done.length ? done : entries;
  const latest = pick(nightPool, (a, b) => a.stop.time.localeCompare(b.stop.time) > 0);

  const reVisit = entries.filter((e) => e.memory.status === "skipped").map((e) => e.stop.title);

  // 커플 — 취향
  const bothRated = entries.filter((e) => e.memory.ratingY > 0 && e.memory.ratingS > 0);
  const matchPct = bothRated.length
    ? Math.round(
        100 * (1 - bothRated.reduce((s, e) => s + Math.abs(e.memory.ratingY - e.memory.ratingS), 0) / bothRated.length / 4)
      )
    : null;
  const yFav = pick(entries.filter((e) => e.memory.ratingY > 0), (a, b) => a.memory.ratingY > b.memory.ratingY);
  const sFav = pick(entries.filter((e) => e.memory.ratingS > 0), (a, b) => a.memory.ratingS > b.memory.ratingS);
  const splitStop = pick(
    bothRated.filter((e) => e.memory.ratingY !== e.memory.ratingS),
    (a, b) => Math.abs(a.memory.ratingY - a.memory.ratingS) > Math.abs(b.memory.ratingY - b.memory.ratingS)
  );

  const hasAny =
    done.length > 0 || commentCount > 0 || photoCount > 0 || bestStop !== null;

  return (
    <section className="recap-wrapped">
      <header>
        <Gift size={16} />
        <strong>트립 Wrapped</strong>
        <span>{hasAny ? "이런 여행이었네" : "여행이 끝나면 자동으로 채워져요"}</span>
      </header>
      <div className="recap-wrapped__grid">
        {matchPct !== null && (
          <div className="recap-wrapped__card recap-wrapped__card--hero">
            <span>취향 일치도</span>
            <strong>{matchPct}%</strong>
            <small>둘 다 별점 준 {bothRated.length}곳 기준</small>
          </div>
        )}
        {bestStop && (
          <button className="recap-wrapped__card recap-wrapped__card--tap" onClick={() => onSelectStop(bestStop.stop)}>
            <span>최고의 한 곳</span>
            <strong>{bestStop.stop.title}</strong>
            <small>★ {combinedRating(bestStop.memory)} · Day {bestStop.stop.day}</small>
          </button>
        )}
        {topCat && (
          <div className="recap-wrapped__card">
            <span>제일 많이 한 것</span>
            <strong>{categoryLabels[topCat[0] as keyof typeof categoryLabels] ?? topCat[0]}</strong>
            <small>{topCat[1]}회</small>
          </div>
        )}
        {priciest && (
          <button className="recap-wrapped__card recap-wrapped__card--tap" onClick={() => onSelectStop(priciest.stop)}>
            <span>{meals.length ? "제일 비쌌던 한 끼" : "가장 큰 한 방"}</span>
            <strong>TWD {priciest.memory.expenseAmount.toLocaleString()}</strong>
            <small>{priciest.stop.title}</small>
          </button>
        )}
        {yFav && (
          <button className="recap-wrapped__card recap-wrapped__card--tap recap-wrapped__card--y" onClick={() => onSelectStop(yFav.stop)}>
            <span>영하 최애</span>
            <strong>{yFav.stop.title}</strong>
            <small>{"★".repeat(yFav.memory.ratingY)}</small>
          </button>
        )}
        {sFav && (
          <button className="recap-wrapped__card recap-wrapped__card--tap recap-wrapped__card--s" onClick={() => onSelectStop(sFav.stop)}>
            <span>소현 최애</span>
            <strong>{sFav.stop.title}</strong>
            <small>{"★".repeat(sFav.memory.ratingS)}</small>
          </button>
        )}
        {splitStop && (
          <button className="recap-wrapped__card recap-wrapped__card--tap" onClick={() => onSelectStop(splitStop.stop)}>
            <span>의견 제일 갈린 곳</span>
            <strong>{splitStop.stop.title}</strong>
            <small>영하 {splitStop.memory.ratingY} · 소현 {splitStop.memory.ratingS}</small>
          </button>
        )}
        {latest && (
          <button className="recap-wrapped__card recap-wrapped__card--tap" onClick={() => onSelectStop(latest.stop)}>
            <span>가장 늦게까지</span>
            <strong>{latest.stop.time}</strong>
            <small>{latest.stop.title} · Day {latest.stop.day}</small>
          </button>
        )}
        <div className="recap-wrapped__card">
          <span>둘이 남긴 한마디</span>
          <strong>{commentCount}</strong>
          <small>개</small>
        </div>
        <div className="recap-wrapped__card">
          <span>찍은 사진</span>
          <strong>{photoCount}</strong>
          <small>장</small>
        </div>
        <div className="recap-wrapped__card">
          <span>하루 평균 도보</span>
          <strong>{formatKm(avgWalkM)}</strong>
          <small>추정</small>
        </div>
        {reVisit.length > 0 && (
          <div className="recap-wrapped__card recap-wrapped__card--wide">
            <span>다음에 또 올 곳</span>
            <strong>{reVisit.slice(0, 3).join(" · ")}{reVisit.length > 3 ? ` 외 ${reVisit.length - 3}` : ""}</strong>
            <small>이번엔 스킵</small>
          </div>
        )}
      </div>
    </section>
  );
}

function RecapPhotoGrid({
  memoryBook
}: {
  memoryBook: MemoryBook;
}) {
  const { snapshot } = useItineraryContext();
  const tripStops = snapshot.stops;
  const entries = tripStops
    .map((stop) => ({ stop, photos: getStopMemory(memoryBook, stop.id).photos }))
    .filter((entry) => entry.photos.length > 0);

  const flat: { url: string; stop: TripStop }[] = [];
  for (const { stop, photos } of entries) {
    for (const url of photos) flat.push({ url, stop });
  }
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <section className="recap-photos-real">
      <header>
        <ImagePlus size={16} />
        <strong>사진 그리드</strong>
        <span>{flat.length}장</span>
      </header>
      {flat.length === 0 ? (
        <div className="recap-photos__placeholder">
          아직 업로드된 사진이 없습니다. 기록 모드에서 사진을 추가해보세요.
        </div>
      ) : (
        <div className="recap-photos__grid">
          {flat.map(({ url, stop }, flatIndex) => (
            <button
              key={`${stop.id}-${flatIndex}`}
              className="recap-photo"
              onClick={() => setLightboxIndex(flatIndex)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`${stop.title}`} loading="lazy" />
              <span>{stop.title}</span>
            </button>
          ))}
        </div>
      )}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={flat.map((entry) => entry.url)}
          startIndex={lightboxIndex}
          caption={flat[lightboxIndex]?.stop.title}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </section>
  );
}

function RecapStories({
  memoryBook,
  onSelectStop
}: {
  memoryBook: MemoryBook;
  onSelectStop: (stop: TripStop) => void;
}) {
  const { snapshot } = useItineraryContext();
  const tripStops = snapshot.stops;
  const written = tripStops
    .map((stop) => ({ stop, memory: getStopMemory(memoryBook, stop.id) }))
    .filter((entry) => entry.memory.note.trim() || entry.memory.comments.length > 0);
  return (
    <section className="recap-stories">
        <header>
          <Star size={16} />
          <strong>인상 깊은 기록</strong>
        </header>
        <div className="recap-stories__list">
          {written.length === 0 && (
            <div className="empty-state">아직 작성된 기록이 없어요. 기록 모드에서 채워보세요.</div>
          )}
          {written.map(({ stop, memory }) => (
            <button
              key={stop.id}
              className="recap-story"
              onClick={() => onSelectStop(stop)}
            >
              <div className="recap-story__top">
                <strong>{stop.title}</strong>
                <small>Day {stop.day} · {stop.time}</small>
              </div>
              {memory.note && <p>{memory.note}</p>}
              {memory.comments.length > 0 && (
                <div className="recap-story__couple">
                  {memory.comments.map((c) => (
                    <em key={c.id} className={`recap-story__comment recap-story__comment--${c.author}`}>
                      <b>{authorLabels[c.author]}</b> {c.text}
                    </em>
                  ))}
                </div>
              )}
              <div className="recap-story__meta">
                <span>{combinedRating(memory) ? `★ ${combinedRating(memory)}` : "·"}</span>
                {memory.comments.length > 0 && <span>💬 {memory.comments.length}</span>}
                {memory.expenseAmount > 0 && (
                  <span>TWD {memory.expenseAmount.toLocaleString()}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </section>
  );
}
