"use client";

import { useState } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { type TripStop } from "@/lib/trip-data";
import {
  expenseCategoryLabels,
  expenseMethodLabels,
  expensePayerLabels,
  getStopMemory,
  type ExpenseCategory,
  type ExpenseMethod,
  type ExpensePayer,
  type MemoryBook
} from "@/lib/memory-types";
import { type ExpenseEntry } from "@/lib/expense-ledger";
import { useItineraryContext } from "./ItineraryContext";
import { TwdKrwLabel } from "./ExpenseDashboard";
import { useConfirm } from "./ConfirmProvider";

const catEmoji: Record<ExpenseCategory, string> = {
  none: "•",
  food: "🍜",
  drink: "🧋",
  transport: "🚇",
  shopping: "🛍️",
  ticket: "🎟️",
  etc: "✨"
};

type LedgerRow =
  | {
      kind: "ledger";
      id: string;
      day: number;
      amount: number;
      category: ExpenseCategory;
      payer: ExpensePayer;
      method: ExpenseMethod;
      label: string;
      at: string;
    }
  | {
      kind: "stop";
      id: string;
      day: number;
      amount: number;
      category: ExpenseCategory;
      payer: ExpensePayer;
      method: ExpenseMethod;
      label: string;
      time: string;
      stop: TripStop;
    };

