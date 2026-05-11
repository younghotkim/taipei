// Travel bingo — a fixed 3×3 board of mini-challenges for the trip.
export type BingoChallenge = { emoji: string; text: string };

export const BINGO_CHALLENGES: BingoChallenge[] = [
  { emoji: "🍢", text: "야시장 새 음식 도전" },
  { emoji: "🗣️", text: "중국어 한 마디 성공" },
  { emoji: "🧋", text: "버블티 3잔 마시기" },
  { emoji: "💸", text: "노점에서 흥정해보기" },
  { emoji: "👯", text: "둘이 커플룩 입은 날" },
  { emoji: "🌃", text: "야경 사진 한 장" },
  { emoji: "🚶", text: "MRT 한 정거장 걸어가기" },
  { emoji: "🛕", text: "사원에서 소원 빌기" },
  { emoji: "😋", text: "서로 음식 먹여주기" }
];

export const BINGO_SIZE = 9;

// All winning lines in a 3×3 grid (rows, columns, diagonals).
export const BINGO_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

export function normalizeBingoDone(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<number>();
  for (const v of value) {
    if (typeof v === "number" && Number.isInteger(v) && v >= 0 && v < BINGO_SIZE) seen.add(v);
  }
  return [...seen].sort((a, b) => a - b);
}

export function completedLineIndices(done: number[]): number[] {
  const set = new Set(done);
  const out: number[] = [];
  BINGO_LINES.forEach((line, i) => {
    if (line.every((cell) => set.has(cell))) out.push(i);
  });
  return out;
}

// Set of cell indices that belong to at least one completed line.
export function cellsInCompletedLines(done: number[]): Set<number> {
  const set = new Set(done);
  const out = new Set<number>();
  for (const line of BINGO_LINES) {
    if (line.every((cell) => set.has(cell))) line.forEach((cell) => out.add(cell));
  }
  return out;
}

export function toggleBingoCell(done: number[], index: number): number[] {
  if (index < 0 || index >= BINGO_SIZE) return done;
  const set = new Set(done);
  if (set.has(index)) set.delete(index);
  else set.add(index);
  return [...set].sort((a, b) => a - b);
}
