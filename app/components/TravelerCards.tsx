"use client";

import { useState } from "react";
import { BookOpen, Calendar, Eye, EyeOff, Pencil, Save, ScrollText, UserCircle } from "lucide-react";
import {
  daysUntilExpiry,
  travelerIds,
  travelerLabels,
  type Traveler,
  type TravelerBook,
  type TravelerId
} from "@/lib/travelers";
import { VaultFileField } from "./VaultFileField";

function maskPassportNo(value: string): string {
  if (!value) return "—";
  if (value.length <= 4) return value;
  return `${value.slice(0, 2)}${"•".repeat(value.length - 4)}${value.slice(-2)}`;
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  // Accept either YYYY-MM-DD or full ISO; display the date portion.
  return iso.slice(0, 10);
}

function expiryStatus(expiry: string): { label: string; tone: "ok" | "soon" | "warn" } | null {
  const days = daysUntilExpiry(expiry);
  if (days === null) return null;
  if (days < 0) return { label: "만료됨", tone: "warn" };
  if (days <= 180) return { label: `만료 ${days}일 남음`, tone: "warn" };
  if (days <= 365) return { label: `만료 ${days}일 남음`, tone: "soon" };
  return { label: `만료 ${days}일 남음`, tone: "ok" };
}

export function TravelerCards({
  book,
  onSave
}: {
  book: TravelerBook;
  onSave: (id: TravelerId, traveler: Traveler) => void;
}) {
  return (
    <section className="travelers" aria-label="여행자 정보">
      <header className="travelers__head">
        <span>
          <UserCircle size={13} /> 여행자 · 여권 · 출입국심사서
        </span>
        <p>여권 정보와 입국 카드를 둘 다 보관해두면, 공항·체크인 때 바로 꺼내볼 수 있어요.</p>
      </header>
      <div className="travelers__grid">
        {travelerIds.map((id) => (
          <TravelerCard
            key={id}
            traveler={book[id]}
            onSave={(next) => onSave(id, next)}
          />
        ))}
      </div>
    </section>
  );
}

