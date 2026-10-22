import {
  COMPLEXITIES,
  EXTRA_MODELS,
  PRICE_MODES,
  type AppData,
  type Category,
  type Expense,
  type Exclusion,
  type Extra,
  type Feature,
  type HourlyRate,
  type MaintenancePackage,
  type QuoteDraft,
  type QuoteExtraState,
  type Service,
  type Settings,
} from '../types';
import { createSeedData, defaultSettings, newQuoteDraft, DEFAULT_CATEGORIES } from '../data/seed';
import { uid } from './id';

export const STORAGE_KEY = 'pricing-dashboard:v1';

/* ---------- tiny defensive parsers (used for localStorage AND JSON import) ---------- */

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d);
const num = (v: unknown, d = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const numOrNull = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const bool = (v: unknown, d = false): boolean => (typeof v === 'boolean' ? v : d);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const oneOf = <T extends string>(v: unknown, options: readonly T[], d: T): T =>
  options.includes(v as T) ? (v as T) : d;
const objs = (v: unknown): Obj[] => list(v).filter(isObj);

function feature(o: Obj): Feature {
  return {
    id: str(o.id) || uid('feat'),
    name: str(o.name),
    description: str(o.description),
    included: bool(o.included, true),
    hours: Math.max(0, num(o.hours)),
    notes: str(o.notes),
  };
}
function exclusion(o: Obj): Exclusion {
  return { id: str(o.id) || uid('exc'), name: str(o.name), notes: str(o.notes) };
}
function extra(o: Obj): Extra {
  const min = Math.max(0, num(o.priceMin));
  return {
    id: str(o.id) || uid('extra'),
    name: str(o.name),
    description: str(o.description),
    model: oneOf(o.model, EXTRA_MODELS, 'fixed'),
    priceMin: min,
    priceMax: Math.max(min, num(o.priceMax, min)),
    hours: Math.max(0, num(o.hours)),
    notes: str(o.notes),
  };
}
function expense(o: Obj): Expense {
  return {
    id: str(o.id) || uid('exp'),
    name: str(o.name),
    amount: Math.max(0, num(o.amount)),
    chargedToClient: bool(o.chargedToClient, false),
  };
}

function service(o: Obj, fallbackCategoryId: string): Service {
  const now = new Date().toISOString();
  const costs = isObj(o.costs) ? o.costs : {};
  const min = Math.max(0, num(o.priceMin));
  const mode = oneOf(o.priceMode, PRICE_MODES, 'range');
  const max = mode === 'range' ? Math.max(min, num(o.priceMax, min)) : min;
  return {
    id: str(o.id) || uid('svc'),
    name: str(o.name, 'Untitled service'),
    categoryId: str(o.categoryId, fallbackCategoryId),
    shortDescription: str(o.shortDescription),
    description: str(o.description),
    targetClient: str(o.targetClient),
    priceMode: mode,
    priceMin: min,
    priceMax: max,
    openEnded: mode === 'range' && bool(o.openEnded),
    hours: numOrNull(o.hours),
    complexity: oneOf(o.complexity, COMPLEXITIES, 'medium'),
    tags: list(o.tags).filter((t): t is string => typeof t === 'string'),
    features: objs(o.features).map(feature),
    exclusions: objs(o.exclusions).map(exclusion),
    extras: objs(o.extras).map(extra),
    costs: {
      internalHourlyCost: numOrNull(costs.internalHourlyCost),
      oneTime: objs(costs.oneTime).map(expense),
      recurring: objs(costs.recurring).map(expense),
      recommendedPrice: numOrNull(costs.recommendedPrice),
    },
    archived: bool(o.archived),
    createdAt: str(o.createdAt, now),
    updatedAt: str(o.updatedAt, now),
  };
}

function rate(o: Obj): HourlyRate {
  return {
    id: str(o.id) || uid('rate'),
    name: str(o.name),
    kind: o.kind === 'quote' ? 'quote' : 'hourly',
    rate: numOrNull(o.rate),
    notes: str(o.notes),
  };
}

function pkg(o: Obj): MaintenancePackage {
  const min = Math.max(0, num(o.priceMin));
  return {
    id: str(o.id) || uid('maint'),
    name: str(o.name),
    priceMin: min,
    priceMax: Math.max(min, num(o.priceMax, min)),
    supportHours: Math.max(0, num(o.supportHours)),
    updatesBackups: str(o.updatesBackups),
    securityChecks: str(o.securityChecks),
    contentChanges: str(o.contentChanges),
    response: str(o.response),
    exclusions: str(o.exclusions),
    extraHourlyRate: numOrNull(o.extraHourlyRate),
    updatedAt: str(o.updatedAt, new Date().toISOString()),
  };
}

function settings(o: unknown): Settings {
  const d = defaultSettings();
  if (!isObj(o)) return d;
  return {
    theme: o.theme === 'light' ? 'light' : 'dark',
    locale: o.locale === 'pt' ? 'pt' : 'en',
    businessName: str(o.businessName, d.businessName),
    businessContact: str(o.businessContact, d.businessContact),
    defaultInternalCost: numOrNull(o.defaultInternalCost),
    quoteValidityDays: Math.max(1, Math.round(num(o.quoteValidityDays, d.quoteValidityDays))),
    disclaimer: str(o.disclaimer, d.disclaimer),
  };
}

function quote(o: unknown, s: Settings): QuoteDraft {
  const d = newQuoteDraft(s);
  if (!isObj(o)) return d;
  const extras: Record<string, QuoteExtraState> = {};
  if (isObj(o.extras)) {
    for (const [k, v] of Object.entries(o.extras)) {
      if (isObj(v)) extras[k] = { selected: bool(v.selected), price: num(v.price), hours: num(v.hours) };
    }
  }
  return {
    reference: str(o.reference, d.reference),
    clientName: str(o.clientName),
    projectTitle: str(o.projectTitle),
    projectNotes: str(o.projectNotes),
    issueDate: str(o.issueDate, d.issueDate),
    validUntil: str(o.validUntil, d.validUntil),
    serviceId: typeof o.serviceId === 'string' ? o.serviceId : null,
    basePrice: num(o.basePrice),
    featureIds: list(o.featureIds).filter((x): x is string => typeof x === 'string'),
    featureRate: num(o.featureRate, d.featureRate),
    extras,
    additional: objs(o.additional).map((l) => ({
      id: str(l.id) || uid('line'),
      description: str(l.description),
      hours: Math.max(0, num(l.hours)),
      rate: Math.max(0, num(l.rate)),
    })),
    maintenanceId: typeof o.maintenanceId === 'string' ? o.maintenanceId : null,
    maintenancePrice: num(o.maintenancePrice),
    includeThirdParty: bool(o.includeThirdParty),
    disclaimer: str(o.disclaimer, d.disclaimer),
  };
}

/**
 * Validates and normalises unknown data (from localStorage or an imported JSON file).
 * Returns an error message when the data is unusable.
 */
export function normalizeData(input: unknown): { data: AppData } | { error: string } {
  if (!isObj(input)) return { error: 'The file is not a valid catalogue (expected a JSON object).' };
  const payload = isObj(input.data) ? input.data : input;
  if (!Array.isArray(payload.services)) return { error: 'No "services" list found in this file.' };

  let categories: Category[] = objs(payload.categories)
    .map((c) => ({ id: str(c.id) || uid('cat'), name: str(c.name).trim() }))
    .filter((c) => c.name);
  if (categories.length === 0) categories = DEFAULT_CATEGORIES.map((c) => ({ ...c }));

  const known = new Set(categories.map((c) => c.id));
  const services = objs(payload.services).map((o) => {
    const s = service(o, categories[0].id);
    if (!known.has(s.categoryId)) s.categoryId = categories[0].id;
    return s;
  });

  const s = settings(payload.settings);
  return {
    data: {
      version: 1,
      services,
      categories,
      rates: objs(payload.rates).map(rate),
      maintenance: objs(payload.maintenance).map(pkg),
      settings: s,
      quote: quote(payload.quote, s),
    },
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const result = normalizeData(JSON.parse(raw));
      if ('data' in result) return result.data;
    }
  } catch {
    // Corrupted or unavailable storage: fall through to the seed data.
  }
  return createSeedData();
}

/** Returns false when the browser refuses to store (private mode, quota, blocked). */
export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function exportJSON(data: AppData): string {
  return JSON.stringify(
    {
      app: 'rate-card',
      exportedAt: new Date().toISOString(),
      data: { ...data, quote: undefined },
    },
    null,
    2,
  );
}
