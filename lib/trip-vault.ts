export type VaultKind = "flight" | "hotel" | "activity" | "transport" | "esim" | "insurance" | "document" | "other";
export type VaultStatus = "confirmed" | "pending" | "cancelled";
export type VaultOwner = "shared" | "youngha" | "sohyun";

export type VaultItem = {
  id: string;
  kind: VaultKind;
  title: string;
  provider: string;
  confirmation: string;
  flightNo: string;
  startAt: string;
  location: string;
  link: string;
  amount: number;
  owner: VaultOwner;
  status: VaultStatus;
  notes: string;
  documentUrl: string;
};

export type VaultBook = VaultItem[];

const KINDS: VaultKind[] = ["flight", "hotel", "activity", "transport", "esim", "insurance", "document", "other"];
const STATUSES: VaultStatus[] = ["confirmed", "pending", "cancelled"];
const OWNERS: VaultOwner[] = ["shared", "youngha", "sohyun"];

export const vaultKindLabels: Record<VaultKind, string> = {
  flight: "항공",
  hotel: "숙소",
  activity: "예약/투어",
  transport: "교통",
  esim: "eSIM",
  insurance: "보험",
  document: "문서",
  other: "기타"
};

export const vaultStatusLabels: Record<VaultStatus, string> = {
  confirmed: "확정",
  pending: "확인 필요",
  cancelled: "취소"
};

export const vaultOwnerLabels: Record<VaultOwner, string> = {
  shared: "공동",
  youngha: "영하",
  sohyun: "소현"
};

export function newVaultId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyVaultItem(): VaultItem {
  return {
    id: newVaultId(),
    kind: "activity",
    title: "",
    provider: "",
    confirmation: "",
    flightNo: "",
    startAt: "",
    location: "",
    link: "",
    amount: 0,
    owner: "shared",
    status: "confirmed",
    notes: "",
    documentUrl: ""
  };
}

export function normalizeVaultItem(value: unknown): VaultItem | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Partial<VaultItem>;
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : newVaultId(),
    kind: KINDS.includes(raw.kind as VaultKind) ? (raw.kind as VaultKind) : "other",
    title: typeof raw.title === "string" ? raw.title : "",
    provider: typeof raw.provider === "string" ? raw.provider : "",
    confirmation: typeof raw.confirmation === "string" ? raw.confirmation : "",
    flightNo: typeof raw.flightNo === "string" ? raw.flightNo : "",
    startAt: typeof raw.startAt === "string" ? raw.startAt : "",
    location: typeof raw.location === "string" ? raw.location : "",
    link: typeof raw.link === "string" ? raw.link : "",
    amount: typeof raw.amount === "number" && Number.isFinite(raw.amount) ? Math.max(0, Math.round(raw.amount)) : 0,
    owner: OWNERS.includes(raw.owner as VaultOwner) ? (raw.owner as VaultOwner) : "shared",
    status: STATUSES.includes(raw.status as VaultStatus) ? (raw.status as VaultStatus) : "confirmed",
    notes: typeof raw.notes === "string" ? raw.notes : "",
    documentUrl: typeof raw.documentUrl === "string" ? raw.documentUrl : ""
  };
}

export function normalizeVaultBook(value: unknown): VaultBook {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeVaultItem).filter((item): item is VaultItem => item !== null);
}
