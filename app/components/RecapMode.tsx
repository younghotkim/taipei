"use client";

import { Download, FileText, Footprints, ImagePlus, Sparkles, Star } from "lucide-react";
import { type TripStop } from "@/lib/trip-data";
import { authorLabels, getStopMemory, type MemoryBook } from "@/lib/memory-types";
import { distanceMeters } from "@/lib/integrations";
import { TwdKrwLabel } from "./ExpenseDashboard";
import { useItineraryContext } from "./ItineraryContext";

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
  onExport,
  onSelectStop
}: {
  memoryBook: MemoryBook;
  onExport: () => void;
  onSelectStop: (stop: TripStop) => void;
}) {
  const { snapshot } = useItineraryContext();
  const tripStops = snapshot.stops;
  const tripDays = snapshot.days;
  const totalSpent = tripStops.reduce(
    (sum, stop) => sum + getStopMemory(memoryBook, stop.id).expenseAmount,
    0
  );
  const visited = tripStops.filter(
    (stop) => getStopMemory(memoryBook, stop.id).status === "done"
  );
  const skipped = tripStops.filter(
    (stop) => getStopMemory(memoryBook, stop.id).status === "skipped"
  );
  const rated = tripStops
    .map((stop) => ({ stop, memory: getStopMemory(memoryBook, stop.id) }))
    .filter((entry) => entry.memory.rating > 0);
  const avgRating =
    rated.length === 0
      ? 0
      : rated.reduce((sum, entry) => sum + entry.memory.rating, 0) / rated.length;
  const written = tripStops
    .map((stop) => ({ stop, memory: getStopMemory(memoryBook, stop.id) }))
    .filter((entry) => entry.memory.note.trim() || entry.memory.comments.length > 0);

  const expenseByDay = tripDays.map((day) => {
    const stops = tripStops.filter((stop) => stop.day === day.day);
    const sum = stops.reduce(
      (acc, stop) => acc + getStopMemory(memoryBook, stop.id).expenseAmount,
      0
    );
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

      <RecapPhotoGrid memoryBook={memoryBook} onSelectStop={onSelectStop} />

      <RecapStories memoryBook={memoryBook} onSelectStop={onSelectStop} />
    </div>
  );
}

function RecapPhotoGrid({
  memoryBook,
  onSelectStop
}: {
  memoryBook: MemoryBook;
  onSelectStop: (stop: TripStop) => void;
}) {
  const { snapshot } = useItineraryContext();
  const tripStops = snapshot.stops;
  const entries = tripStops
    .map((stop) => ({ stop, photos: getStopMemory(memoryBook, stop.id).photos }))
    .filter((entry) => entry.photos.length > 0);

  return (
    <section className="recap-photos-real">
      <header>
        <ImagePlus size={16} />
        <strong>사진 그리드</strong>
        <span>{entries.reduce((sum, entry) => sum + entry.photos.length, 0)}장</span>
      </header>
      {entries.length === 0 ? (
        <div className="recap-photos__placeholder">
          아직 업로드된 사진이 없습니다. 기록 모드에서 사진을 추가해보세요.
        </div>
      ) : (
        <div className="recap-photos__grid">
          {entries.map(({ stop, photos }) =>
            photos.map((url, index) => (
              <button
                key={`${stop.id}-${index}`}
                className="recap-photo"
                onClick={() => onSelectStop(stop)}
              >
                <img src={url} alt={`${stop.title}-${index}`} loading="lazy" />
                <span>{stop.title}</span>
              </button>
            ))
          )}
        </div>
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
                <span>{"★".repeat(memory.rating) || "·"}</span>
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
