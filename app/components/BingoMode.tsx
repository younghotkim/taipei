"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Grid3x3, PartyPopper } from "lucide-react";
import {
  BINGO_CHALLENGES,
  cellsInCompletedLines,
  completedLineIndices
} from "@/lib/bingo";

export function BingoMode({
  done,
  onToggle
}: {
  done: number[];
  onToggle: (index: number) => void;
}) {
  const lineIdxs = completedLineIndices(done);
  const lineCells = cellsInCompletedLines(done);
  const cleared = done.length;
  const lines = lineIdxs.length;
  const full = cleared === BINGO_CHALLENGES.length;

  const [toast, setToast] = useState<string | null>(null);
  const prevLines = useRef(lines);
  const prevFull = useRef(full);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let msg: string | null = null;
    if (full && !prevFull.current) msg = "풀 클리어! 빙고 마스터 🏆";
    else if (lines > prevLines.current) msg = `빙고! ${lines}줄 완성 🎉`;
    prevLines.current = lines;
    prevFull.current = full;
    if (!msg) return;
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, [lines, full]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  return (
    <div className="bingo-stage">
      <header className="bingo-head">
        <div>
          <span><Grid3x3 size={13} /> 빙고 · BINGO</span>
          <h1>여행 빙고</h1>
          <p>한 칸씩 클리어하면서 줄 맞춰보기 — 탭하면 완료/취소.</p>
        </div>
        <div className="bingo-progress">
          <div className="bingo-progress__stat">
            <strong>{cleared}/{BINGO_CHALLENGES.length}</strong>
            <span>칸</span>
          </div>
          <div className="bingo-progress__stat">
            <strong>{lines}</strong>
            <span>줄</span>
          </div>
        </div>
      </header>

      {toast && (
        <div className="bingo-toast">
          <PartyPopper size={16} />
          <span>{toast}</span>
        </div>
      )}

      <div className="bingo-grid">
        {BINGO_CHALLENGES.map((c, i) => {
          const isDone = done.includes(i);
          const inLine = lineCells.has(i);
          return (
            <button
              key={i}
              className={[
                "bingo-cell",
                isDone ? "bingo-cell--done" : "",
                inLine ? "bingo-cell--line" : ""
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onToggle(i)}
              aria-pressed={isDone}
            >
              <span className="bingo-cell__emoji">{c.emoji}</span>
              <span className="bingo-cell__text">{c.text}</span>
              {isDone && (
                <span className="bingo-cell__check">
                  <Check size={14} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className={full ? "bingo-banner bingo-banner--full" : "bingo-banner"}>
        {full
          ? "전부 깼다! 이번 여행 진짜 알차게 즐겼네 🏆"
          : lines > 0
            ? `${lines}줄 완성! 한 줄 더 노려보자 ✨`
            : "아직 시작 — 야시장 가서 첫 칸부터 깨볼까?"}
      </div>
    </div>
  );
}
