import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  AppData,
  Category,
  HourlyRate,
  MaintenancePackage,
  QuoteDraft,
  Service,
  Settings,
} from '../types';
import { blankService, createSeedData, newQuoteDraft } from '../data/seed';
import { loadData, normalizeData, saveData, exportJSON } from '../lib/storage';
import { uid } from '../lib/id';
import { createT, type TFunction } from '../i18n';
import { layoutRate } from '../lib/calc';

interface Store {
  data: AppData;
  t: TFunction;
  storageOk: boolean;

  // services
  createService: (values: Service) => string;
  saveService: (service: Service) => void;
  /** Apply a change to one service; bumps updatedAt. */
  patchService: (id: string, fn: (s: Service) => Service) => void;
  duplicateService: (id: string) => string | null;
  deleteService: (id: string) => void;
  toggleArchive: (id: string) => void;

  // categories
  addCategory: (name: string) => void;
  renameCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;

  // rates + maintenance
  saveRate: (rate: HourlyRate) => void;
  deleteRate: (id: string) => void;
  savePackage: (pkg: MaintenancePackage) => void;
  deletePackage: (id: string) => void;

  // settings + quote
  updateSettings: (patch: Partial<Settings>) => void;
  updateQuote: (fn: (q: QuoteDraft) => QuoteDraft) => void;
  resetQuote: () => void;

  // data
  exportData: () => string;
  importData: (raw: string) => { ok: true } | { ok: false; error: string };
  resetAll: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);
  const [storageOk, setStorageOk] = useState(true);

  // Persist every change.
  useEffect(() => {
    setStorageOk(saveData(data));
  }, [data]);

  // Reflect the theme on <html>.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', data.settings.theme === 'dark');
    document.documentElement.lang = data.settings.locale;
  }, [data.settings.theme, data.settings.locale]);

  const t = useMemo(() => createT(data.settings.locale), [data.settings.locale]);

  const patchService = useCallback((id: string, fn: (s: Service) => Service) => {
    setData((d) => ({
      ...d,
      services: d.services.map((s) => (s.id === id ? { ...fn(s), updatedAt: new Date().toISOString() } : s)),
    }));
  }, []);

  const store = useMemo<Store>(
    () => ({
      data,
      t,
      storageOk,

      createService: (values) => {
        const now = new Date().toISOString();
        const service = { ...values, id: values.id || uid('svc'), createdAt: now, updatedAt: now };
        setData((d) => ({ ...d, services: [service, ...d.services] }));
        return service.id;
      },
      saveService: (service) =>
        setData((d) => ({
          ...d,
          services: d.services.map((s) =>
            s.id === service.id ? { ...service, updatedAt: new Date().toISOString() } : s,
          ),
        })),
      patchService,
      duplicateService: (id) => {
        const original = data.services.find((s) => s.id === id);
        if (!original) return null;
        const now = new Date().toISOString();
        const copy: Service = {
          ...original,
          id: uid('svc'),
          name: `${original.name} (copy)`,
          archived: false,
          createdAt: now,
          updatedAt: now,
          tags: [...original.tags],
          features: original.features.map((f) => ({ ...f, id: uid('feat') })),
          exclusions: original.exclusions.map((x) => ({ ...x, id: uid('exc') })),
          extras: original.extras.map((x) => ({ ...x, id: uid('extra') })),
          costs: {
            ...original.costs,
            oneTime: original.costs.oneTime.map((e) => ({ ...e, id: uid('exp') })),
            recurring: original.costs.recurring.map((e) => ({ ...e, id: uid('exp') })),
          },
        };
        setData((d) => ({ ...d, services: [copy, ...d.services] }));
        return copy.id;
      },
      deleteService: (id) =>
        setData((d) => ({
          ...d,
          services: d.services.filter((s) => s.id !== id),
          quote: d.quote.serviceId === id ? { ...d.quote, serviceId: null, featureIds: [], extras: {}, basePrice: 0 } : d.quote,
        })),
      toggleArchive: (id) => patchService(id, (s) => ({ ...s, archived: !s.archived })),

      addCategory: (name) =>
        setData((d) => ({ ...d, categories: [...d.categories, { id: uid('cat'), name: name.trim() } as Category] })),
      renameCategory: (id, name) =>
        setData((d) => ({
          ...d,
          categories: d.categories.map((c) => (c.id === id ? { ...c, name: name.trim() } : c)),
        })),
      deleteCategory: (id) =>
        setData((d) =>
          d.services.some((s) => s.categoryId === id)
            ? d // never orphan services
            : { ...d, categories: d.categories.filter((c) => c.id !== id) },
        ),

      saveRate: (rate) =>
        setData((d) => ({
          ...d,
          rates: d.rates.some((r) => r.id === rate.id)
            ? d.rates.map((r) => (r.id === rate.id ? rate : r))
            : [...d.rates, rate],
        })),
      deleteRate: (id) => setData((d) => ({ ...d, rates: d.rates.filter((r) => r.id !== id) })),
      savePackage: (p) =>
        setData((d) => {
          const pkg = { ...p, updatedAt: new Date().toISOString() };
          return {
            ...d,
            maintenance: d.maintenance.some((m) => m.id === pkg.id)
              ? d.maintenance.map((m) => (m.id === pkg.id ? pkg : m))
              : [...d.maintenance, pkg],
          };
        }),
      deletePackage: (id) =>
        setData((d) => ({
          ...d,
          maintenance: d.maintenance.filter((m) => m.id !== id),
          quote: d.quote.maintenanceId === id ? { ...d.quote, maintenanceId: null, maintenancePrice: 0 } : d.quote,
        })),

      updateSettings: (patch) => setData((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
      updateQuote: (fn) => setData((d) => ({ ...d, quote: fn(d.quote) })),
      resetQuote: () => setData((d) => ({ ...d, quote: newQuoteDraft(d.settings, layoutRate(d)) })),

      exportData: () => exportJSON(data),
      importData: (raw) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          return { ok: false, error: 'That file is not valid JSON.' };
        }
        const result = normalizeData(parsed);
        if ('error' in result) return { ok: false, error: result.error };
        // Keep the current UI preferences' theme if the file has none; otherwise take the file's settings.
        setData(result.data);
        return { ok: true };
      },
      resetAll: () => setData(createSeedData()),
    }),
    [data, t, storageOk, patchService],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

export { blankService };
