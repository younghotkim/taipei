"use client";

import { useEffect, useState } from "react";
import { fetchExchangeRate } from "@/lib/integrations";

export function useTwdToKrw() {
  const [rate, setRate] = useState<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetchExchangeRate("TWD", "KRW", controller.signal).then((value) => {
      if (controller.signal.aborted) return;
      setRate(value);
    });
    return () => controller.abort();
  }, []);
  return rate;
}

export function TwdKrwLabel({ twd }: { twd: number }) {
  const rate = useTwdToKrw();
  if (twd <= 0) return null;
  if (rate === null) return <small>(KRW 환율 로딩…)</small>;
  return <small>≈ ₩{Math.round(twd * rate).toLocaleString()}</small>;
}
