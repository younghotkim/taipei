"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { taipeiInfoCards, taipeiPhrases } from "@/lib/taipei-info";

export function TaipeiInfo() {
  const [open, setOpen] = useState(false);

  return (
    <section className={open ? "info-block info-block--open" : "info-block"}>
      <button className="info-block__head" onClick={() => setOpen((v) => !v)}>
        <span className="info-block__title">🇹🇼 타이베이 정보</span>
        <span className="info-block__sub">긴급 연락처 · 돈 · 교통 · 비상 중국어</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="info-block__body">
          {taipeiInfoCards.map((card) => (
            <div key={card.id} className="info-card">
              <h4>{card.emoji} {card.title}</h4>
              <dl>
                {card.lines.map((line) => (
                  <div key={line.label} className="info-line">
                    <dt>{line.label}</dt>
                    <dd>
                      {line.value}
                      {line.note && <em>{line.note}</em>}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}

          <div className="info-card info-card--phrases">
            <h4>🗣️ 비상 중국어</h4>
            <ul>
              {taipeiPhrases.map((p) => (
                <li key={p.zh}>
                  <span className="info-phrase__ko">{p.ko}</span>
                  <span className="info-phrase__zh">{p.zh}</span>
                  <span className="info-phrase__pinyin">{p.pinyin}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
