import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Archive, ArchiveRestore, ArrowLeft, Ban, Calculator, Copy, ListChecks, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useStore } from '../store/store';
import { Badge, Button, Checkbox, EmptyState, Field, IconButton, NumberInput, SectionTitle, Tabs, TextInput, Toggle } from '../components/ui';
import { ServiceFormModal } from '../components/forms/ServiceFormModal';
import { ExclusionFormModal, ExtraFormModal, FeatureFormModal } from '../components/forms/ItemForms';
import { useConfirm, useToast } from '../components/feedback';
import { computeCosts, featureStats } from '../lib/calc';
import { dateTimeLabel, eur, hoursLabel, numberLabel, priceLabel, rangeLabel } from '../lib/format';
import { STANDARD_EXCLUSIONS, STANDARD_FEATURES } from '../data/seed';
import { uid } from '../lib/id';
import type { Exclusion, Expense, Extra, Feature, Service } from '../types';

type TabId = 'overview' | 'features' | 'exclusions' | 'extras' | 'costs';
const TAB_IDS: TabId[] = ['overview', 'features', 'exclusions', 'extras', 'costs'];

export default function ServiceDetail() {
  const { id } = useParams();
  const { data, t, duplicateService, toggleArchive, deleteService } = useStore();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const [editing, setEditing] = useState(false);

  const service = data.services.find((s) => s.id === id);
  if (!service) {
    return (
      <EmptyState
        icon={Ban}
        title="Service not found"
        text="It may have been deleted."
        action={
          <Link to="/services" className="text-sm text-accent hover:underline">
            Back to services
          </Link>
        }
      />
    );
  }

  const rawTab = params.get('tab') as TabId | null;
  const tab: TabId = rawTab && TAB_IDS.includes(rawTab) ? rawTab : 'overview';
  const category = data.categories.find((c) => c.id === service.categoryId)?.name ?? '—';

  async function remove() {
    if (!service) return;
    const ok = await confirm({
      title: `Delete “${service.name}”?`,
      message: 'This permanently removes the service with all its features, exclusions, extras and cost data. This cannot be undone.',
      confirmLabel: 'Delete service',
    });
    if (ok) {
      deleteService(service.id);
      toast('Service deleted');
      navigate('/services');
    }
  }

  return (
    <>
      <Link to="/services" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg print:hidden">
        <ArrowLeft size={14} aria-hidden="true" /> {t('nav.services')}
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge>{category}</Badge>
            {service.archived && <Badge tone="warn">Archived</Badge>}
            <Badge tone="neutral">{t(`complexity.${service.complexity}`)} complexity</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{service.name}</h1>
          <p className="mt-1 text-sm text-muted">{service.shortDescription}</p>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-2xl font-semibold tabular-nums text-accent">{priceLabel(service, t('price.from'))}</span>
            <span className="text-xs text-muted">Reference price — not a guaranteed quotation</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon={Pencil} onClick={() => setEditing(true)}>
            {t('common.edit')}
          </Button>
          <Button
            icon={Copy}
            onClick={() => {
              const newId = duplicateService(service.id);
              if (newId) {
                toast('Service duplicated');
                navigate(`/services/${newId}`);
              }
            }}
          >
            {t('common.duplicate')}
          </Button>
          <Button
            icon={service.archived ? ArchiveRestore : Archive}
            onClick={() => {
              toggleArchive(service.id);
              toast(service.archived ? 'Service restored' : 'Service archived');
            }}
          >
            {service.archived ? t('common.unarchive') : t('common.archive')}
          </Button>
          <Button variant="danger" icon={Trash2} onClick={remove}>
            {t('common.delete')}
          </Button>
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={(next) => setParams(next === 'overview' ? {} : { tab: next }, { replace: true })}
        tabs={TAB_IDS.map((value) => ({ value, label: t(`detail.tab.${value}`) }))}
      />

      {tab === 'overview' && <OverviewTab service={service} />}
      {tab === 'features' && <FeaturesTab service={service} />}
      {tab === 'exclusions' && <ExclusionsTab service={service} />}
      {tab === 'extras' && <ExtrasTab service={service} />}
      {tab === 'costs' && <CostsTab service={service} />}

      {editing && (
        <ServiceFormModal
          service={service}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            toast('Service saved');
          }}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

function OverviewTab({ service }: { service: Service }) {
  const { t } = useStore();
  const stats = featureStats(service);
  const rows: [string, string][] = [
    ['Pricing type', t(`priceMode.${service.priceMode}`) + (service.openEnded ? ' (open-ended maximum)' : '')],
    ['Estimated development hours', hoursLabel(service.hours)],
    ['Complexity', t(`complexity.${service.complexity}`)],
    ['Target client', service.targetClient || '—'],
    ['Last updated', dateTimeLabel(service.updatedAt)],
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-6">
        <section className="card p-5">
          <SectionTitle>Description</SectionTitle>
          <p className="whitespace-pre-line text-sm leading-relaxed">{service.description || <span className="text-muted">No detailed description yet. Use Edit to add one.</span>}</p>
        </section>
        <section className="card p-5">
          <SectionTitle>Tags & technologies</SectionTitle>
          {service.tags.length ? (
            <div className="flex flex-wrap gap-1.5">
              {service.tags.map((tag) => (
                <span key={tag} className="rounded bg-surface2 px-2 py-1 text-xs">
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No tags.</p>
          )}
        </section>
      </div>
      <div className="space-y-6">
        <section className="card p-5">
          <SectionTitle>Details</SectionTitle>
          <dl className="space-y-3 text-sm">
            {rows.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="mt-0.5">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="card p-5">
          <SectionTitle>At a glance</SectionTitle>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted">Included features</dt>
              <dd className="text-lg font-semibold">{stats.included}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Optional features</dt>
              <dd className="text-lg font-semibold">{stats.optional}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Exclusions</dt>
              <dd className="text-lg font-semibold">{service.exclusions.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Optional extras</dt>
              <dd className="text-lg font-semibold">{service.extras.length}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Features                                                            */
/* ------------------------------------------------------------------ */

function FeaturesTab({ service }: { service: Service }) {
  const { patchService } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const [form, setForm] = useState<{ feature?: Feature } | null>(null);
  const stats = featureStats(service);

  const setFeatures = (fn: (f: Feature[]) => Feature[]) => patchService(service.id, (s) => ({ ...s, features: fn(s.features) }));

  async function remove(f: Feature) {
    const ok = await confirm({ title: `Remove “${f.name}”?`, message: 'This feature will be removed from the service.', confirmLabel: 'Remove feature' });
    if (ok) {
      setFeatures((list) => list.filter((x) => x.id !== f.id));
      toast('Feature removed');
    }
  }

  const missing = STANDARD_FEATURES.filter((name) => !service.features.some((f) => f.name.toLowerCase() === name.toLowerCase()));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <strong className="font-medium text-fg">{stats.included}</strong> included in the base price ({numberLabel(stats.includedHours)} h) · <strong className="font-medium text-fg">{stats.optional}</strong> optional
        </p>
        <Button icon={Plus} variant="primary" onClick={() => setForm({})}>
          Add feature
        </Button>
      </div>

      {service.features.length === 0 ? (
        <EmptyState icon={ListChecks} title="No features listed" text="Define what this package includes. Every service has its own list." action={<Button icon={Plus} onClick={() => setForm({})}>Add feature</Button>} />
      ) : (
        <ul className="card divide-y divide-border">
          {service.features.map((f) => (
            <li key={f.id} className="flex flex-wrap items-start gap-3 p-4 sm:flex-nowrap">
              <div className="pt-0.5">
                <Toggle
                  checked={f.included}
                  label={`${f.name}: included by default`}
                  onChange={(c) => setFeatures((list) => list.map((x) => (x.id === f.id ? { ...x, included: c } : x)))}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{f.name}</span>
                  <Badge tone={f.included ? 'accent' : 'neutral'}>{f.included ? 'Included' : 'Optional'}</Badge>
                </div>
                {f.description && <p className="mt-0.5 text-sm text-muted">{f.description}</p>}
                {f.notes && <p className="mt-1 text-xs italic text-muted">Note: {f.notes}</p>}
              </div>
              <div className="w-16 shrink-0 text-right text-sm tabular-nums text-muted">{hoursLabel(f.hours)}</div>
              <div className="flex shrink-0">
                <IconButton icon={Pencil} label={`Edit ${f.name}`} onClick={() => setForm({ feature: f })} />
                <IconButton icon={Trash2} tone="danger" label={`Remove ${f.name}`} onClick={() => remove(f)} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {missing.length > 0 && (
        <div className="mt-6">
          <SectionTitle>Quick add</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {missing.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setFeatures((list) => [...list, { id: uid('feat'), name, description: '', included: true, hours: 0, notes: '' }])}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
              >
                <Plus size={12} aria-hidden="true" /> {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {form && (
        <FeatureFormModal
          feature={form.feature}
          onClose={() => setForm(null)}
          onSave={(f) => {
            setFeatures((list) => (list.some((x) => x.id === f.id) ? list.map((x) => (x.id === f.id ? f : x)) : [...list, f]));
            setForm(null);
            toast('Feature saved');
          }}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Exclusions                                                          */
/* ------------------------------------------------------------------ */

function ExclusionsTab({ service }: { service: Service }) {
  const { patchService } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const [form, setForm] = useState<{ exclusion?: Exclusion } | null>(null);
  const setItems = (fn: (x: Exclusion[]) => Exclusion[]) => patchService(service.id, (s) => ({ ...s, exclusions: fn(s.exclusions) }));
  const missing = STANDARD_EXCLUSIONS.filter((name) => !service.exclusions.some((x) => x.name.toLowerCase() === name.toLowerCase()));

  async function remove(x: Exclusion) {
    const ok = await confirm({ title: `Remove “${x.name}”?`, message: 'It will no longer appear as an exclusion for this service.', confirmLabel: 'Remove' });
    if (ok) {
      setItems((list) => list.filter((i) => i.id !== x.id));
      toast('Exclusion removed');
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">What is not covered by the price, plus any assumptions. Shown on printed quotes.</p>
        <Button icon={Plus} variant="primary" onClick={() => setForm({})}>
          Add exclusion
        </Button>
      </div>

      {service.exclusions.length === 0 ? (
        <EmptyState icon={Ban} title="No exclusions defined" text="Be explicit about what is outside the price — it avoids misunderstandings later." action={<Button icon={Plus} onClick={() => setForm({})}>Add exclusion</Button>} />
      ) : (
        <ul className="card divide-y divide-border">
          {service.exclusions.map((x) => (
            <li key={x.id} className="flex items-start gap-3 p-4">
              <Ban size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{x.name}</div>
                {x.notes && <p className="mt-0.5 text-sm text-muted">{x.notes}</p>}
              </div>
              <IconButton icon={Pencil} label={`Edit ${x.name}`} onClick={() => setForm({ exclusion: x })} />
              <IconButton icon={Trash2} tone="danger" label={`Remove ${x.name}`} onClick={() => remove(x)} />
            </li>
          ))}
        </ul>
      )}

      {missing.length > 0 && (
        <div className="mt-6">
          <SectionTitle>Quick add</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {missing.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setItems((list) => [...list, { id: uid('exc'), name, notes: '' }])}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
              >
                <Plus size={12} aria-hidden="true" /> {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {form && (
        <ExclusionFormModal
          exclusion={form.exclusion}
          onClose={() => setForm(null)}
          onSave={(x) => {
            setItems((list) => (list.some((i) => i.id === x.id) ? list.map((i) => (i.id === x.id ? x : i)) : [...list, x]));
            setForm(null);
            toast('Exclusion saved');
          }}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Extras                                                              */
/* ------------------------------------------------------------------ */

function extraPrice(x: Extra): string {
  const suffix = x.model === 'hourly' ? '/h' : x.model === 'recurring' ? '/month' : '';
  return rangeLabel(x.priceMin, x.priceMax, suffix);
}

function ExtrasTab({ service }: { service: Service }) {
  const { patchService, t } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const [form, setForm] = useState<{ extra?: Extra } | null>(null);
  const setExtras = (fn: (x: Extra[]) => Extra[]) => patchService(service.id, (s) => ({ ...s, extras: fn(s.extras) }));

  async function remove(x: Extra) {
    const ok = await confirm({ title: `Remove “${x.name}”?`, message: 'This optional extra will be deleted from the service.', confirmLabel: 'Remove extra' });
    if (ok) {
      setExtras((list) => list.filter((i) => i.id !== x.id));
      toast('Extra removed');
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Optional upgrades the client can add on top of the base price.</p>
        <Button icon={Plus} variant="primary" onClick={() => setForm({})}>
          Add extra
        </Button>
      </div>

      {service.extras.length === 0 ? (
        <EmptyState icon={Sparkles} title="No optional extras" text="Add upgrades like extra pages, languages or integrations." action={<Button icon={Plus} onClick={() => setForm({})}>Add extra</Button>} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {service.extras.map((x) => (
            <li key={x.id} className="card flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{x.name}</div>
                  <Badge className="mt-1.5" tone={x.model === 'recurring' ? 'warn' : 'neutral'}>
                    {t(`extraModel.${x.model}`)}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums text-accent">{extraPrice(x)}</div>
                  {x.hours > 0 && <div className="text-xs text-muted">≈ {hoursLabel(x.hours)}</div>}
                </div>
              </div>
              {x.description && <p className="mt-2 text-sm text-muted">{x.description}</p>}
              {x.notes && <p className="mt-1 text-xs italic text-muted">Note: {x.notes}</p>}
              <div className="mt-auto flex justify-end pt-3">
                <IconButton icon={Pencil} label={`Edit ${x.name}`} onClick={() => setForm({ extra: x })} />
                <IconButton icon={Trash2} tone="danger" label={`Remove ${x.name}`} onClick={() => remove(x)} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {form && (
        <ExtraFormModal
          extra={form.extra}
          onClose={() => setForm(null)}
          onSave={(x) => {
            setExtras((list) => (list.some((i) => i.id === x.id) ? list.map((i) => (i.id === x.id ? x : i)) : [...list, x]));
            setForm(null);
            toast('Extra saved');
          }}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Costs & effort                                                      */
/* ------------------------------------------------------------------ */

function ExpenseEditor({ title, hint, items, suffix, onChange }: { title: string; hint: string; items: Expense[]; suffix: string; onChange: (items: Expense[]) => void }) {
  const confirm = useConfirm();
  async function remove(e: Expense) {
    const ok = await confirm({ title: `Remove “${e.name || 'this expense'}”?`, message: 'The expense will be deleted from this service’s cost estimate.', confirmLabel: 'Remove' });
    if (ok) onChange(items.filter((i) => i.id !== e.id));
  }
  return (
    <section className="card p-5">
      <SectionTitle
        actions={
          <Button size="sm" icon={Plus} onClick={() => onChange([...items, { id: uid('exp'), name: '', amount: 0, chargedToClient: true }])}>
            Add
          </Button>
        }
      >
        {title}
      </SectionTitle>
      <p className="-mt-1 mb-3 text-xs text-muted">{hint}</p>
      {items.length === 0 ? (
        <p className="py-3 text-sm text-muted">None recorded.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((e) => (
            <li key={e.id} className="rounded-md border border-border p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_9rem_auto]">
                <TextInput aria-label="Expense name" placeholder="e.g. Premium plugin licence" value={e.name} onChange={(ev) => onChange(items.map((i) => (i.id === e.id ? { ...i, name: ev.target.value } : i)))} />
                <NumberInput aria-label="Expense amount" value={e.amount} suffix={suffix} onChange={(n) => onChange(items.map((i) => (i.id === e.id ? { ...i, amount: Math.max(0, n ?? 0) } : i)))} />
                <IconButton icon={Trash2} tone="danger" label="Remove expense" onClick={() => remove(e)} />
              </div>
              <div className="mt-2">
                <Checkbox
                  checked={e.chargedToClient}
                  onChange={(c) => onChange(items.map((i) => (i.id === e.id ? { ...i, chargedToClient: c } : i)))}
                  label={<span className="text-xs text-muted">Charged on to the client (otherwise absorbed by me)</span>}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-1.5 text-sm ${strong ? 'font-semibold' : ''} ${muted ? 'text-muted' : ''}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function CostsTab({ service }: { service: Service }) {
  const { data, patchService } = useStore();
  const costs = computeCosts(service, data.settings.defaultInternalCost);
  const setCosts = (patch: Partial<Service['costs']>) => patchService(service.id, (s) => ({ ...s, costs: { ...s.costs, ...patch } }));
  const dash = (n: number | null) => (n == null ? '—' : eur(n));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-6">
        <section className="card p-5">
          <SectionTitle>Your effort</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Estimated development hours">
              <NumberInput value={service.hours} suffix="h" onChange={(n) => patchService(service.id, (s) => ({ ...s, hours: n == null ? null : Math.max(0, n) }))} aria-label="Estimated development hours" />
            </Field>
            <Field label="Internal hourly cost" hint={service.costs.internalHourlyCost == null && data.settings.defaultInternalCost != null ? `Using default ${eur(data.settings.defaultInternalCost)}/h` : 'Optional'}>
              <NumberInput value={service.costs.internalHourlyCost} suffix="€/h" onChange={(n) => setCosts({ internalHourlyCost: n == null ? null : Math.max(0, n) })} aria-label="Internal hourly cost" />
            </Field>
            <Field label="Recommended selling price" hint="Optional">
              <NumberInput value={service.costs.recommendedPrice} suffix="EUR" onChange={(n) => setCosts({ recommendedPrice: n == null ? null : Math.max(0, n) })} aria-label="Recommended selling price" />
            </Field>
          </div>
        </section>

        <ExpenseEditor
          title="One-time third-party expenses"
          hint="Licences, assets or services bought once for this project."
          items={service.costs.oneTime}
          suffix="EUR"
          onChange={(oneTime) => setCosts({ oneTime })}
        />
        <ExpenseEditor
          title="Recurring external expenses"
          hint="Monthly costs such as hosting or a paid service."
          items={service.costs.recurring}
          suffix="€/mo"
          onChange={(recurring) => setCosts({ recurring })}
        />
      </div>

      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <section className="card p-5">
          <SectionTitle>Internal labour</SectionTitle>
          <p className="mb-2 text-xs text-muted">Your own development effort. This is an internal figure, never billed as an expense.</p>
          <Row label="Hours" value={hoursLabel(costs.hours || null)} muted />
          <Row label="Hourly cost" value={costs.hourlyCost == null ? 'Not set' : `${eur(costs.hourlyCost)}/h`} muted />
          <div className="my-1 border-t border-border" />
          <Row strong label="Estimated labour cost" value={dash(costs.labourCost)} />
        </section>

        <section className="card p-5">
          <SectionTitle>Third-party expenses</SectionTitle>
          <p className="mb-2 text-xs text-muted">Money paid out to others, separate from your own time.</p>
          <Row label="One-time total" value={eur(costs.oneTimeTotal)} />
          <Row label="· charged to client" value={eur(costs.oneTimeCharged)} muted />
          <Row label="· absorbed by me" value={eur(costs.oneTimeAbsorbed)} muted />
          <Row label="Recurring per month" value={eur(costs.recurringMonthly)} />
          <Row label="· charged to client" value={eur(costs.recurringCharged)} muted />
        </section>

        <section className="card border-accent/30 p-5">
          <SectionTitle>Project summary</SectionTitle>
          <Row label="Labour + one-time expenses" value={dash(costs.projectCost)} strong />
          <Row label="Recommended selling price" value={dash(costs.recommended)} />
          <Row label="Reference range" value={priceLabel(service)} muted />
          <div className="my-1 border-t border-border" />
          <Row strong label="Estimated margin" value={dash(costs.margin)} />
          <Row label="Effective hourly rate" value={costs.effectiveRate == null ? '—' : `${eur(costs.effectiveRate)}/h`} muted />
          {(costs.labourCost == null || costs.recommended == null) && (
            <p className="mt-3 flex items-start gap-2 text-xs text-muted">
              <Calculator size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              Add hours, an hourly cost (here or in Settings) and a recommended price to see the margin. These estimates are optional.
            </p>
          )}
        </section>
      </aside>
    </div>
  );
}
