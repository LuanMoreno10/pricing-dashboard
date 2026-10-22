import type { AppData, MaintenancePackage, QuoteDraft, QuoteExtraState, Extra, Service } from '../types';

const round2 = (n: number) => Math.round(n * 100) / 100;
const sum = (xs: number[]) => round2(xs.reduce((a, b) => a + b, 0));

/* ------------------------------------------------------------------ */
/* Service costs and effort                                            */
/* ------------------------------------------------------------------ */

export interface CostSummary {
  hours: number;
  hourlyCost: number | null;
  /** My own effort at my internal hourly cost. Internal only — never billed as an expense. */
  labourCost: number | null;
  oneTimeTotal: number;
  oneTimeCharged: number;
  oneTimeAbsorbed: number;
  recurringMonthly: number;
  recurringCharged: number;
  /** Labour + one-time third-party expenses. */
  projectCost: number | null;
  recommended: number | null;
  margin: number | null;
  effectiveRate: number | null;
}

export function computeCosts(service: Service, fallbackHourlyCost: number | null): CostSummary {
  const c = service.costs;
  const hours = service.hours ?? 0;
  const hourlyCost = c.internalHourlyCost ?? fallbackHourlyCost;
  const labourCost = hourlyCost != null && hours > 0 ? round2(hours * hourlyCost) : null;
  const oneTimeTotal = sum(c.oneTime.map((e) => e.amount));
  const oneTimeCharged = sum(c.oneTime.filter((e) => e.chargedToClient).map((e) => e.amount));
  const oneTimeAbsorbed = round2(oneTimeTotal - oneTimeCharged);
  const recurringMonthly = sum(c.recurring.map((e) => e.amount));
  const recurringCharged = sum(c.recurring.filter((e) => e.chargedToClient).map((e) => e.amount));
  const recommended = c.recommendedPrice;
  const projectCost = labourCost != null ? round2(labourCost + oneTimeTotal) : null;
  // Expenses charged on to the client cancel out; only absorbed expenses and my labour reduce the margin.
  const margin = recommended != null && labourCost != null ? round2(recommended - oneTimeAbsorbed - labourCost) : null;
  const effectiveRate = recommended != null && hours > 0 ? round2((recommended - oneTimeAbsorbed) / hours) : null;
  return {
    hours,
    hourlyCost,
    labourCost,
    oneTimeTotal,
    oneTimeCharged,
    oneTimeAbsorbed,
    recurringMonthly,
    recurringCharged,
    projectCost,
    recommended,
    margin,
    effectiveRate,
  };
}

export function featureStats(service: Service) {
  const included = service.features.filter((f) => f.included);
  return {
    total: service.features.length,
    included: included.length,
    optional: service.features.length - included.length,
    includedHours: round2(included.reduce((a, f) => a + f.hours, 0)),
  };
}

/* ------------------------------------------------------------------ */
/* Quote                                                               */
/* ------------------------------------------------------------------ */

export interface QuoteLine {
  id: string;
  label: string;
  detail?: string;
  amount: number;
}

export interface QuoteResult {
  base: number;
  extrasOneTime: QuoteLine[];
  extrasOneTimeTotal: number;
  additional: QuoteLine[];
  additionalTotal: number;
  thirdPartyOneTime: QuoteLine[];
  thirdPartyOneTimeTotal: number;
  oneTimeTotal: number;
  maintenanceName: string | null;
  recurringMaintenance: number;
  recurringExtras: QuoteLine[];
  recurringExtrasTotal: number;
  recurringThirdParty: QuoteLine[];
  recurringThirdPartyTotal: number;
  recurringTotal: number;
}

export function defaultExtraState(extra: Extra): QuoteExtraState {
  return { selected: false, price: extra.priceMin, hours: extra.hours };
}

export function extraState(draft: QuoteDraft, extra: Extra): QuoteExtraState {
  return draft.extras[extra.id] ?? defaultExtraState(extra);
}

