"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, MapPin, Save, Trash2 } from "lucide-react";
import {
  categoryLabels,
  priorityLabels,
  type StopPlanMeta,
  type TripCategory,
  type TripDay,
  type TripPriority,
  type TripStop
} from "@/lib/trip-data";
import { useConfirm } from "./ConfirmProvider";

type StopForm = {
  time: string;
  title: string;
  subtitle: string;
  nameZh: string;
  mrt: string;
  phrase: string;
  category: TripCategory;
  lat: string;
  lng: string;
  highlights: string;
  prompt: string;
  mapsQuery: string;
  priority: TripPriority;
  durationMinutes: string;
  alternatives: string;
  flexTip: string;
  openingHours: string;
  bookingStatus: string;
  riskLevel: "low" | "medium" | "high";
  riskNote: string;
};

function toForm(stop: TripStop, plan: StopPlanMeta): StopForm {
  return {
    time: stop.time,
    title: stop.title,
    subtitle: stop.subtitle,
    nameZh: stop.nameZh,
    mrt: stop.mrt,
    phrase: stop.phrase,
    category: stop.category,
    lat: String(stop.lat),
    lng: String(stop.lng),
    highlights: stop.highlights.join(", "),
    prompt: stop.prompt,
    mapsQuery: stop.mapsQuery,
    priority: plan.priority,
    durationMinutes: String(plan.durationMinutes),
    alternatives: plan.alternatives.join(", "),
    flexTip: plan.flexTip,
    openingHours: plan.openingHours ?? "",
    bookingStatus: plan.bookingStatus ?? "",
    riskLevel: plan.riskLevel ?? "low",
    riskNote: plan.riskNote ?? ""
  };
}

