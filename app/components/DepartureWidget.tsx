"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Clock,
  Hotel,
  Luggage,
  Plane,
  ScrollText,
  X
} from "lucide-react";
import type { PackItem } from "@/lib/packing";
import type { VaultItem } from "@/lib/trip-vault";
import { daysUntilExpiry, type Traveler, type TravelerBook } from "@/lib/travelers";

const dismissKey = "taipei-trip-departure-dismissed-v1";

type Mode = "plan" | "today" | "vault" | "memories" | "ledger" | "recap";

type ReadinessRow = {
  key: string;
  icon: React.ReactNode;
  label: string;
  status: "ok" | "warn" | "todo";
  detail: string;
  cta?: { mode: Mode; label: string };
};

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00`);
  const to = new Date(`${toIso}T00:00:00`);
  return Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

function passportComplete(t: Traveler): boolean {
  return Boolean(t.passportName && t.passportNo && t.expiryDate);
}

export function DepartureWidget({
  todayIso,
  startIso,
  packingItems,
  vaultItems,
  travelers,
  onJump
}: {
  todayIso: string;
  startIso: string;
  packingItems: PackItem[];
  vaultItems: VaultItem[];
  travelers: TravelerBook;
  onJump: (mode: Mode) => void;
}) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(dismissKey);
    // Dismissal is keyed by trip start so a new trip would re-show it.
    if (stored === startIso) setDismissed(true);
  }, [startIso]);

  const dDays = daysBetween(todayIso, startIso);

  const rows = useMemo<ReadinessRow[]>(() => {
    const packed = packingItems.filter((i) => i.packed).length;
    const total = packingItems.length;
    const packingPct = total > 0 ? Math.round((packed / total) * 100) : 0;
    const packingStatus: ReadinessRow["status"] =
      total === 0 ? "todo" : packingPct >= 90 ? "ok" : packingPct >= 50 ? "warn" : "todo";

    const flights = vaultItems.filter((i) => i.kind === "flight");
    const flightConfirmed = flights.filter((i) => i.status === "confirmed");
    const flightStatus: ReadinessRow["status"] =
      flightConfirmed.length === 0 ? "todo" : flights.length === flightConfirmed.length ? "ok" : "warn";
    const flightDetail =
      flights.length === 0
        ? "항공편 미등록"
        : `${flightConfirmed.length}/${flights.length} 확정${
            flights.length > flightConfirmed.length ? " · 확인 필요" : ""
          }`;

    const hotels = vaultItems.filter((i) => i.kind === "hotel");
    const hotelConfirmed = hotels.filter((i) => i.status === "confirmed");
    const hotelStatus: ReadinessRow["status"] =
      hotelConfirmed.length === 0 ? "todo" : hotels.length === hotelConfirmed.length ? "ok" : "warn";
    const hotelDetail =
      hotels.length === 0
        ? "숙소 미등록"
        : `${hotelConfirmed.length}/${hotels.length} 확정${
            hotels.length > hotelConfirmed.length ? " · 확인 필요" : ""
          }`;

    const t1 = travelers.youngha;
    const t2 = travelers.sohyun;
    const passportDone = [t1, t2].filter(passportComplete).length;
    // Expiry-aware: passports expiring within 6 months → warn
    const soonExpiring = [t1, t2]
      .filter(passportComplete)
      .map((t) => daysUntilExpiry(t.expiryDate))
      .some((d) => d !== null && d <= 180);
    const passportStatus: ReadinessRow["status"] =
      passportDone === 2 ? (soonExpiring ? "warn" : "ok") : passportDone === 1 ? "warn" : "todo";
    const passportDetail =
      passportDone === 2
        ? soonExpiring
          ? "둘 다 입력 · 만료 임박"
          : "둘 다 입력 완료"
        : passportDone === 1
          ? "한 명만 입력됨"
          : "여권 정보 미입력";

    const arrivalDone = [t1, t2].filter((t) => Boolean(t.arrivalCardUrl)).length;
    const arrivalStatus: ReadinessRow["status"] =
      arrivalDone === 2 ? "ok" : arrivalDone === 1 ? "warn" : "todo";
    const arrivalDetail =
      arrivalDone === 2
        ? "둘 다 첨부 완료"
        : arrivalDone === 1
          ? "한 명만 첨부됨"
          : "입국 카드 미첨부";

    return [
      {
        key: "flight",
        icon: <Plane size={14} />,
        label: "항공편",
        status: flightStatus,
        detail: flightDetail,
        cta: flightStatus === "ok" ? undefined : { mode: "vault", label: "준비" }
      },
      {
        key: "hotel",
        icon: <Hotel size={14} />,
        label: "숙소",
        status: hotelStatus,
        detail: hotelDetail,
        cta: hotelStatus === "ok" ? undefined : { mode: "vault", label: "준비" }
      },
      {
        key: "passport",
        icon: <BookOpen size={14} />,
        label: "여권",
        status: passportStatus,
        detail: passportDetail,
        cta: passportStatus === "ok" ? undefined : { mode: "vault", label: "입력" }
      },
      {
        key: "arrival",
        icon: <ScrollText size={14} />,
        label: "출입국심사서",
        status: arrivalStatus,
        detail: arrivalDetail,
        cta: arrivalStatus === "ok" ? undefined : { mode: "vault", label: "첨부" }
      },
      {
        key: "packing",
        icon: <Luggage size={14} />,
        label: "준비물",
        status: packingStatus,
        detail: total === 0 ? "목록 비어있음" : `${packed}/${total} 챙김 (${packingPct}%)`,
        cta: packingStatus === "ok" ? undefined : { mode: "vault", label: "체크" }
      }
    ];
  }, [packingItems, vaultItems, travelers]);

  // Only render when we're pre-trip (or on departure day itself).
  if (dDays < 0) return null;
  if (dismissed) return null;

  const okCount = rows.filter((r) => r.status === "ok").length;
  const totalCount = rows.length;
  const overallPct = Math.round((okCount / totalCount) * 100);

  const dismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(dismissKey, startIso);
    }
  };

  const tone: "imminent" | "soon" | "later" =
    dDays === 0 ? "imminent" : dDays <= 3 ? "soon" : "later";

  return (
    <section className={`departure departure--${tone}`} aria-label="출발 카운트다운">
      <button
        type="button"
        className="departure__dismiss"
        onClick={dismiss}
        aria-label="이 안내 숨기기"
        title="이번 여행 동안 숨기기"
      >
        <X size={14} />
      </button>
      <div className="departure__head">
        <div className="departure__count">
          <span className="departure__count-label">출발까지</span>
          <strong className="departure__count-value">
            {dDays === 0 ? "D-Day" : `D-${dDays}`}
          </strong>
          <span className="departure__count-date">
            <Clock size={11} /> {startIso}
          </span>
        </div>
        <div className="departure__overall" aria-hidden="true">
          <div className="departure__ring" style={{ ["--pct" as string]: `${overallPct}%` }}>
            <strong>{overallPct}%</strong>
            <small>준비됨</small>
          </div>
        </div>
      </div>

      <ul className="departure__rows" role="list">
        {rows.map((row) => (
          <li key={row.key} className={`departure__row departure__row--${row.status}`}>
            <span className="departure__row-icon" aria-hidden="true">
              {row.status === "ok" ? <Check size={14} /> : row.icon}
            </span>
            <span className="departure__row-main">
              <strong>{row.label}</strong>
              <small>{row.detail}</small>
            </span>
            {row.cta && (
              <button
                type="button"
                className="departure__row-cta"
                onClick={() => onJump(row.cta!.mode)}
              >
                {row.cta.label} →
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
