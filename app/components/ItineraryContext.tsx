"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useItinerary } from "@/lib/use-itinerary";

type ItineraryValue = ReturnType<typeof useItinerary>;

const ItineraryContext = createContext<ItineraryValue | null>(null);

export function ItineraryProvider({ children }: { children: ReactNode }) {
  const value = useItinerary();
  return <ItineraryContext.Provider value={value}>{children}</ItineraryContext.Provider>;
}

export function useItineraryContext(): ItineraryValue {
  const value = useContext(ItineraryContext);
  if (!value) {
    throw new Error("useItineraryContext must be used within ItineraryProvider");
  }
  return value;
}
