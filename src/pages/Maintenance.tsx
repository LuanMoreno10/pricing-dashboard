import { useState } from 'react';
import { Check, Clock, Pencil, Plus, ShieldCheck, Trash2, Wrench, X } from 'lucide-react';
import { useStore } from '../store/store';
import { Badge, Button, EmptyState, IconButton, PageHeader, SectionTitle } from '../components/ui';
import { PackageFormModal, RateFormModal } from '../components/forms/ItemForms';
import { useConfirm, useToast } from '../components/feedback';
import { eur, hoursLabel, rangeLabel } from '../lib/format';
import type { HourlyRate, MaintenancePackage } from '../types';

function Include({ label, text }: { label: string; text: string }) {
  const on = text.trim().length > 0;
  return (
    <li className="flex gap-2 text-sm">
      {on ? <Check size={15} className="mt-0.5 shrink-0 text-accent" aria-label="Included" /> : <X size={15} className="mt-0.5 shrink-0 text-muted" aria-label="Not included" />}
      <span className={on ? '' : 'text-muted'}>
        <span className="font-medium">{label}</span>
        {on ? <span className="text-muted"> — {text}</span> : <span> — not included</span>}
      </span>
    </li>
  );
}

export default function Maintenance() {
  const { data, t, saveRate, deleteRate, savePackage, deletePackage } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const [rateForm, setRateForm] = useState<{ rate?: HourlyRate } | null>(null);
  const [pkgForm, setPkgForm] = useState<{ pkg?: MaintenancePackage } | null>(null);

  async function removeRate(r: HourlyRate) {
    const ok = await confirm({ title: `Delete “${r.name}”?`, message: 'This rate will be removed from your reference list.', confirmLabel: 'Delete rate' });
    if (ok) {
      deleteRate(r.id);
      toast('Rate deleted');
    }
  }
  async function removePkg(p: MaintenancePackage) {
    const ok = await confirm({ title: `Delete “${p.name}”?`, message: 'This maintenance package will be removed. A quote that uses it will drop the maintenance line.', confirmLabel: 'Delete package' });
    if (ok) {
      deletePackage(p.id);
      toast('Package deleted');
    }
  }

  return (
    <>
      <PageHeader title={t('maintenance.title')} description={t('maintenance.subtitle')} />

      <section className="mb-10">
        <SectionTitle
          actions={
            <Button size="sm" icon={Plus} onClick={() => setRateForm({})}>
              Add rate
            </Button>
          }
        >
          {t('maintenance.rates')}
        </SectionTitle>
        {data.rates.length === 0 ? (
          <EmptyState icon={Clock} title="No rates yet" text="Add your hourly rates and additional services." action={<Button icon={Plus} onClick={() => setRateForm({})}>Add rate</Button>} />
        ) : (
          <ul className="card divide-y divide-border">
            {data.rates.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{r.name}</div>
                  {r.notes && <div className="mt-0.5 text-xs text-muted">{r.notes}</div>}
                </div>
                <div className="shrink-0 text-right">
                  {r.kind === 'quote' ? (
                    <Badge>Fixed quote, based on scope</Badge>
                  ) : r.rate != null ? (
                    <span className="text-lg font-semibold tabular-nums text-accent">
                      {eur(r.rate)}
                      <span className="text-xs font-normal text-muted">{t('price.perHour')}</span>
                    </span>
                  ) : (
                    <Button size="sm" onClick={() => setRateForm({ rate: r })}>
                      Set your rate
                    </Button>
                  )}
                </div>
                <div className="flex shrink-0">
                  <IconButton icon={Pencil} label={`Edit ${r.name}`} onClick={() => setRateForm({ rate: r })} />
                  <IconButton icon={Trash2} tone="danger" label={`Delete ${r.name}`} onClick={() => removeRate(r)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionTitle
          actions={
            <Button size="sm" icon={Plus} onClick={() => setPkgForm({})}>
              Add package
            </Button>
          }
        >
          {t('maintenance.packages')}
        </SectionTitle>
        {data.maintenance.length === 0 ? (
          <EmptyState icon={Wrench} title="No maintenance packages" text="Define the monthly packages you offer after launch." action={<Button icon={Plus} onClick={() => setPkgForm({})}>Add package</Button>} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {data.maintenance.map((p) => (
              <article key={p.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold leading-snug">{p.name}</h3>
                  <div className="flex shrink-0">
                    <IconButton icon={Pencil} label={`Edit ${p.name}`} onClick={() => setPkgForm({ pkg: p })} />
                    <IconButton icon={Trash2} tone="danger" label={`Delete ${p.name}`} onClick={() => removePkg(p)} />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-semibold tabular-nums text-accent">
                  {rangeLabel(p.priceMin, p.priceMax)}
                  <span className="text-sm font-normal text-muted"> {t('price.perMonth')}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                  <ShieldCheck size={13} aria-hidden="true" /> {hoursLabel(p.supportHours)} support included per month
                </div>
                <ul className="mt-4 space-y-2 border-t border-border pt-4">
                  <Include label="Updates & backups" text={p.updatesBackups} />
                  <Include label="Security checks" text={p.securityChecks} />
                  <Include label="Content changes" text={p.contentChanges} />
                </ul>
                <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted">Response expectations</dt>
                    <dd>{p.response || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Exclusions</dt>
                    <dd>{p.exclusions || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Additional hours</dt>
                    <dd>{p.extraHourlyRate != null ? `${eur(p.extraHourlyRate)}${t('price.perHour')}` : 'Not set'}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>

      {rateForm && (
        <RateFormModal
          rate={rateForm.rate}
          onClose={() => setRateForm(null)}
          onSave={(r) => {
            saveRate(r);
            setRateForm(null);
            toast('Rate saved');
          }}
        />
      )}
      {pkgForm && (
        <PackageFormModal
          pkg={pkgForm.pkg}
          onClose={() => setPkgForm(null)}
          onSave={(p) => {
            savePackage(p);
            setPkgForm(null);
            toast('Package saved');
          }}
        />
      )}
    </>
  );
}
