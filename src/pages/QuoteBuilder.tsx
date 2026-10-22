import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, Plus, Printer, RotateCcw, Trash2 } from 'lucide-react';
import { useStore } from '../store/store';
import { Badge, Button, Checkbox, EmptyState, Field, IconButton, NumberInput, PageHeader, Select, TextArea, TextInput } from '../components/ui';
import { useConfirm, useToast } from '../components/feedback';
import { computeQuote, extraState, type QuoteLine, type QuoteResult } from '../lib/calc';
import { dateLabel, eur, hoursLabel, numberLabel, parseISODate, priceLabel, rangeLabel } from '../lib/format';
import { uid } from '../lib/id';
import type { Extra, QuoteDraft, Service } from '../types';

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="card p-5" aria-label={`Step ${n}: ${title}`}>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent" aria-hidden="true">
          {n}
        </span>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function SumRow({ label, value, detail, strong, muted }: { label: string; value: string; detail?: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-1 text-sm ${strong ? 'font-semibold' : ''} ${muted ? 'text-muted' : ''}`}>
      <span className="min-w-0">
        {label}
        {detail && <span className="block text-xs font-normal text-muted">{detail}</span>}
      </span>
      <span className="shrink-0 tabular-nums">{value}</span>
    </div>
  );
}

function Lines({ lines }: { lines: QuoteLine[] }) {
  return (
    <>
      {lines.map((l) => (
        <SumRow key={l.id} label={l.label} detail={l.detail} value={eur(l.amount)} muted />
      ))}
    </>
  );
}

export default function QuoteBuilder() {
  const { data, t, updateQuote, resetQuote } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const [attempted, setAttempted] = useState(false);

  const q = data.quote;
  const activeServices = data.services.filter((s) => !s.archived || s.id === q.serviceId);
  const service = data.services.find((s) => s.id === q.serviceId);
  const result = computeQuote(q, service, data.maintenance);
  const pkg = data.maintenance.find((m) => m.id === q.maintenanceId);
  const hourlyRates = data.rates.filter((r) => r.kind === 'hourly' && r.rate != null);

  const set = (patch: Partial<QuoteDraft>) => updateQuote((d) => ({ ...d, ...patch }));

  function chooseService(id: string) {
    const s = data.services.find((x) => x.id === id);
    if (!s) {
      set({ serviceId: null, basePrice: 0, featureIds: [], extras: {} });
      return;
    }
    set({ serviceId: s.id, basePrice: s.priceMin, featureIds: s.features.filter((f) => f.included).map((f) => f.id), extras: {} });
  }

  function patchExtra(extra: Extra, patch: Partial<ReturnType<typeof extraState>>) {
    updateQuote((d) => ({ ...d, extras: { ...d.extras, [extra.id]: { ...extraState(d, extra), ...patch } } }));
  }

  function chooseMaintenance(id: string) {
    const m = data.maintenance.find((x) => x.id === id);
    set(m ? { maintenanceId: m.id, maintenancePrice: m.priceMin } : { maintenanceId: null, maintenancePrice: 0 });
  }

  // Validation that gates printing.
  const issue = parseISODate(q.issueDate);
  const until = parseISODate(q.validUntil);
  const errors = {
    service: !service ? 'Select a service to quote.' : undefined,
    client: !q.clientName.trim() ? 'Enter the client name.' : undefined,
    validUntil: !until ? 'Choose a validity date.' : issue && until < issue ? 'The validity date must be on or after the issue date.' : undefined,
    issueDate: !issue ? 'Choose an issue date.' : undefined,
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const show = <K extends keyof typeof errors>(k: K) => (attempted ? errors[k] : undefined);

  function print() {
    setAttempted(true);
    if (hasErrors) {
      toast('Complete the highlighted fields before printing.', 'error');
      return;
    }
    window.print();
  }

  async function startNew() {
    const ok = await confirm({
      title: 'Start a new quote?',
      message: 'The current quote — client details, selections and notes — will be cleared.',
      confirmLabel: 'Start new quote',
      danger: true,
    });
    if (ok) {
      resetQuote();
      setAttempted(false);
      toast('New quote started');
    }
  }

  if (data.services.length === 0) {
    return (
      <>
        <PageHeader title={t('quote.title')} description={t('quote.subtitle')} />
        <EmptyState
          icon={Calculator}
          title="No services to quote"
          text="Create a service first, then come back to prepare a quote."
          action={
            <Link to="/services" className="text-sm text-accent hover:underline">
              Go to services
            </Link>
          }
        />
      </>
    );
  }

  const nonDefaultFeatures = service?.features.filter((f) => !f.included) ?? [];
  const anyAddedFeature = nonDefaultFeatures.some((f) => q.featureIds.includes(f.id));

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title={t('quote.title')}
          description={t('quote.subtitle')}
          actions={
            <>
              <Button icon={RotateCcw} onClick={startNew}>
                {t('quote.reset')}
              </Button>
              <Button variant="primary" icon={Printer} onClick={print}>
                {t('quote.print')}
              </Button>
            </>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <div className="space-y-5">
            {/* 1. Service */}
            <Step n={1} title="Select a service" hint="The base price is editable — it defaults to the bottom of the reference range.">
              <Field label="Service" required error={show('service')}>
                <Select value={q.serviceId ?? ''} invalid={!!show('service')} onChange={(e) => chooseService(e.target.value)}>
                  <option value="">Choose a service…</option>
                  {activeServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {priceLabel(s, t('price.from'))}
                    </option>
                  ))}
                </Select>
              </Field>
              {service && (
                <div className="mt-4 grid gap-3 sm:grid-cols-[14rem_1fr] sm:items-end">
                  <Field label="Base price for this client" hint={`Reference: ${priceLabel(service, t('price.from'))}`}>
                    <NumberInput value={q.basePrice} suffix="EUR" onChange={(n) => set({ basePrice: Math.max(0, n ?? 0) })} aria-label="Base price" />
                  </Field>
                  <div className="flex flex-wrap gap-2 pb-0.5">
                    <Button size="sm" onClick={() => set({ basePrice: service.priceMin })}>
                      Minimum
                    </Button>
                    {service.priceMode === 'range' && service.priceMax !== service.priceMin && (
                      <>
                        <Button size="sm" onClick={() => set({ basePrice: Math.round((service.priceMin + service.priceMax) / 2) })}>
                          Midpoint
                        </Button>
                        <Button size="sm" onClick={() => set({ basePrice: service.priceMax })}>
                          Maximum
                        </Button>
                      </>
                    )}
                    {(q.basePrice < service.priceMin || (service.priceMode === 'range' && !service.openEnded && q.basePrice > service.priceMax)) && <Badge tone="warn">Outside reference range</Badge>}
                  </div>
                </div>
              )}
            </Step>

            {service && (
              <>
                {/* 2. Features */}
                <Step n={2} title="Choose the relevant features" hint="Included features are covered by the base price. Optional ones you tick are billed as additional work.">
                  {service.features.length === 0 ? (
                    <p className="text-sm text-muted">This service has no features defined. Add them on the service page.</p>
                  ) : (
                    <ul className="divide-y divide-border rounded-md border border-border">
                      {service.features.map((f) => {
                        const checked = q.featureIds.includes(f.id);
                        return (
                          <li key={f.id} className="flex items-start justify-between gap-3 p-3">
                            <Checkbox
                              checked={checked}
                              onChange={(c) => set({ featureIds: c ? [...q.featureIds, f.id] : q.featureIds.filter((x) => x !== f.id) })}
                              label={
                                <span>
                                  <span className="font-medium">{f.name}</span>
                                  {f.description && <span className="block text-xs text-muted">{f.description}</span>}
                                </span>
                              }
                            />
                            <span className="shrink-0 text-right text-xs text-muted">
                              {f.included ? <Badge tone="accent">In base price</Badge> : f.hours > 0 ? `+${hoursLabel(f.hours)} × ${eur(q.featureRate)}/h` : 'Optional'}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {anyAddedFeature && (
                    <div className="mt-4 max-w-[14rem]">
                      <Field label="Hourly rate for added features">
                        <NumberInput value={q.featureRate} suffix="€/h" onChange={(n) => set({ featureRate: Math.max(0, n ?? 0) })} aria-label="Hourly rate for added features" />
                      </Field>
                    </div>
                  )}
                </Step>

                {/* 3. Extras */}
                <Step n={3} title="Add optional extras" hint="Fixed and hourly extras are one-time. Recurring fees go to the monthly total.">
                  {service.extras.length === 0 ? (
                    <p className="text-sm text-muted">This service has no optional extras. Add some on the service page.</p>
                  ) : (
                    <ul className="space-y-2">
                      {service.extras.map((x) => {
                        const st = extraState(q, x);
                        return (
                          <li key={x.id} className={`rounded-md border p-3 ${st.selected ? 'border-accent/50 bg-accent/5' : 'border-border'}`}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <Checkbox
                                checked={st.selected}
                                onChange={(c) => patchExtra(x, { selected: c })}
                                label={
                                  <span>
                                    <span className="font-medium">{x.name}</span>
                                    <Badge className="ml-2" tone={x.model === 'recurring' ? 'warn' : 'neutral'}>
                                      {t(`extraModel.${x.model}`)}
                                    </Badge>
                                  </span>
                                }
                              />
                              <span className="text-xs text-muted">
                                Reference {rangeLabel(x.priceMin, x.priceMax, x.model === 'hourly' ? '/h' : x.model === 'recurring' ? '/month' : '')}
                              </span>
                            </div>
                            {st.selected && (
                              <div className="mt-3 flex flex-wrap gap-3">
                                <Field label={x.model === 'hourly' ? 'Hourly rate' : x.model === 'recurring' ? 'Monthly fee' : 'Price'} className="w-40">
                                  <NumberInput value={st.price} suffix={x.model === 'hourly' ? '€/h' : x.model === 'recurring' ? '€/mo' : 'EUR'} onChange={(n) => patchExtra(x, { price: Math.max(0, n ?? 0) })} aria-label={`${x.name} price`} />
                                </Field>
                                {x.model === 'hourly' && (
                                  <Field label="Estimated hours" className="w-36">
                                    <NumberInput value={st.hours} suffix="h" onChange={(n) => patchExtra(x, { hours: Math.max(0, n ?? 0) })} aria-label={`${x.name} hours`} />
                                  </Field>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Step>
              </>
            )}

            {/* 4. Additional work */}
            <Step n={4} title="Additional estimated work" hint="Extra hours outside the package, billed at the rate you choose.">
              {q.additional.length === 0 ? (
                <p className="mb-3 text-sm text-muted">No additional work added.</p>
              ) : (
                <ul className="mb-3 space-y-2">
                  {q.additional.map((line) => (
                    <li key={line.id} className="grid gap-2 sm:grid-cols-[1fr_7rem_8rem_auto]">
                      <TextInput aria-label="Description" placeholder="Description" value={line.description} onChange={(e) => set({ additional: q.additional.map((l) => (l.id === line.id ? { ...l, description: e.target.value } : l)) })} />
                      <NumberInput aria-label="Hours" suffix="h" value={line.hours} onChange={(n) => set({ additional: q.additional.map((l) => (l.id === line.id ? { ...l, hours: Math.max(0, n ?? 0) } : l)) })} />
                      <NumberInput aria-label="Hourly rate" suffix="€/h" value={line.rate} onChange={(n) => set({ additional: q.additional.map((l) => (l.id === line.id ? { ...l, rate: Math.max(0, n ?? 0) } : l)) })} />
                      <IconButton icon={Trash2} tone="danger" label="Remove line" onClick={() => set({ additional: q.additional.filter((l) => l.id !== line.id) })} />
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" icon={Plus} onClick={() => set({ additional: [...q.additional, { id: uid('line'), description: '', hours: 1, rate: q.featureRate }] })}>
                  Add line
                </Button>
                {hourlyRates.map((r) => (
                  <Button key={r.id} size="sm" variant="ghost" onClick={() => set({ additional: [...q.additional, { id: uid('line'), description: r.name, hours: 1, rate: r.rate ?? 0 }] })}>
                    + {r.name} ({eur(r.rate ?? 0)}/h)
                  </Button>
                ))}
              </div>
            </Step>

            {/* 5. Maintenance */}
            <Step n={5} title="Maintenance package (optional)" hint="Billed monthly. It is never added to the one-time total.">
              <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
                <Field label="Package">
                  <Select value={q.maintenanceId ?? ''} onChange={(e) => chooseMaintenance(e.target.value)}>
                    <option value="">No maintenance</option>
                    {data.maintenance.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {rangeLabel(m.priceMin, m.priceMax, '/month')}
                      </option>
                    ))}
                  </Select>
                </Field>
                {pkg && (
                  <Field label="Monthly price" hint={`Reference ${rangeLabel(pkg.priceMin, pkg.priceMax)}`}>
                    <NumberInput value={q.maintenancePrice} suffix="€/mo" onChange={(n) => set({ maintenancePrice: Math.max(0, n ?? 0) })} aria-label="Monthly maintenance price" />
                  </Field>
                )}
              </div>
            </Step>

            {/* 6. Third-party */}
            <Step n={6} title="Third-party costs (optional)" hint="Expenses marked “charged to client” on the service’s Costs tab.">
              {(() => {
                const one = service?.costs.oneTime.filter((e) => e.chargedToClient && e.amount > 0) ?? [];
                const rec = service?.costs.recurring.filter((e) => e.chargedToClient && e.amount > 0) ?? [];
                if (!service) return <p className="text-sm text-muted">Select a service first.</p>;
                if (one.length + rec.length === 0)
                  return (
                    <p className="text-sm text-muted">
                      No third-party costs are charged to the client for this service. Add them on its{' '}
                      <Link to={`/services/${service.id}?tab=costs`} className="text-accent hover:underline">
                        Costs tab
                      </Link>
                      .
                    </p>
                  );
                return (
                  <>
                    <Checkbox checked={q.includeThirdParty} onChange={(c) => set({ includeThirdParty: c })} label="Include third-party costs in this quote" />
                    <ul className="mt-3 space-y-1 text-sm text-muted">
                      {one.map((e) => (
                        <li key={e.id}>
                          {e.name || 'Expense'} — {eur(e.amount)} one-time
                        </li>
                      ))}
                      {rec.map((e) => (
                        <li key={e.id}>
                          {e.name || 'Expense'} — {eur(e.amount)} per month
                        </li>
                      ))}
                    </ul>
                  </>
                );
              })()}
            </Step>

            {/* 7. Details */}
            <Step n={7} title="Client & quote details">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Client name" required error={show('client')}>
                  <TextInput value={q.clientName} invalid={!!show('client')} onChange={(e) => set({ clientName: e.target.value })} />
                </Field>
                <Field label="Quote reference">
                  <TextInput value={q.reference} onChange={(e) => set({ reference: e.target.value })} />
                </Field>
                <Field label="Project title" className="sm:col-span-2">
                  <TextInput value={q.projectTitle} onChange={(e) => set({ projectTitle: e.target.value })} placeholder="e.g. New website for Café Central" />
                </Field>
                <Field label="Issue date" error={show('issueDate')}>
                  <input type="date" className={`input ${show('issueDate') ? 'input-invalid' : ''}`} value={q.issueDate} onChange={(e) => set({ issueDate: e.target.value })} />
                </Field>
                <Field label="Valid until" required error={show('validUntil')}>
                  <input type="date" className={`input ${show('validUntil') ? 'input-invalid' : ''}`} value={q.validUntil} onChange={(e) => set({ validUntil: e.target.value })} />
                </Field>
                <Field label="Project notes" className="sm:col-span-2">
                  <TextArea rows={4} value={q.projectNotes} onChange={(e) => set({ projectNotes: e.target.value })} placeholder="Scope notes, assumptions, timeline…" />
                </Field>
                <Field label="Disclaimer shown on the quote" className="sm:col-span-2">
                  <TextArea rows={3} value={q.disclaimer} onChange={(e) => set({ disclaimer: e.target.value })} />
                </Field>
              </div>
            </Step>
          </div>

          {/* Summary */}
          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className="card p-5" aria-label="Quote summary">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Summary</h2>
              <Summary result={result} serviceName={service?.name} />
              <Button variant="primary" icon={Printer} className="mt-5 w-full" onClick={print}>
                {t('quote.print')}
              </Button>
              <p className="mt-3 text-[11px] leading-snug text-muted">Use “Save as PDF” in the print dialog. Estimates are indicative, not guaranteed quotations.</p>
            </div>
          </aside>
        </div>
      </div>

      <QuoteDocument result={result} service={service} />
    </>
  );
}

function Summary({ result, serviceName }: { result: QuoteResult; serviceName?: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-accent">One-time</div>
      <div className="mt-1 divide-y divide-border">
        <div>
          <SumRow label="Base service" detail={serviceName} value={eur(result.base)} />
        </div>
        <div>
          <SumRow label="Optional extras" value={eur(result.extrasOneTimeTotal)} />
          <Lines lines={result.extrasOneTime} />
        </div>
        <div>
          <SumRow label="Additional work" value={eur(result.additionalTotal)} />
          <Lines lines={result.additional} />
        </div>
        <div>
          <SumRow label="Third-party costs" value={eur(result.thirdPartyOneTimeTotal)} />
          <Lines lines={result.thirdPartyOneTime} />
        </div>
      </div>
      <div className="mt-2 flex items-baseline justify-between rounded-md bg-accent/10 px-3 py-2.5">
        <span className="text-sm font-semibold">Estimated one-time total</span>
        <span className="text-lg font-semibold tabular-nums text-accent">{eur(result.oneTimeTotal)}</span>
      </div>

      <div className="mt-6 text-xs font-semibold uppercase tracking-wide text-accent">Recurring (monthly)</div>
      <div className="mt-1 divide-y divide-border">
        <div>
          <SumRow label="Maintenance" detail={result.maintenanceName ?? 'None selected'} value={eur(result.recurringMaintenance)} />
        </div>
        {(result.recurringExtras.length > 0 || result.recurringThirdParty.length > 0) && (
          <div>
            <Lines lines={result.recurringExtras} />
            <Lines lines={result.recurringThirdParty} />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline justify-between rounded-md bg-surface2 px-3 py-2.5">
        <span className="text-sm font-semibold">Estimated monthly total</span>
        <span className="text-lg font-semibold tabular-nums">{eur(result.recurringTotal)}</span>
      </div>
      <p className="mt-2 text-[11px] text-muted">Recurring charges are not included in the one-time total.</p>
    </div>
  );
}

/** The clean, light layout that is actually printed / saved as PDF. Hidden on screen. */
function QuoteDocument({ result, service }: { result: QuoteResult; service?: Service }) {
  const { data } = useStore();
  const q = data.quote;
  const { settings } = data;
  const features = service ? service.features.filter((f) => q.featureIds.includes(f.id)) : [];
  const th = 'border-b border-neutral-300 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600';
  const td = 'border-b border-neutral-200 py-1.5 align-top text-sm';
  const money = `${td} text-right tabular-nums whitespace-nowrap`;

  const rows = (lines: QuoteLine[]) =>
    lines.map((l) => (
      <tr key={l.id}>
        <td className={td}>
          {l.label}
          {l.detail && <span className="block text-xs text-neutral-500">{l.detail}</span>}
        </td>
        <td className={money}>{eur(l.amount)}</td>
      </tr>
    ));

  return (
    <div className="hidden bg-white text-neutral-900 print:block" aria-hidden="true">
      <header className="flex items-start justify-between gap-6 border-b-2 border-neutral-900 pb-4">
        <div>
          <div className="text-xl font-bold">{settings.businessName || 'Web development services'}</div>
          {settings.businessContact && <div className="mt-0.5 text-sm text-neutral-600">{settings.businessContact}</div>}
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold uppercase tracking-wide">Indicative quote</div>
          <div className="text-sm text-neutral-600">Ref. {q.reference}</div>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-6 text-sm">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Prepared for</div>
          <div className="mt-1 font-semibold">{q.clientName}</div>
          {q.projectTitle && <div className="text-neutral-700">{q.projectTitle}</div>}
        </div>
        <div className="text-right">
          <div>
            <span className="text-neutral-500">Issued: </span>
            {dateLabel(q.issueDate)}
          </div>
          <div>
            <span className="text-neutral-500">Valid until: </span>
            {dateLabel(q.validUntil)}
          </div>
        </div>
      </section>

      {service && (
        <section className="avoid-break mt-6">
          <h2 className="text-base font-semibold">{service.name}</h2>
          {service.shortDescription && <p className="text-sm text-neutral-700">{service.shortDescription}</p>}
          {features.length > 0 && (
            <>
              <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Scope</div>
              <ul className="mt-1 grid list-disc grid-cols-2 gap-x-6 pl-5 text-sm">
                {features.map((f) => (
                  <li key={f.id}>
                    {f.name}
                    {!f.included && <span className="text-neutral-500"> (added)</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <section className="avoid-break mt-6">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>One-time charges</th>
              <th className={`${th} text-right`}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={td}>Base service{service ? ` — ${service.name}` : ''}</td>
              <td className={money}>{eur(result.base)}</td>
            </tr>
            {rows(result.extrasOneTime)}
            {rows(result.additional)}
            {rows(result.thirdPartyOneTime)}
            <tr>
              <td className="pt-2 text-sm font-bold">Estimated one-time total</td>
              <td className="pt-2 text-right text-base font-bold tabular-nums">{eur(result.oneTimeTotal)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {result.recurringTotal > 0 && (
        <section className="avoid-break mt-6">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>Recurring monthly charges</th>
                <th className={`${th} text-right`}>Per month</th>
              </tr>
            </thead>
            <tbody>
              {result.maintenanceName && (
                <tr>
                  <td className={td}>Maintenance — {result.maintenanceName}</td>
                  <td className={money}>{eur(result.recurringMaintenance)}</td>
                </tr>
              )}
              {rows(result.recurringExtras)}
              {rows(result.recurringThirdParty)}
              <tr>
                <td className="pt-2 text-sm font-bold">Estimated monthly total</td>
                <td className="pt-2 text-right text-base font-bold tabular-nums">{eur(result.recurringTotal)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-1 text-xs text-neutral-500">Recurring charges are billed separately and are not part of the one-time total.</p>
        </section>
      )}

      {q.projectNotes.trim() && (
        <section className="avoid-break mt-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Project notes</div>
          <p className="mt-1 whitespace-pre-line text-sm">{q.projectNotes}</p>
        </section>
      )}

      {service && service.exclusions.length > 0 && (
        <section className="avoid-break mt-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Not included</div>
          <ul className="mt-1 list-disc pl-5 text-sm">
            {service.exclusions.map((x) => (
              <li key={x.id}>
                {x.name}
                {x.notes && <span className="text-neutral-500"> — {x.notes}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {q.disclaimer.trim() && (
        <footer className="avoid-break mt-8 border-t border-neutral-300 pt-3 text-xs leading-relaxed text-neutral-600">{q.disclaimer}</footer>
      )}
      <div className="sr-only">{numberLabel(result.oneTimeTotal)}</div>
    </div>
  );
}
