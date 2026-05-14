"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import {
  emptyPackItem,
  packCategoryEmoji,
  packCategoryLabels,
  packCategoryOrder,
  newPackId,
  type PackCategory,
  type PackItem
} from "@/lib/packing";
import { useConfirm } from "./ConfirmProvider";

export function PackingList({
  items,
  onToggle,
  onAdd,
  onRemove,
  onReset
}: {
  items: PackItem[];
  onToggle: (id: string) => void;
  onAdd: (item: PackItem) => void;
  onRemove: (id: string) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftCat, setDraftCat] = useState<PackCategory>("etc");
  const confirm = useConfirm();

  const packed = items.filter((i) => i.packed).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((packed / total) * 100) : 0;

  const grouped = packCategoryOrder
    .map((cat) => ({ cat, list: items.filter((i) => i.category === cat) }))
    .filter((g) => g.list.length > 0);

  const submit = () => {
    const label = draftLabel.trim();
    if (!label) return;
    onAdd({ ...emptyPackItem(draftCat), id: newPackId(), label });
    setDraftLabel("");
  };

  return (
    <section className={open ? "pack-block pack-block--open" : "pack-block"}>
      <button className="pack-block__head" onClick={() => setOpen((v) => !v)}>
        <span className="pack-block__title">🧳 준비물 체크리스트</span>
        <span className="pack-block__count">
          {total > 0 ? `${packed}/${total} 챙김` : "목록 준비 중"}
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {total > 0 && (
        <div className="pack-block__bar">
          <div style={{ width: `${pct}%` }} />
        </div>
      )}

      {open && (
        <div className="pack-block__body">
          {grouped.map(({ cat, list }) => (
            <div key={cat} className="pack-group">
              <h4>
                {packCategoryEmoji[cat]} {packCategoryLabels[cat]}
                <span>{list.filter((i) => i.packed).length}/{list.length}</span>
              </h4>
              <ul>
                {list.map((item) => (
                  <li key={item.id} className={item.packed ? "pack-row pack-row--done" : "pack-row"}>
                    <label>
                      <input type="checkbox" checked={item.packed} onChange={() => onToggle(item.id)} />
                      <span>{item.label}</span>
                    </label>
                    <button
                      className="pack-row__del"
                      onClick={async () => {
                        const ok = await confirm({
                          title: "이 준비물을 목록에서 뺄까요?",
                          description: `"${item.label}" — ${packCategoryLabels[item.category]}`
                        });
                        if (ok) onRemove(item.id);
                      }}
                      aria-label="삭제"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="pack-add">
            <select value={draftCat} onChange={(e) => setDraftCat(e.target.value as PackCategory)} aria-label="분류">
              {packCategoryOrder.map((cat) => (
                <option key={cat} value={cat}>{packCategoryEmoji[cat]} {packCategoryLabels[cat]}</option>
              ))}
            </select>
            <input
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder="추가할 준비물 (예: 멀미약, 카메라 SD카드)"
              aria-label="준비물"
            />
            <button className="pack-add__submit" onClick={submit} disabled={!draftLabel.trim()}>
              <Plus size={15} />
            </button>
          </div>

          <button
            className="pack-reset"
            onClick={async () => {
              const ok = await confirm({
                title: "준비물 목록을 기본값으로 되돌릴까요?",
                description: "지금까지 추가·수정한 항목과 체크 표시는 모두 사라져요.",
                confirmLabel: "초기화"
              });
              if (ok) onReset();
            }}
          >
            <RotateCcw size={13} />
            기본 목록으로 초기화
          </button>
        </div>
      )}
    </section>
  );
}
