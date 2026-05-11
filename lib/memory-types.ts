export type CommentAuthor = "youngha" | "sohyun";

export type Comment = {
  id: string;
  author: CommentAuthor;
  text: string;
  at: string; // ISO timestamp
};

export const authorLabels: Record<CommentAuthor, string> = {
  youngha: "영하",
  sohyun: "소현"
};

export const authorInitials: Record<CommentAuthor, string> = {
  youngha: "영",
  sohyun: "소"
};

export type ExpenseCategory = "none" | "food" | "drink" | "transport" | "shopping" | "ticket" | "etc";
export type ExpensePayer = "none" | "y" | "s" | "shared";

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  none: "미지정",
  food: "음식",
  drink: "술/카페",
  transport: "교통",
  shopping: "쇼핑",
  ticket: "입장/예약",
  etc: "기타"
};

export const expensePayerLabels: Record<ExpensePayer, string> = {
  none: "결제자",
  y: "영하",
  s: "소현",
  shared: "공동"
};

export type Memory = {
  visited: boolean;
  status: "planned" | "going" | "done" | "skipped";
  rating: number; // legacy combined rating — kept for back-compat; UI now uses ratingY/ratingS
  ratingY: number; // 영하's star rating, 0–5
  ratingS: number; // 소현's star rating, 0–5
  note: string;
  comments: Comment[];
  photoUrl: string;
  photos: string[];
  expenseAmount: number;
  expenseCategory: ExpenseCategory;
  expensePayer: ExpensePayer;
  skippedReason: string;
  updatedAt?: string;
};

export type MemoryBook = Record<string, Memory>;

export function newCommentId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Single rating value for displays that want one number: average of whoever rated, else the legacy field. */
export function combinedRating(m: Pick<Memory, "ratingY" | "ratingS" | "rating">): number {
  const given = [m.ratingY, m.ratingS].filter((v) => v > 0);
  if (given.length === 0) return m.rating || 0;
  return Math.round((given.reduce((a, b) => a + b, 0) / given.length) * 10) / 10;
}

export function emptyMemory(): Memory {
  return {
    visited: false,
    status: "planned",
    rating: 0,
    ratingY: 0,
    ratingS: 0,
    note: "",
    comments: [],
    photoUrl: "",
    photos: [],
    expenseAmount: 0,
    expenseCategory: "none",
    expensePayer: "none",
    skippedReason: ""
  };
}

export function getStopMemory(book: MemoryBook, stopId: string) {
  return normalizeMemory(book[stopId]);
}

export function isMemoryBook(value: unknown): value is MemoryBook {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((entry) => isMemory(entry));
}

export function isMemory(value: unknown): value is Memory {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<Memory>;
  return (
    typeof candidate.visited === "boolean" &&
    typeof candidate.rating === "number" &&
    typeof candidate.note === "string" &&
    typeof candidate.photoUrl === "string"
  );
}

function normalizeComments(raw: unknown, legacy: { yComment?: unknown; sComment?: unknown }): Comment[] {
  const list: Comment[] = [];
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (!entry || typeof entry !== "object") continue;
      const c = entry as Partial<Comment>;
      const author: CommentAuthor =
        c.author === "youngha" || c.author === "sohyun" ? c.author : "youngha";
      if (typeof c.text !== "string" || !c.text.trim()) continue;
      list.push({
        id: typeof c.id === "string" ? c.id : newCommentId(),
        author,
        text: c.text,
        at: typeof c.at === "string" ? c.at : new Date(0).toISOString()
      });
    }
  }
  // Migrate the old single-field comments if no thread exists yet.
  if (list.length === 0) {
    if (typeof legacy.yComment === "string" && legacy.yComment.trim()) {
      list.push({ id: newCommentId(), author: "youngha", text: legacy.yComment, at: new Date(0).toISOString() });
    }
    if (typeof legacy.sComment === "string" && legacy.sComment.trim()) {
      list.push({ id: newCommentId(), author: "sohyun", text: legacy.sComment, at: new Date(0).toISOString() });
    }
  }
  return list;
}

export function normalizeMemory(value: unknown): Memory {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyMemory();
  }

  const candidate = value as Partial<Memory> & { yComment?: unknown; sComment?: unknown };
  const base = emptyMemory();
  const status =
    candidate.status === "going" ||
    candidate.status === "done" ||
    candidate.status === "skipped" ||
    candidate.status === "planned"
      ? candidate.status
      : candidate.visited
        ? "done"
        : base.status;
  const expenseCategory =
    candidate.expenseCategory === "food" ||
    candidate.expenseCategory === "drink" ||
    candidate.expenseCategory === "transport" ||
    candidate.expenseCategory === "shopping" ||
    candidate.expenseCategory === "ticket" ||
    candidate.expenseCategory === "etc" ||
    candidate.expenseCategory === "none"
      ? candidate.expenseCategory
      : base.expenseCategory;

  const photos = Array.isArray(candidate.photos)
    ? candidate.photos.filter((entry): entry is string => typeof entry === "string")
    : base.photos;
  const expensePayer =
    candidate.expensePayer === "y" ||
    candidate.expensePayer === "s" ||
    candidate.expensePayer === "shared" ||
    candidate.expensePayer === "none"
      ? candidate.expensePayer
      : base.expensePayer;

  const clampStar = (v: unknown): number => {
    if (typeof v !== "number" || !Number.isFinite(v)) return 0;
    return Math.max(0, Math.min(5, Math.round(v)));
  };

  return {
    visited: Boolean(candidate.visited || status === "done"),
    status,
    rating: typeof candidate.rating === "number" ? candidate.rating : base.rating,
    ratingY: clampStar(candidate.ratingY),
    ratingS: clampStar(candidate.ratingS),
    note: typeof candidate.note === "string" ? candidate.note : base.note,
    comments: normalizeComments(candidate.comments, {
      yComment: candidate.yComment,
      sComment: candidate.sComment
    }),
    photoUrl: typeof candidate.photoUrl === "string" ? candidate.photoUrl : base.photoUrl,
    photos,
    expenseAmount:
      typeof candidate.expenseAmount === "number" ? candidate.expenseAmount : base.expenseAmount,
    expenseCategory,
    expensePayer,
    skippedReason:
      typeof candidate.skippedReason === "string" ? candidate.skippedReason : base.skippedReason,
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : undefined
  };
}
