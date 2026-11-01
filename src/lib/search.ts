import type { IndexEntry } from "../types";

/** Fold case and German letters so "Wasserflusse" finds "Wasserflüsse". */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’'`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Search by title, German first line, BWV number or Riemenschneider number.
 * "244", "BWV 244.54", "R 74" and "riemenschneider 74" all work.
 */
export function searchChorales(list: IndexEntry[], query: string): IndexEntry[] {
  const q = fold(query);
  if (!q) return list;
  const num = /^(?:(bwv)\s*)?(?:(r|riem\w*)\s*)?(\d+(?:[.\-]\d+)*)$/.exec(q);
  if (num) {
    const [, bwv, riem, n] = num;
    return list.filter((c) => {
      const byBwv = c.bwv === n || c.bwv.startsWith(`${n}.`);
      const byRiem = String(c.riemenschneider) === n;
      if (bwv) return byBwv;
      if (riem) return byRiem;
      return byBwv || byRiem;
    });
  }
  return list.filter((c) => fold(`${c.title} ${c.firstLine} ${c.translation} ${c.source}`).includes(q));
}

/** True when two German lines differ only in apostrophes, case or accents. */
export function sameText(a: string, b: string): boolean {
  return fold(a).replace(/[,;:.!]/g, "") === fold(b).replace(/[,;:.!]/g, "");
}
