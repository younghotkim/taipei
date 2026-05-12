export type PackCategory = "docs" | "money" | "tech" | "clothes" | "toiletries" | "meds" | "etc";
export type PackOwner = "shared" | "youngha" | "sohyun";

export type PackItem = {
  id: string;
  label: string;
  category: PackCategory;
  owner: PackOwner;
  packed: boolean;
};

export type PackBook = PackItem[];

const CATEGORIES: PackCategory[] = ["docs", "money", "tech", "clothes", "toiletries", "meds", "etc"];
const OWNERS: PackOwner[] = ["shared", "youngha", "sohyun"];

export const packCategoryLabels: Record<PackCategory, string> = {
  docs: "서류·필수",
  money: "돈·카드",
  tech: "전자기기",
  clothes: "의류",
  toiletries: "세면·화장품",
  meds: "약·위생",
  etc: "기타"
};

export const packCategoryEmoji: Record<PackCategory, string> = {
  docs: "🛂",
  money: "💳",
  tech: "🔌",
  clothes: "👕",
  toiletries: "🧴",
  meds: "💊",
  etc: "✨"
};

export const packOwnerLabels: Record<PackOwner, string> = {
  shared: "공동",
  youngha: "영하",
  sohyun: "소현"
};

export const packCategoryOrder = CATEGORIES;

export function newPackId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// 타이베이 5월(따뜻·습함·소나기 가능) 2인 여행 기준 기본 체크리스트.
const PRESET: Array<{ label: string; category: PackCategory }> = [
  { label: "여권 (유효기간 6개월 이상)", category: "docs" },
  { label: "여권 사본 / 사진 (분실 대비)", category: "docs" },
  { label: "항공권 e-티켓 / 탑승권", category: "docs" },
  { label: "숙소 예약 확인서", category: "docs" },
  { label: "여행자 보험 증서", category: "docs" },
  { label: "국제운전면허증 (필요시)", category: "docs" },
  { label: "TWD 환전 (소액 현금)", category: "money" },
  { label: "해외 결제용 카드 (트래블월렛/카드)", category: "money" },
  { label: "悠遊卡(EasyCard) — 현지 구매 가능", category: "money" },
  { label: "휴대폰 + 케이스", category: "tech" },
  { label: "보조배터리 (기내 휴대)", category: "tech" },
  { label: "충전기 + 케이블 (C타입/라이트닝)", category: "tech" },
  { label: "멀티 어댑터 (대만 110V, A/B타입)", category: "tech" },
  { label: "eSIM 설치 / 포켓 와이파이", category: "tech" },
  { label: "이어폰", category: "tech" },
  { label: "반팔·얇은 옷 (낮 25~30℃)", category: "clothes" },
  { label: "얇은 겉옷 / 가디건 (실내 냉방·밤)", category: "clothes" },
  { label: "편한 운동화 (많이 걸음)", category: "clothes" },
  { label: "샌들 / 슬리퍼", category: "clothes" },
  { label: "속옷·양말 (일수+여유분)", category: "clothes" },
  { label: "잠옷", category: "clothes" },
  { label: "수영복 (온천/호텔 수영장)", category: "clothes" },
  { label: "접이식 우산 / 우비 (소나기)", category: "clothes" },
  { label: "선글라스 · 모자", category: "clothes" },
  { label: "칫솔·치약", category: "toiletries" },
  { label: "선크림 (자외선 강함)", category: "toiletries" },
  { label: "기초 화장품 / 클렌징", category: "toiletries" },
  { label: "샴푸·바디워시 (소분, 호텔 제공 확인)", category: "toiletries" },
  { label: "면도기", category: "toiletries" },
  { label: "물티슈 · 손소독제", category: "toiletries" },
  { label: "상비약 (소화제·지사제·진통제·밴드)", category: "meds" },
  { label: "개인 처방약 + 처방전", category: "meds" },
  { label: "모기 기피제 / 모기 물린 데 바르는 약", category: "meds" },
  { label: "마스크 (몇 장)", category: "meds" },
  { label: "에코백 / 보조 가방", category: "etc" },
  { label: "지퍼백 · 비닐봉지 (젖은 옷·간식)", category: "etc" },
  { label: "텀블러 / 물통", category: "etc" },
  { label: "안대 · 목베개 (기내)", category: "etc" },
  { label: "필기구 · 입국신고서용 펜", category: "etc" }
];

export function presetPackBook(): PackBook {
  return PRESET.map((entry) => ({
    id: newPackId(),
    label: entry.label,
    category: entry.category,
    owner: "shared" as PackOwner,
    packed: false
  }));
}

export function emptyPackItem(category: PackCategory = "etc"): PackItem {
  return { id: newPackId(), label: "", category, owner: "shared", packed: false };
}

export function normalizePackItem(value: unknown): PackItem | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Partial<PackItem>;
  const label = typeof raw.label === "string" ? raw.label.trim() : "";
  if (!label) return null;
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : newPackId(),
    label,
    category: CATEGORIES.includes(raw.category as PackCategory) ? (raw.category as PackCategory) : "etc",
    owner: OWNERS.includes(raw.owner as PackOwner) ? (raw.owner as PackOwner) : "shared",
    packed: Boolean(raw.packed)
  };
}

export function normalizePackBook(value: unknown): PackBook {
  if (!Array.isArray(value)) return [];
  return value.map(normalizePackItem).filter((item): item is PackItem => item !== null);
}