function TravelerCard({
  traveler,
  onSave
}: {
  traveler: Traveler;
  onSave: (next: Traveler) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Traveler>(traveler);
  const [showPassportNo, setShowPassportNo] = useState(false);

  // when entering edit, snapshot current value
  const startEdit = () => {
    setDraft(traveler);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(traveler);
    setEditing(false);
  };

  const save = () => {
    onSave({ ...draft, id: traveler.id });
    setEditing(false);
  };

  const update = <K extends keyof Traveler>(key: K, value: Traveler[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const status = expiryStatus(traveler.expiryDate);
  const hasPassport = Boolean(traveler.passportPhotoUrl);
  const hasArrival = Boolean(traveler.arrivalCardUrl);

  return (
    <article className={`traveler-card traveler-card--${traveler.id}`}>
      <header className="traveler-card__head">
        <div className="traveler-card__who">
          <span className="traveler-card__avatar" aria-hidden="true">
            <UserCircle size={20} />
          </span>
          <div>
            <strong>{travelerLabels[traveler.id]}</strong>
            <small>{traveler.passportName || "여권 영문 이름 미입력"}</small>
          </div>
        </div>
        {!editing && (
          <button
            type="button"
            className="traveler-card__edit"
            onClick={startEdit}
            aria-label="여권 정보 편집"
          >
            <Pencil size={13} />
            편집
          </button>
        )}
      </header>

      {!editing ? (
        <>
          <dl className="traveler-card__facts">
            <div>
              <dt><BookOpen size={11} /> 여권번호</dt>
              <dd className="traveler-card__pno">
                <span className="traveler-card__pno-val">
                  {showPassportNo ? (traveler.passportNo || "—") : maskPassportNo(traveler.passportNo)}
                </span>
                {traveler.passportNo && (
                  <button
                    type="button"
                    className="traveler-card__pno-toggle"
                    onClick={() => setShowPassportNo((v) => !v)}
                    aria-label={showPassportNo ? "여권번호 숨기기" : "여권번호 보기"}
                  >
                    {showPassportNo ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                )}
              </dd>
            </div>
            <div>
              <dt>국적</dt>
              <dd>{traveler.nationality || "—"}</dd>
            </div>
            <div>
              <dt><Calendar size={11} /> 생년월일</dt>
              <dd>{fmtDate(traveler.birthDate)}</dd>
            </div>
            <div>
              <dt>발급일</dt>
              <dd>{fmtDate(traveler.issueDate)}</dd>
            </div>
            <div>
              <dt>만료일</dt>
              <dd className={status ? `traveler-card__expiry traveler-card__expiry--${status.tone}` : "traveler-card__expiry"}>
                {fmtDate(traveler.expiryDate)}
                {status && <em>{status.label}</em>}
              </dd>
            </div>
          </dl>

          <div className="traveler-card__docs">
            <a
              className={hasPassport ? "traveler-doc traveler-doc--filled" : "traveler-doc traveler-doc--empty"}
              href={hasPassport ? traveler.passportPhotoUrl : undefined}
              target={hasPassport ? "_blank" : undefined}
              rel={hasPassport ? "noreferrer" : undefined}
              onClick={(e) => {
                if (!hasPassport) {
                  e.preventDefault();
                  startEdit();
                }
              }}
            >
              {hasPassport && /\.(jpe?g|png|webp|heic|gif)(\?|$)/i.test(traveler.passportPhotoUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={traveler.passportPhotoUrl} alt="여권 인적사항면" loading="lazy" />
              ) : (
                <span className="traveler-doc__icon">
                  <BookOpen size={20} />
                </span>
              )}
              <span className="traveler-doc__label">
                <strong>여권 인적사항면</strong>
                <em>{hasPassport ? "열기" : "사진 첨부"}</em>
              </span>
            </a>
            <a
              className={hasArrival ? "traveler-doc traveler-doc--filled" : "traveler-doc traveler-doc--empty"}
              href={hasArrival ? traveler.arrivalCardUrl : undefined}
              target={hasArrival ? "_blank" : undefined}
              rel={hasArrival ? "noreferrer" : undefined}
              onClick={(e) => {
                if (!hasArrival) {
                  e.preventDefault();
                  startEdit();
                }
              }}
            >
              {hasArrival && /\.(jpe?g|png|webp|heic|gif)(\?|$)/i.test(traveler.arrivalCardUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={traveler.arrivalCardUrl} alt="출입국심사서" loading="lazy" />
              ) : (
                <span className="traveler-doc__icon">
                  <ScrollText size={20} />
                </span>
              )}
              <span className="traveler-doc__label">
                <strong>출입국심사서</strong>
                <em>{hasArrival ? "열기" : "사진/PDF 첨부"}</em>
              </span>
            </a>
          </div>

          {traveler.notes && <p className="traveler-card__notes">{traveler.notes}</p>}
        </>
      ) : (
        <div className="traveler-edit">
          <label className="field field--wide">
            <span>영문 이름 (여권 그대로)</span>
            <input
              value={draft.passportName}
              onChange={(e) => update("passportName", e.target.value.toUpperCase())}
              placeholder="HONG GIL DONG"
              autoCapitalize="characters"
              spellCheck={false}
            />
          </label>
          <div className="traveler-edit__grid">
            <label className="field">
              <span>여권번호</span>
              <input
                value={draft.passportNo}
                onChange={(e) => update("passportNo", e.target.value.toUpperCase().replace(/\s/g, ""))}
                placeholder="M12345678"
                autoCapitalize="characters"
                spellCheck={false}
              />
            </label>
            <label className="field">
              <span>국적</span>
              <input
                value={draft.nationality}
                onChange={(e) => update("nationality", e.target.value.toUpperCase())}
                placeholder="KOR"
                autoCapitalize="characters"
                spellCheck={false}
              />
            </label>
          </div>
          <div className="traveler-edit__grid traveler-edit__grid--three">
            <label className="field">
              <span>생년월일</span>
              <input
                type="date"
                value={draft.birthDate}
                onChange={(e) => update("birthDate", e.target.value)}
              />
            </label>
            <label className="field">
              <span>발급일</span>
              <input
                type="date"
                value={draft.issueDate}
                onChange={(e) => update("issueDate", e.target.value)}
              />
            </label>
            <label className="field">
              <span>만료일</span>
              <input
                type="date"
                value={draft.expiryDate}
                onChange={(e) => update("expiryDate", e.target.value)}
              />
            </label>
          </div>
          <VaultFileField
            value={draft.passportPhotoUrl}
            itemId={`passport-${draft.id}`}
            onChange={(url) => update("passportPhotoUrl", url)}
            label="여권 인적사항면 사진 (사진 페이지)"
            addLabel="여권 사진 첨부"
          />
          <VaultFileField
            value={draft.arrivalCardUrl}
            itemId={`arrival-${draft.id}`}
            onChange={(url) => update("arrivalCardUrl", url)}
            label="대만 출입국심사서 (Arrival Card)"
            addLabel="입국 카드 첨부"
          />
          <label className="field field--wide">
            <span>메모</span>
            <textarea
              value={draft.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="비자 면제 90일, 도착지 호텔 주소, 비상 연락처 등"
            />
          </label>
          <div className="traveler-edit__actions">
            <button className="wide-link" onClick={cancel}>취소</button>
            <button className="wide-link wide-link--primary" onClick={save}>
              <Save size={15} /> 저장
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
