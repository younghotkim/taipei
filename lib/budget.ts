export type BudgetSettings = {
  targetTwd: number;
  cashStartTwd: number;
  dailyLimitTwd: number;
  notes: string;
};

export const defaultBudgetSettings: BudgetSettings = {
  targetTwd: 0,
  cashStartTwd: 0,
  dailyLimitTwd: 0,
  notes: ""
};

export function normalizeBudgetSettings(value: unknown): BudgetSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaultBudgetSettings;
  const raw = value as Partial<BudgetSettings>;
  const numberOrZero = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0;
  return {
    targetTwd: numberOrZero(raw.targetTwd),
    cashStartTwd: numberOrZero(raw.cashStartTwd),
    dailyLimitTwd: numberOrZero(raw.dailyLimitTwd),
    notes: typeof raw.notes === "string" ? raw.notes : ""
  };
}
