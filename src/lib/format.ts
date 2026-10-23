/**
 * format.ts — the one number/date formatter for stats contexts
 * (DESIGN-SPEC §1.5). Stats print with an apostrophe thousands
 * separator (1'317, 220'017); decimals use a period; date ranges use
 * ISO dates joined by an arrow. Stack contexts deliberately do NOT use
 * this module (plain integers there — §3.4).
 */

/** Apostrophe-grouped integer: 1317 → "1'317", 220017 → "220'017". */
export function fmtInt(n: number): string {
  const sign = n < 0 ? '-' : '';
  const digits = String(Math.abs(Math.trunc(n)));
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

/** ISO date range: ("2026-01-01", "2026-10-15") → "2026-01-01 → 2026-10-15". */
export function fmtDateRange(fromIso: string, toIso: string): string {
  return `${fromIso.slice(0, 10)} → ${toIso.slice(0, 10)}`;
}

/** "2026-10-22T07:03:11.782Z" → "2026-10-22" (date part only). */
export function isoDay(iso: string): string {
  return iso.slice(0, 10);
}
