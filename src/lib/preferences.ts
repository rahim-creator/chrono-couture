export type Prefs = {
  typeScore: Record<string, number>;
  colorScore: Record<string, number>;
};

const KEY = "dressme:prefs";

export function getPreferences(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { typeScore: {}, colorScore: {} };
    return JSON.parse(raw) as Prefs;
  } catch {
    return { typeScore: {}, colorScore: {} };
  }
}

export function savePreferences(p: Prefs) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

export function updateWithLook(look: { items: { type: string; color: string }[] }) {
  const p = getPreferences();
  for (const it of look.items) {
    p.typeScore[it.type] = (p.typeScore[it.type] ?? 0) + 1;
    const colorKey = (it.color || "").toLowerCase();
    p.colorScore[colorKey] = (p.colorScore[colorKey] ?? 0) + 1;
  }
  savePreferences(p);
  return p;
}

export function scoreGarment(g: { type: string; color: string }, p: Prefs, weights = { type: 0.6, color: 0.4 }) {
  const t = p.typeScore[g.type] ?? 0;
  const c = p.colorScore[(g.color || "").toLowerCase()] ?? 0;
  return weights.type * t + weights.color * c;
}
