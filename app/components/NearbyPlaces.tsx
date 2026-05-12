"use client";

import { useState } from "react";
import { Loader2, MapPin, Star, Utensils } from "lucide-react";

type NearbyPlace = {
  name: string;
  rating: number;
  reviews: number;
  priceLevel: number | null;
  vicinity: string;
  openNow: boolean | null;
  lat: number | null;
  lng: number | null;
  distanceM: number | null;
};

type NearbyResponse =
  | { configured: false; results: [] }
  | { configured: true; results: NearbyPlace[]; message?: string };

const CATEGORIES: Array<{ type: string; label: string }> = [
  { type: "restaurant", label: "🍜 맛집" },
  { type: "cafe", label: "☕ 카페" },
  { type: "bakery", label: "🥐 디저트" },
  { type: "bar", label: "🍸 바" },
  { type: "supermarket", label: "🛒 마트" },
  { type: "tourist_attraction", label: "📸 명소" }
];

function walkMin(m: number | null): string {
  if (m === null) return "";
  if (m < 80) return "코앞";
  return `도보 ${Math.max(1, Math.round(m / 80))}분`;
}

export function NearbyPlaces({ lat, lng }: { lat: number; lng: number }) {
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [message, setMessage] = useState<string>("");

  async function pick(type: string) {
    if (active === type && !loading) {
      setActive(null);
      return;
    }
    setActive(type);
    setLoading(true);
    setMessage("");
    setPlaces([]);
    try {
      const res = await fetch(`/api/nearby?lat=${lat}&lng=${lng}&type=${encodeURIComponent(type)}`, { cache: "no-store" });
      const payload = (await res.json()) as NearbyResponse;
      if (!payload.configured) {
        setMessage("Places 검색 미설정 — 위의 지도 링크를 쓰세요.");
      } else if (payload.results.length === 0) {
        setMessage(payload.message ?? "근처에 결과가 없어요.");
      } else {
        setPlaces(payload.results);
      }
    } catch {
      setMessage("검색에 실패했어요.");
    }
    setLoading(false);
  }

  return (
    <div className="nearby">
      <div className="nearby__head">
        <Utensils size={14} /> 근처 추천 — 지금 이 스톱 주변
      </div>
      <div className="nearby__cats">
        {CATEGORIES.map((c) => (
          <button
            key={c.type}
            className={active === c.type ? "nearby__cat nearby__cat--on" : "nearby__cat"}
            onClick={() => pick(c.type)}
          >
            {c.label}
          </button>
        ))}
      </div>
      {active && (
        <div className="nearby__results">
          {loading && (
            <div className="nearby__msg">
              <Loader2 size={14} className="spin" /> 찾는 중…
            </div>
          )}
          {!loading && message && <div className="nearby__msg">{message}</div>}
          {!loading &&
            places.map((p) => {
              const q = p.lat !== null && p.lng !== null
                ? `https://www.google.com/maps/search/${encodeURIComponent(p.name)}/@${p.lat},${p.lng},17z`
                : `https://www.google.com/maps/search/${encodeURIComponent(p.name)}`;
              return (
                <a key={`${p.name}-${p.lat}-${p.lng}`} className="nearby-item" href={q} target="_blank" rel="noreferrer">
                  <span className="nearby-item__main">
                    <strong>{p.name}</strong>
                    <small>
                      {p.rating > 0 && (
                        <span className="nearby-item__rate">
                          <Star size={11} fill="currentColor" /> {p.rating.toFixed(1)}
                          {p.reviews > 0 && ` (${p.reviews.toLocaleString()})`}
                        </span>
                      )}
                      {p.priceLevel !== null && p.priceLevel > 0 && <span>{"$".repeat(p.priceLevel)}</span>}
                      {p.openNow === true && <span className="nearby-item__open">영업 중</span>}
                      {p.openNow === false && <span className="nearby-item__closed">영업 종료</span>}
                      {p.vicinity && <span className="nearby-item__addr">{p.vicinity}</span>}
                    </small>
                  </span>
                  <span className="nearby-item__dist">
                    <MapPin size={11} />
                    {walkMin(p.distanceM)}
                  </span>
                </a>
              );
            })}
        </div>
      )}
    </div>
  );
}
