export type PriceMode = 'range' | 'fixed' | 'starting';
export type Complexity = 'low' | 'medium' | 'high' | 'very-high';
export type ExtraModel = 'fixed' | 'hourly' | 'recurring';
export type Theme = 'dark' | 'light';
export type Locale = 'en' | 'pt';

export const PRICE_MODES: readonly PriceMode[] = ['range', 'fixed', 'starting'];
export const COMPLEXITIES: readonly Complexity[] = ['low', 'medium', 'high', 'very-high'];
export const EXTRA_MODELS: readonly ExtraModel[] = ['fixed', 'hourly', 'recurring'];

export interface Category {
  id: string;
  name: string;
}

/** A deliverable or feature that may be part of the base price. */
export interface Feature {
  id: string;
  name: string;
  description: string;
  /** Included in the base price by default. */
  included: boolean;
  hours: number;
  notes: string;
}

/** Something explicitly NOT covered by the price (or an assumption). */
export interface Exclusion {
  id: string;
  name: string;
  notes: string;
}

/**
 * Optional upgrade.
 * - fixed: priceMin–priceMax is a one-off price
 * - hourly: priceMin–priceMax is the hourly rate, `hours` the estimated extra hours
 * - recurring: priceMin–priceMax is a monthly fee
 */
export interface Extra {
  id: string;
  name: string;
  description: string;
  model: ExtraModel;
  priceMin: number;
  priceMax: number;
  hours: number;
  notes: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  /** Charged on to the client (appears in quotes) rather than absorbed by me. */
  chargedToClient: boolean;
}

export interface ServiceCosts {
  /** Internal hourly cost. Empty = fall back to the default in Settings. */
  internalHourlyCost: number | null;
  /** One-time third-party expenses. */
  oneTime: Expense[];
  /** Recurring external expenses, per month. */
  recurring: Expense[];
  recommendedPrice: number | null;
}

export interface Service {
  id: string;
  name: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  targetClient: string;
  priceMode: PriceMode;
  priceMin: number;
  priceMax: number;
  /** For ranges: the upper bound is open-ended and is shown with a "+". */
  openEnded: boolean;
  hours: number | null;
  complexity: Complexity;
  tags: string[];
  features: Feature[];
  exclusions: Exclusion[];
  extras: Extra[];
  costs: ServiceCosts;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HourlyRate {
  id: string;
  name: string;
  /** hourly = a rate per hour (may be unset); quote = fixed quote based on scope. */
  kind: 'hourly' | 'quote';
  rate: number | null;
  notes: string;
}

export interface MaintenancePackage {
  id: string;
  name: string;
  priceMin: number;
  priceMax: number;
  supportHours: number;
  updatesBackups: string;
  securityChecks: string;
  contentChanges: string;
  response: string;
  exclusions: string;
  extraHourlyRate: number | null;
  updatedAt: string;
}

export interface Settings {
  theme: Theme;
  locale: Locale;
  businessName: string;
  businessContact: string;
  defaultInternalCost: number | null;
  quoteValidityDays: number;
  disclaimer: string;
}

export interface QuoteExtraState {
  selected: boolean;
  price: number;
  hours: number;
}

export interface AdditionalLine {
  id: string;
  description: string;
  hours: number;
  rate: number;
}

export interface QuoteDraft {
  reference: string;
  clientName: string;
  projectTitle: string;
  projectNotes: string;
  issueDate: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  serviceId: string | null;
  basePrice: number;
  featureIds: string[];
  /** Hourly rate applied to features ticked that are not part of the base price. */
  featureRate: number;
  extras: Record<string, QuoteExtraState>;
  additional: AdditionalLine[];
  maintenanceId: string | null;
  maintenancePrice: number;
  includeThirdParty: boolean;
  disclaimer: string;
}

export interface AppData {
  version: 1;
  services: Service[];
  categories: Category[];
  rates: HourlyRate[];
  maintenance: MaintenancePackage[];
  settings: Settings;
  quote: QuoteDraft;
}
