import type { Service } from '../types';

// Portuguese (Portugal) conventions: "1 500,50 €", dates as dd/mm/yyyy.
const LOCALE = 'pt-PT';

function currencyFormatter(fraction: number): Intl.NumberFormat {
  const options = {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
    useGrouping: 'always', // pt-PT skips grouping for 4-digit numbers by default; keep "1 500 €" readable
  };
  return new Intl.NumberFormat(LOCALE, options as unknown as Intl.NumberFormatOptions);
}

const eur0 = currencyFormatter(0);
const eur2 = currencyFormatter(2);
const num = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });
const dateFmt = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function eur(value: number): string {
  const v = Math.round(value * 100) / 100;
  return Number.isInteger(v) ? eur0.format(v) : eur2.format(v);
}

export function hoursLabel(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${num.format(value)} h`;
}

export function numberLabel(value: number): string {
  return num.format(value);
}

/** Parses "YYYY-MM-DD" as a local date (avoids UTC off-by-one). */
export function parseISODate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function dateLabel(iso: string): string {
  const d = parseISODate(iso);
  return d ? dateFmt.format(d) : '—';
}

export function dateTimeLabel(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  return Number.isNaN(d.getTime()) ? '—' : dateTimeFmt.format(d);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso) ?? new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function priceLabel(
  s: Pick<Service, 'priceMode' | 'priceMin' | 'priceMax' | 'openEnded'>,
  fromWord = 'From',
): string {
  if (s.priceMode === 'fixed') return eur(s.priceMin);
  if (s.priceMode === 'starting') return `${fromWord} ${eur(s.priceMin)}`;
  return `${eur(s.priceMin)} – ${eur(s.priceMax)}${s.openEnded ? '+' : ''}`;
}

export function rangeLabel(min: number, max: number, suffix = ''): string {
  return min === max ? `${eur(min)}${suffix}` : `${eur(min)} – ${eur(max)}${suffix}`;
}