function hhmm(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function LedgerMode({
  memoryBook,
  ledger,
  todayTripDay,
  onAdd,
  onRemove,
  onSelectStop
}: {
  memoryBook: MemoryBook;
  ledger: ExpenseEntry[];
  todayTripDay: number | null;
  onAdd: (data: { day: number; amount: number; category: ExpenseCategory; payer: ExpensePayer; method: ExpenseMethod; label: string }) => void;
  onRemove: (id: string) => void;
  onSelectStop: (stop: TripStop) => void;
}) {
  const { snapshot } = useItineraryContext();
  const tripDays = snapshot.days;
  const tripStops = snapshot.stops;

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [payer, setPayer] = useState<ExpensePayer>("shared");
  const [method, setMethod] = useState<ExpenseMethod>("cash");
  const [label, setLabel] = useState("");
  const [day, setDay] = useState<number>(todayTripDay ?? tripDays[0]?.day ?? 1);
  const confirm = useConfirm();

  function submit() {
    const n = Number(amount.replace(/[^0-9]/g, ""));
    if (!n) return;
    onAdd({ day, amount: n, category, payer, method, label: label.trim() });
    setAmount("");
    setLabel("");
  }

  const stopRows: LedgerRow[] = tripStops
    .map((stop) => ({ stop, m: getStopMemory(memoryBook, stop.id) }))
    .filter((x) => x.m.expenseAmount > 0)
    .map(({ stop, m }) => ({
      kind: "stop" as const,
      id: `stop:${stop.id}`,
      day: stop.day,
      amount: m.expenseAmount,
      category: m.expenseCategory,
      payer: m.expensePayer,
      method: m.expenseMethod,
      label: stop.title,
      time: stop.time,
      stop
    }));
  const ledgerRows: LedgerRow[] = ledger.map((e) => ({ kind: "ledger" as const, ...e }));
  const allRows: LedgerRow[] = [...stopRows, ...ledgerRows];

  const total = allRows.reduce((s, r) => s + r.amount, 0);
  const split = allRows.reduce(
    (acc, r) => {
      if (r.payer === "y") acc.y += r.amount;
      else if (r.payer === "s") acc.s += r.amount;
      else if (r.payer === "shared") acc.shared += r.amount;
      else acc.unassigned += r.amount;
      return acc;
    },
    { y: 0, s: 0, shared: 0, unassigned: 0 }
  );
  const settle =
    split.y === 0 && split.s === 0
      ? "결제자 미지정"
      : split.y > split.s
        ? `소현 → 영하  TWD ${Math.round((split.y - split.s) / 2).toLocaleString()}`
        : split.s > split.y
          ? `영하 → 소현  TWD ${Math.round((split.s - split.y) / 2).toLocaleString()}`
          : "균등 — 정산 불필요";

  const byCat = new Map<ExpenseCategory, number>();
  for (const r of allRows) byCat.set(r.category, (byCat.get(r.category) ?? 0) + r.amount);
  const catList = [...byCat.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const catMax = Math.max(1, ...catList.map(([, v]) => v));

  const hasUndated = allRows.some((r) => r.day === 0);
  const dayBuckets = [...tripDays.map((d) => d.day), ...(hasUndated ? [0] : [])];

  function dayLabel(d: number) {
    if (d === 0) return "날짜 미지정";
    const td = tripDays.find((x) => x.day === d);
    return td ? `Day ${d} · ${td.date}` : `Day ${d}`;
  }
  function rowTime(r: LedgerRow): string {
    return r.kind === "stop" ? r.time : hhmm(r.at);
  }

  return (
    <div className="ledger-stage">
      <header className="ledger-head">
        <div>
          <span><Wallet size={13} /> 가계부 · LEDGER</span>
          <h1>여행 지출</h1>
          <p>편의점·교통·간식까지 — 스톱과 무관한 지출도 여기에 적어요.</p>
        </div>
      </header>

      <section className="ledger-summary">
        <div className="ledger-summary__total">
          <span>총 지출</span>
          <strong>TWD {total.toLocaleString()}</strong>
          <TwdKrwLabel twd={total} />
        </div>
        <div className="ledger-summary__split">
          <div><span>영하 결제</span><strong>{split.y.toLocaleString()}</strong></div>
          <div><span>소현 결제</span><strong>{split.s.toLocaleString()}</strong></div>
          <div><span>공동</span><strong>{split.shared.toLocaleString()}</strong></div>
          <div><span>미지정</span><strong>{split.unassigned.toLocaleString()}</strong></div>
        </div>
        <div className={`ledger-summary__settle${split.y !== split.s ? " ledger-summary__settle--due" : ""}`}>
          <span>정산</span>
          {settle}
        </div>
      </section>

      <section className="ledger-add">
        <header className="ledger-add__head">
          <Plus size={13} /> 지출 추가
        </header>
        <div className="ledger-add__main">
          <input
            className="ledger-add__amount"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="얼마 (TWD)"
            aria-label="금액"
          />
          <button className="ledger-add__submit" onClick={submit} disabled={!amount}>
            <Plus size={16} />
            추가
          </button>
        </div>
        {Number(amount) > 0 && (
          <div className="ledger-add__krw">
            TWD {Number(amount).toLocaleString()} <TwdKrwLabel twd={Number(amount)} />
          </div>
        )}
        <input
          className="ledger-add__label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="메모 — 세븐일레븐, MRT 충전, 망고빙수…"
          aria-label="메모"
        />
        <div className="ledger-add__selects">
          <label className="ledger-add__sel">
            <span>분류</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {(Object.keys(expenseCategoryLabels) as ExpenseCategory[])
                .filter((c) => c !== "none")
                .map((c) => (
                  <option key={c} value={c}>
                    {catEmoji[c]} {expenseCategoryLabels[c]}
                  </option>
                ))}
            </select>
          </label>
          <label className="ledger-add__sel">
            <span>결제자</span>
            <select value={payer} onChange={(e) => setPayer(e.target.value as ExpensePayer)}>
              {(Object.keys(expensePayerLabels) as ExpensePayer[])
                .filter((p) => p !== "none")
                .map((p) => (
                  <option key={p} value={p}>
                    {expensePayerLabels[p]}
                  </option>
                ))}
            </select>
          </label>
          <label className="ledger-add__sel">
            <span>수단</span>
            <select value={method} onChange={(e) => setMethod(e.target.value as ExpenseMethod)}>
              {(Object.keys(expenseMethodLabels) as ExpenseMethod[]).map((m) => (
                <option key={m} value={m}>
                  {expenseMethodLabels[m]}
                </option>
              ))}
            </select>
          </label>
          <label className="ledger-add__sel">
            <span>날짜</span>
            <select value={day} onChange={(e) => setDay(Number(e.target.value))}>
              {tripDays.map((d) => (
                <option key={d.day} value={d.day}>
                  Day {d.day}
                </option>
              ))}
              <option value={0}>미지정</option>
            </select>
          </label>
        </div>
      </section>

      {catList.length > 0 && (
        <section className="ledger-cats">
          {catList.map(([c, v]) => (
            <div key={c} className="ledger-cat">
              <span>{catEmoji[c]} {expenseCategoryLabels[c]}</span>
              <div className="ledger-cat__bar">
                <div style={{ width: `${(v / catMax) * 100}%` }} />
              </div>
              <strong>{v.toLocaleString()}</strong>
            </div>
          ))}
        </section>
      )}

      <section className="ledger-list">
        {allRows.length === 0 && (
          <div className="empty-state">아직 지출 기록이 없어요. 위에서 금액 넣고 “추가”를 눌러보세요.</div>
        )}
        {dayBuckets.map((d) => {
          const rows = allRows
            .filter((r) => r.day === d)
            .sort((a, b) => rowTime(a).localeCompare(rowTime(b)));
          if (rows.length === 0) return null;
          const sub = rows.reduce((s, r) => s + r.amount, 0);
          return (
            <div key={d} className="ledger-day">
              <header className="ledger-day__head">
                <strong>{dayLabel(d)}</strong>
                <span>TWD {sub.toLocaleString()}</span>
              </header>
              {rows.map((r) => (
                <div key={r.id} className={`ledger-row ledger-row--${r.kind} ledger-row--pay-${r.payer}`}>
                  <span className="ledger-row__cat" title={expenseCategoryLabels[r.category]}>
                    {catEmoji[r.category]}
                  </span>
                  <div className="ledger-row__main">
                    <strong>{r.label || (r.kind === "stop" ? "스톱 지출" : "지출")}</strong>
                    <small>
                      {r.kind === "stop" ? `${r.time || "—"} · 스톱` : hhmm(r.at) || "—"}
                      {" · "}
                      {r.payer === "none" ? "결제자 미지정" : expensePayerLabels[r.payer]}
                      {" · "}
                      {expenseMethodLabels[r.method]}
                    </small>
                  </div>
                  <span className="ledger-row__amt">{r.amount.toLocaleString()}</span>
                  {r.kind === "ledger" ? (
                    <button
                      className="ledger-row__del"
                      onClick={async () => {
                        const ok = await confirm({
                          title: "이 지출 기록을 삭제할까요?",
                          description: `${r.label || "지출"} · TWD ${r.amount.toLocaleString()} · ${expenseCategoryLabels[r.category]}`
                        });
                        if (ok) onRemove(r.id);
                      }}
                      aria-label="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : (
                    <button className="ledger-row__go" onClick={() => onSelectStop(r.stop)}>
                      기록 →
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </section>
    </div>
  );
}
