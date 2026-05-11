"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import {
  categoryColors,
  type TripStop
} from "@/lib/trip-data";
import { useItineraryContext } from "./ItineraryContext";

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (el: HTMLElement, options: Record<string, unknown>) => GoogleMap;
        Marker: new (options: Record<string, unknown>) => GoogleMarker;
        Polyline: new (options: Record<string, unknown>) => GooglePolyline;
        InfoWindow: new (options: Record<string, unknown>) => GoogleInfoWindow;
        LatLngBounds: new () => GoogleBounds;
        SymbolPath: { CIRCLE: number };
      };
    };
    initTaipeiTripMap?: () => void;
  }
}

type GoogleMap = {
  fitBounds: (bounds: GoogleBounds) => void;
  setCenter: (position: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  addListener: (event: string, callback: (event: { latLng?: GoogleLatLng }) => void) => void;
};

type GoogleLatLng = {
  lat: () => number;
  lng: () => number;
};

type GoogleMarker = {
  addListener: (event: string, callback: () => void) => void;
  setPosition: (position: { lat: number; lng: number }) => void;
  setMap: (map: GoogleMap | null) => void;
};

type GooglePolyline = unknown;

type GoogleInfoWindow = {
  open: (options: { map: GoogleMap; anchor: GoogleMarker }) => void;
};

type GoogleBounds = {
  extend: (position: { lat: number; lng: number }) => void;
};

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function MapView({
  activeStop,
  onSelectStop,
  onMapClick,
  pin
}: {
  activeStop: TripStop;
  onSelectStop: (stop: TripStop) => void;
  onMapClick?: (lat: number, lng: number) => void;
  pin?: { lat: number; lng: number } | null;
}) {
  const { snapshot } = useItineraryContext();
  const tripStops = snapshot.stops;
  const tripDays = snapshot.days;
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<GoogleMap | null>(null);
  const pinMarkerRef = useRef<GoogleMarker | null>(null);
  const onSelectRef = useRef(onSelectStop);
  const onMapClickRef = useRef(onMapClick);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelectStop;
  }, [onSelectStop]);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    if (!apiKey || window.google?.maps) {
      setMapReady(Boolean(window.google?.maps));
      return;
    }

    window.initTaipeiTripMap = () => setMapReady(true);
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-taipei-trip-map="true"]'
    );
    if (existingScript) return;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initTaipeiTripMap&loading=async`;
    script.async = true;
    script.defer = true;
    script.dataset.taipeiTripMap = "true";
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.google?.maps) return;

    const googleMaps = window.google.maps;
    const map = new googleMaps.Map(mapRef.current, {
      center: { lat: 25.043, lng: 121.525 },
      zoom: 12,
      disableDefaultUI: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ saturation: -40 }] },
        { featureType: "water", stylers: [{ color: "#1a103d" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#241548" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#a08bd0" }] },
        { featureType: "landscape", stylers: [{ color: "#150a30" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#c6b0e6" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0a0524" }] }
      ]
    });

    mapInstanceRef.current = map;

    map.addListener("click", (event) => {
      if (!onMapClickRef.current || !event.latLng) return;
      onMapClickRef.current(event.latLng.lat(), event.latLng.lng());
    });

    tripDays.forEach((day) => {
      const dayStops = tripStops.filter((stop) => stop.day === day.day);
      new googleMaps.Polyline({
        path: dayStops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
        geodesic: true,
        strokeColor:
          day.day === 1
            ? "#ff2d95"
            : day.day === 2
              ? "#36ffb3"
              : day.day === 3
                ? "#ffcc1f"
                : "#00e8ff",
        strokeOpacity: 0.78,
        strokeWeight: 3,
        icons: [
          {
            icon: {
              path: googleMaps.SymbolPath.CIRCLE,
              scale: 3,
              fillOpacity: 1,
              strokeOpacity: 0
            },
            offset: "100%",
            repeat: "34px"
          }
        ],
        map
      }) as GooglePolyline;
    });

    const bounds = new googleMaps.LatLngBounds();
    tripStops.forEach((stop) => {
      const marker = new googleMaps.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        map,
        title: stop.title,
        label: {
          text: String(stop.day),
          color: "#ffffff",
          fontWeight: "800"
        },
        icon: {
          path: googleMaps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: categoryColors[stop.category],
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2
        }
      });
      const info = new googleMaps.InfoWindow({
        content: `<strong style="color:#000">${stop.time} ${stop.title}</strong><br />${stop.subtitle}`
      });
      marker.addListener("click", () => {
        onSelectRef.current(stop);
        info.open({ map, anchor: marker });
      });
      bounds.extend({ lat: stop.lat, lng: stop.lng });
    });
    if (tripStops.length > 0) map.fitBounds(bounds);
  }, [mapReady, tripStops, tripDays]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setCenter({ lat: activeStop.lat, lng: activeStop.lng });
    mapInstanceRef.current.setZoom(activeStop.day === 2 ? 10 : 15);
  }, [activeStop]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps) return;
    if (pin) {
      if (pinMarkerRef.current) {
        pinMarkerRef.current.setPosition(pin);
        pinMarkerRef.current.setMap(map);
      } else {
        pinMarkerRef.current = new window.google.maps.Marker({
          position: pin,
          map,
          label: { text: "＋", color: "#ffffff", fontWeight: "900" },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#ff2d95",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3
          }
        }) as GoogleMarker;
      }
      map.setCenter(pin);
    } else if (pinMarkerRef.current) {
      pinMarkerRef.current.setMap(null);
    }
  }, [pin, mapReady]);

  return (
    <>
      <div ref={mapRef} className="google-map" />
      {!apiKey && (
        <div className="map-fallback">
          <MapPin size={22} />
          <strong>Google Maps API 키가 필요합니다.</strong>
          <span>.env.local에 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY를 넣으면 지도가 표시됩니다.</span>
        </div>
      )}
    </>
  );
}

export function MiniRouteStrip({
  from,
  to
}: {
  from: TripStop;
  to: TripStop | null;
}) {
  if (!apiKey) {
    return (
      <div className="mini-map mini-map--empty">
        <MapPin size={16} />
        <span>지도 키 없음</span>
      </div>
    );
  }

  const points = to ? [from, to] : [from];
  const center = to
    ? `${(from.lat + to.lat) / 2},${(from.lng + to.lng) / 2}`
    : `${from.lat},${from.lng}`;
  const markers = points
    .map(
      (stop, index) =>
        `markers=color:0x${index === 0 ? "ff2d95" : "00e8ff"}|label:${index + 1}|${stop.lat},${stop.lng}`
    )
    .join("&");
  const path = to ? `&path=color:0xff2d95cc|weight:4|${from.lat},${from.lng}|${to.lat},${to.lng}` : "";
  const styles = [
    "&style=feature:water|color:0x1a103d",
    "&style=feature:road|element:geometry|color:0x241548",
    "&style=feature:landscape|color:0x150a30",
    "&style=feature:poi|visibility:off",
    "&style=element:labels.text.fill|color:0xc6b0e6",
    "&style=element:labels.text.stroke|color:0x0a0524"
  ].join("");
  const src = `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=${to ? 14 : 15}&size=720x180&scale=2&${markers}${path}${styles}&key=${apiKey}`;

  return (
    <div className="mini-map">
      <img src={src} alt={to ? `${from.title} → ${to.title}` : from.title} loading="lazy" />
    </div>
  );
}