function fromForm(stop: TripStop, form: StopForm): { stop: TripStop; plan: StopPlanMeta } {
  const splitList = (value: string) =>
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  return {
    stop: {
      ...stop,
      time: form.time.trim(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      nameZh: form.nameZh.trim(),
      mrt: form.mrt.trim(),
      phrase: form.phrase.trim(),
      category: form.category,
      lat: Number(form.lat) || stop.lat,
      lng: Number(form.lng) || stop.lng,
      highlights: splitList(form.highlights),
      prompt: form.prompt.trim(),
      mapsQuery: form.mapsQuery.trim() || form.title.trim()
    },
    plan: {
      priority: form.priority,
      durationMinutes: Number(form.durationMinutes) || 0,
      alternatives: splitList(form.alternatives),
      flexTip: form.flexTip.trim(),
      openingHours: form.openingHours.trim(),
      bookingStatus: form.bookingStatus.trim(),
      riskLevel: form.riskLevel,
      riskNote: form.riskNote.trim()
    }
  };
}

export function StopEditor({
  stop,
  plan,
  sortOrder,
  days,
  onSave,
  onArchive,
  onMoveToDay,
  pendingPin
}: {
  stop: TripStop;
  plan: StopPlanMeta;
  sortOrder: number;
  days: TripDay[];
  onSave: (stop: TripStop, plan: StopPlanMeta, sortOrder: number) => Promise<boolean>;
  onArchive: (stopId: string) => Promise<boolean>;
  onMoveToDay: (stopId: string, day: number) => void;
  pendingPin: { lat: number; lng: number } | null;
}) {
  const [form, setForm] = useState<StopForm>(() => toForm(stop, plan));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const confirm = useConfirm();

  // When a different stop is selected, reset the form.
  useEffect(() => {
    setForm(toForm(stop, plan));
    setDirty(false);
  }, [stop.id]);

  // When the user clicks the map to set a pin, fill lat/lng.
  useEffect(() => {
    if (pendingPin) {
      setForm((current) => ({
        ...current,
        lat: pendingPin.lat.toFixed(6),
        lng: pendingPin.lng.toFixed(6)
      }));
      setDirty(true);
    }
  }, [pendingPin]);

  const update = <K extends keyof StopForm>(key: K, value: StopForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { stop: nextStop, plan: nextPlan } = fromForm(stop, form);
    const ok = await onSave(nextStop, nextPlan, sortOrder);
    setSaving(false);
    if (ok) setDirty(false);
  };

  return (
    <div className="stop-editor">
      <div className="stop-editor__head">
        <strong>스톱 편집</strong>
        <div className="stop-editor__head-actions">
          <button
            className="stop-editor__archive"
            onClick={async () => {
              const ok = await confirm({
                title: `"${stop.title}" 스톱을 일정에서 뺄까요?`,
                description: "스톱 자체만 일정에서 사라지고, 기록·사진·코멘트는 보존돼요.",
                confirmLabel: "제거"
              });
              if (ok) void onArchive(stop.id);
            }}
            title="일정에서 제거"
          >
            <Trash2 size={14} />
          </button>
          <button className="stop-editor__save" onClick={handleSave} disabled={saving || !dirty}>
            {saving ? <Loader2 size={14} className="weather-bar__spinner" /> : <Save size={14} />}
            {saving ? "저장 중" : dirty ? "저장" : "저장됨"}
          </button>
        </div>
      </div>

      <div className="stop-editor__grid">
        <label className="field field--narrow">
          <span>시간</span>
          <input value={form.time} onChange={(e) => update("time", e.target.value)} placeholder="14:00" />
        </label>
        <label className="field field--narrow">
          <span>체류(분)</span>
          <input
            inputMode="numeric"
            value={form.durationMinutes}
            onChange={(e) => update("durationMinutes", e.target.value.replace(/[^0-9]/g, ""))}
          />
        </label>
        <label className="field field--wide">
          <span>제목</span>
          <input value={form.title} onChange={(e) => update("title", e.target.value)} />
        </label>
      </div>

      <label className="field">
        <span>한 줄 설명</span>
        <input value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} />
      </label>

      <div className="stop-editor__grid">
        <label className="field">
          <span>中文 명칭</span>
          <input value={form.nameZh} onChange={(e) => update("nameZh", e.target.value)} />
        </label>
        <label className="field">
          <span>MRT</span>
          <input value={form.mrt} onChange={(e) => update("mrt", e.target.value)} />
        </label>
      </div>

      <label className="field">
        <span>현장 한 마디 (中文)</span>
        <input value={form.phrase} onChange={(e) => update("phrase", e.target.value)} />
      </label>

      <div className="stop-editor__grid">
        <label className="field">
          <span>카테고리</span>
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value as TripCategory)}
          >
            {(Object.keys(categoryLabels) as TripCategory[]).map((category) => (
              <option key={category} value={category}>
                {categoryLabels[category]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>우선순위</span>
          <select
            value={form.priority}
            onChange={(e) => update("priority", e.target.value as TripPriority)}
          >
            {(Object.keys(priorityLabels) as TripPriority[]).map((priority) => (
              <option key={priority} value={priority}>
                {priorityLabels[priority]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Day 이동</span>
          <select value={stop.day} onChange={(e) => onMoveToDay(stop.id, Number(e.target.value))}>
            {days.map((day) => (
              <option key={day.day} value={day.day}>
                Day {day.day} · {day.date}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="stop-editor__location">
        <MapPin size={14} />
        <div className="stop-editor__grid">
          <label className="field field--narrow">
            <span>위도</span>
            <input value={form.lat} onChange={(e) => update("lat", e.target.value)} />
          </label>
          <label className="field field--narrow">
            <span>경도</span>
            <input value={form.lng} onChange={(e) => update("lng", e.target.value)} />
          </label>
        </div>
        <p className="stop-editor__hint">지도를 클릭하면 좌표가 자동 입력됩니다.</p>
      </div>

      <label className="field">
        <span>하이라이트 (쉼표로 구분)</span>
        <input value={form.highlights} onChange={(e) => update("highlights", e.target.value)} />
      </label>

      <label className="field">
        <span>대안 (쉼표로 구분)</span>
        <input value={form.alternatives} onChange={(e) => update("alternatives", e.target.value)} />
      </label>

      <label className="field">
        <span>프롬프트 (기록 가이드)</span>
        <textarea value={form.prompt} onChange={(e) => update("prompt", e.target.value)} rows={2} />
      </label>

      <label className="field">
        <span>현장 조정 팁</span>
        <textarea value={form.flexTip} onChange={(e) => update("flexTip", e.target.value)} rows={2} />
      </label>

      <div className="stop-editor__grid">
        <label className="field">
          <span>영업시간</span>
          <input value={form.openingHours} onChange={(e) => update("openingHours", e.target.value)} placeholder="예: 11:00-21:30 / 월 휴무" />
        </label>
        <label className="field">
          <span>예약/티켓</span>
          <input value={form.bookingStatus} onChange={(e) => update("bookingStatus", e.target.value)} placeholder="예: 예약 완료, 현장 대기" />
        </label>
      </div>

      <div className="stop-editor__grid">
        <label className="field">
          <span>리스크</span>
          <select value={form.riskLevel} onChange={(e) => update("riskLevel", e.target.value as StopForm["riskLevel"])}>
            <option value="low">낮음</option>
            <option value="medium">주의</option>
            <option value="high">높음</option>
          </select>
        </label>
        <label className="field field--wide">
          <span>리스크 메모</span>
          <input value={form.riskNote} onChange={(e) => update("riskNote", e.target.value)} placeholder="예: 웨이팅 길면 대체, 라스트오더 확인" />
        </label>
      </div>

      <label className="field">
        <span>Google Maps 검색어</span>
        <input value={form.mapsQuery} onChange={(e) => update("mapsQuery", e.target.value)} />
      </label>
    </div>
  );
}

export function DayEditor({
  day,
  sortOrder,
  onSave
}: {
  day: TripDay;
  sortOrder: number;
  onSave: (day: TripDay, sortOrder: number) => Promise<boolean>;
}) {
  const [date, setDate] = useState(day.date);
  const [title, setTitle] = useState(day.title);
  const [mood, setMood] = useState(day.mood);
  const [summary, setSummary] = useState(day.summary);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setDate(day.date);
    setTitle(day.title);
    setMood(day.mood);
    setSummary(day.summary);
    setDirty(false);
  }, [day.day]);

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave({ day: day.day, date, title, mood, summary }, sortOrder);
    setSaving(false);
    if (ok) setDirty(false);
  };

  return (
    <div className={open ? "day-editor day-editor--open" : "day-editor"}>
      <button className="day-editor__toggle" onClick={() => setOpen((v) => !v)}>
        <strong>Day {day.day} 메타</strong>
        {!open && <em className="day-editor__hint">{dirty ? "● 저장 안 됨" : "날짜·타이틀·무드"}</em>}
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <>
          <div className="stop-editor__grid">
            <label className="field field--narrow">
              <span>날짜</span>
              <input
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setDirty(true);
                }}
                placeholder="5/15 금"
              />
            </label>
            <label className="field field--wide">
              <span>타이틀</span>
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setDirty(true);
                }}
              />
            </label>
          </div>
          <label className="field">
            <span>무드</span>
            <input
              value={mood}
              onChange={(e) => {
                setMood(e.target.value);
                setDirty(true);
              }}
            />
          </label>
          <label className="field">
            <span>요약</span>
            <textarea
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                setDirty(true);
              }}
              rows={2}
            />
          </label>
          <button className="stop-editor__save day-editor__save" onClick={handleSave} disabled={saving || !dirty}>
            {saving ? <Loader2 size={14} className="weather-bar__spinner" /> : <Save size={14} />}
            {saving ? "저장 중" : dirty ? "저장" : "저장됨"}
          </button>
        </>
      )}
    </div>
  );
}
