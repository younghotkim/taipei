export const travelerIds = ["youngha", "sohyun"] as const;
export type TravelerId = (typeof travelerIds)[number];

export type Traveler = {
  id: TravelerId;
  passportName: string;
  passportNo: string;
  nationality: string;
  birthDate: string;
  issueDate: string;
  expiryDate: string;
  passportPhotoUrl: string;
  arrivalCardUrl: string;
  notes: string;
};

export type TravelerBook = Record<TravelerId, Traveler>;

export const travelerLabels: Record<TravelerId, string> = {
  youngha: "영하",
  sohyun: "소현"
};

export function emptyTraveler(id: TravelerId): Traveler {
  return {
    id,
    passportName: "",
    passportNo: "",
    nationality: "KOR",
    birthDate: "",
    issueDate: "",
    expiryDate: "",
    passportPhotoUrl: "",
    arrivalCardUrl: "",
    notes: ""
  };
}

export function emptyTravelerBook(): TravelerBook {
  return {
    youngha: emptyTraveler("youngha"),
    sohyun: emptyTraveler("sohyun")
  };
}

function isTravelerId(value: unknown): value is TravelerId {
  return value === "youngha" || value === "sohyun";
}

export function normalizeTraveler(value: unknown, fallbackId: TravelerId): Traveler {
  const raw = value && typeof value === "object" ? (value as Partial<Traveler>) : {};
  const id = isTravelerId(raw.id) ? raw.id : fallbackId;
  return {
    id,
    passportName: typeof raw.passportName === "string" ? raw.passportName : "",
    passportNo: typeof raw.passportNo === "string" ? raw.passportNo : "",
    nationality: typeof raw.nationality === "string" ? raw.nationality : "KOR",
    birthDate: typeof raw.birthDate === "string" ? raw.birthDate : "",
    issueDate: typeof raw.issueDate === "string" ? raw.issueDate : "",
    expiryDate: typeof raw.expiryDate === "string" ? raw.expiryDate : "",
    passportPhotoUrl: typeof raw.passportPhotoUrl === "string" ? raw.passportPhotoUrl : "",
    arrivalCardUrl: typeof raw.arrivalCardUrl === "string" ? raw.arrivalCardUrl : "",
    notes: typeof raw.notes === "string" ? raw.notes : ""
  };
}

export function normalizeTravelerBook(value: unknown): TravelerBook {
  const base = emptyTravelerBook();
  if (!value) return base;
  // accept either { youngha: {...}, sohyun: {...} } or [{id:"youngha",...}, ...]
  if (Array.isArray(value)) {
    for (const entry of value) {
      const raw = entry && typeof entry === "object" ? (entry as Partial<Traveler>) : null;
      if (raw && isTravelerId(raw.id)) {
        base[raw.id] = normalizeTraveler(raw, raw.id);
      }
    }
    return base;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const id of travelerIds) {
      if (obj[id]) base[id] = normalizeTraveler(obj[id], id);
    }
  }
  return base;
}

// Returns days-until-expiry, or null if no expiry date set.
export function daysUntilExpiry(expiryDate: string): number | null {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  if (!Number.isFinite(expiry.getTime())) return null;
  const now = new Date();
  const ms = expiry.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
