"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudRain, Loader2, Sun } from "lucide-react";
import {
  fetchWeather,
  weatherLabel,
  type WeatherForecast,
  type DailyWeather
} from "@/lib/integrations";

const TAIPEI = { lat: 25.043, lng: 121.525 };

function pickIcon(code: number) {
  if (code === 0 || code === 1) return <Sun size={18} />;
  if (code >= 61) return <CloudRain size={18} />;
  return <Cloud size={18} />;
}

export function useWeatherForecast(coords: { lat: number; lng: number } = TAIPEI) {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchWeather(coords.lat, coords.lng, controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setForecast(result);
      setLoading(false);
    });
    return () => controller.abort();
  }, [coords.lat, coords.lng]);

  return { forecast, loading };
}

export function WeatherBar({ coords }: { coords?: { lat: number; lng: number } }) {
  const { forecast, loading } = useWeatherForecast(coords ?? TAIPEI);

  if (loading) {
    return (
      <div className="weather-bar weather-bar--loading">
        <Loader2 size={14} className="weather-bar__spinner" />
        <span>날씨 불러오는 중…</span>
      </div>
    );
  }
  if (!forecast || forecast.hourly.length === 0) {
    return (
      <div className="weather-bar weather-bar--empty">
        <Cloud size={14} />
        <span>날씨 정보 사용 불가 (open-meteo 응답 없음)</span>
      </div>
    );
  }

  const now = Date.now();
  const upcoming = forecast.hourly.filter((hour) => new Date(hour.time).getTime() >= now).slice(0, 6);

  return (
    <div className="weather-bar">
      {upcoming.map((hour) => {
        const date = new Date(hour.time);
        const wl = weatherLabel(hour.weatherCode);
        return (
          <div
            key={hour.time}
            className={hour.precipProbability >= 50 ? "weather-bar__cell weather-bar__cell--rain" : "weather-bar__cell"}
          >
            <span>{date.getHours()}시</span>
            <div className="weather-bar__icon">{pickIcon(hour.weatherCode)}</div>
            <strong>{Math.round(hour.temperature)}°</strong>
            <small>{hour.precipProbability}%</small>
            <em>{wl.label}</em>
          </div>
        );
      })}
    </div>
  );
}

export function useDailyForecast(coords: { lat: number; lng: number } = TAIPEI) {
  const { forecast, loading } = useWeatherForecast(coords);
  const byDate: Record<string, DailyWeather> = {};
  forecast?.daily.forEach((entry) => {
    byDate[entry.date] = entry;
  });
  return { byDate, loading };
}

export function DayWeatherBadge({ isoDate }: { isoDate: string | null }) {
  const { byDate } = useDailyForecast();
  if (!isoDate) return null;
  const daily = byDate[isoDate];
  if (!daily) return null;
  const wl = weatherLabel(daily.weatherCode);
  const isRainy = daily.precipProbabilityMax >= 60;
  return (
    <span className={isRainy ? "day-weather day-weather--rain" : "day-weather"}>
      {wl.emoji} {Math.round(daily.tempMin)}/{Math.round(daily.tempMax)}°
      {isRainy && <em>비 {daily.precipProbabilityMax}%</em>}
    </span>
  );
}
