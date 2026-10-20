import type { CompanyProfile, Strategy } from "./types";

const KEY = "benely:state";
export interface SavedState { profile: CompanyProfile; strategy: Strategy }

export function loadState(): SavedState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedState) : null;
  } catch {
    return null;
  }
}

export function saveState(s: SavedState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* stockage indisponible */ }
}