export function computeQuote(
  draft: QuoteDraft,
  service: Service | undefined,
  maintenance: MaintenancePackage[],
): QuoteResult {
  const base = service ? draft.basePrice : 0;

  const extrasOneTime: QuoteLine[] = [];
  const recurringExtras: QuoteLine[] = [];
  const additional: QuoteLine[] = [];
  const thirdPartyOneTime: QuoteLine[] = [];
  const recurringThirdParty: QuoteLine[] = [];

  if (service) {
    for (const extra of service.extras) {
      const st = extraState(draft, extra);
      if (!st.selected) continue;
      if (extra.model === 'fixed') {
        extrasOneTime.push({ id: extra.id, label: extra.name, amount: round2(st.price) });
      } else if (extra.model === 'hourly') {
        extrasOneTime.push({
          id: extra.id,
          label: extra.name,
          detail: `${st.hours} h × ${st.price} €/h`,
          amount: round2(st.hours * st.price),
        });
      } else {
        recurringExtras.push({ id: extra.id, label: extra.name, detail: 'per month', amount: round2(st.price) });
      }
    }

    // Features that are not part of the base price but were ticked → billed as additional work.
    for (const feature of service.features) {
      if (!feature.included && draft.featureIds.includes(feature.id) && feature.hours > 0) {
        additional.push({
          id: `feat-${feature.id}`,
          label: `Added feature: ${feature.name}`,
          detail: `${feature.hours} h × ${draft.featureRate} €/h`,
          amount: round2(feature.hours * draft.featureRate),
        });
      }
    }

    if (draft.includeThirdParty) {
      for (const e of service.costs.oneTime) {
        if (e.chargedToClient && e.amount > 0) {
          thirdPartyOneTime.push({ id: e.id, label: e.name, amount: round2(e.amount) });
        }
      }
      for (const e of service.costs.recurring) {
        if (e.chargedToClient && e.amount > 0) {
          recurringThirdParty.push({ id: e.id, label: e.name, detail: 'per month', amount: round2(e.amount) });
        }
      }
    }
  }

  for (const line of draft.additional) {
    const amount = round2(line.hours * line.rate);
    if (amount === 0 && !line.description.trim()) continue;
    additional.push({
      id: line.id,
      label: line.description.trim() || 'Additional work',
      detail: `${line.hours} h × ${line.rate} €/h`,
      amount,
    });
  }

  const pkg = draft.maintenanceId ? maintenance.find((m) => m.id === draft.maintenanceId) : undefined;
  const recurringMaintenance = pkg ? round2(draft.maintenancePrice) : 0;

  const extrasOneTimeTotal = sum(extrasOneTime.map((l) => l.amount));
  const additionalTotal = sum(additional.map((l) => l.amount));
  const thirdPartyOneTimeTotal = sum(thirdPartyOneTime.map((l) => l.amount));
  const recurringExtrasTotal = sum(recurringExtras.map((l) => l.amount));
  const recurringThirdPartyTotal = sum(recurringThirdParty.map((l) => l.amount));

  return {
    base,
    extrasOneTime,
    extrasOneTimeTotal,
    additional,
    additionalTotal,
    thirdPartyOneTime,
    thirdPartyOneTimeTotal,
    // Recurring charges are deliberately NOT part of the one-time total.
    oneTimeTotal: round2(base + extrasOneTimeTotal + additionalTotal + thirdPartyOneTimeTotal),
    maintenanceName: pkg?.name ?? null,
    recurringMaintenance,
    recurringExtras,
    recurringExtrasTotal,
    recurringThirdParty,
    recurringThirdPartyTotal,
    recurringTotal: round2(recurringMaintenance + recurringExtrasTotal + recurringThirdPartyTotal),
  };
}

/** Convenience used by the quote builder to find the “layout & integrations” hourly rate. */
export function layoutRate(data: Pick<AppData, 'rates'>): number {
  const r = data.rates.find((x) => x.id === 'rate-layout' && x.rate != null) ?? data.rates.find((x) => x.kind === 'hourly' && x.rate != null);
  return r?.rate ?? 0;
}
