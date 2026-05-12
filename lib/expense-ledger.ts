import type { ExpenseCategory, ExpenseMethod, ExpensePayer } from "./memory-types";

// A standalone expense ledger entry — for spending that doesn't belong to a
// planned stop (convenience store runs, transit top-ups, random snacks, …).
export type ExpenseEntry = {
  id: string;
  day: number; // trip day (1..N), or 0 = 날짜 미지정
  amount: number; // TWD, integer >= 0
  category: ExpenseCategory;
  payer: ExpensePayer;
  method: ExpenseMethod;
  label: string;
  at: string; // ISO timestamp
};

export type ExpenseLedger = ExpenseEntry[];

const CATEGORIES: ExpenseCategory[] = ["none", "food", "drink", "transport", "shopping", "ticket", "etc"];
const PAYERS: ExpensePayer[] = ["none", "y", "s", "shared"];
const METHODS: ExpenseMethod[] = ["unknown", "cash", "card"];

export function newExpenseId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeExpenseEntry(value: unknown): ExpenseEntry | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const c = value as Partial<ExpenseEntry>;
  if (typeof c.amount !== "number" || !Number.isFinite(c.amount)) return null;
  return {
    id: typeof c.id === "string" && c.id ? c.id : newExpenseId(),
    day: typeof c.day === "number" && Number.isFinite(c.day) ? Math.max(0, Math.round(c.day)) : 0,
    amount: Math.max(0, Math.round(c.amount)),
    category: CATEGORIES.includes(c.category as ExpenseCategory) ? (c.category as ExpenseCategory) : "none",
    payer: PAYERS.includes(c.payer as ExpensePayer) ? (c.payer as ExpensePayer) : "none",
    method: METHODS.includes(c.method as ExpenseMethod) ? (c.method as ExpenseMethod) : "unknown",
    label: typeof c.label === "string" ? c.label : "",
    at: typeof c.at === "string" ? c.at : new Date().toISOString()
  };
}

export function normalizeLedger(value: unknown): ExpenseLedger {
  if (!Array.isArray(value)) return [];
  const out: ExpenseEntry[] = [];
  for (const v of value) {
    const e = normalizeExpenseEntry(v);
    if (e) out.push(e);
  }
  return out;
}
