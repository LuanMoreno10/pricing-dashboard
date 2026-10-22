import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calculator, ChevronRight, PackagePlus, PlusCircle } from 'lucide-react';
import { useStore } from '../store/store';
import { Button, Modal, PageHeader, Select, Field, SectionTitle, Badge } from '../components/ui';
import { ServiceFormModal } from '../components/forms/ServiceFormModal';
import { ExtraFormModal } from '../components/forms/ItemForms';
import { dateTimeLabel, eur, priceLabel } from '../lib/format';
import type { Extra } from '../types';

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}

function Shortcut({ icon: Icon, title, hint, onClick, disabled }: { icon: typeof Calculator; title: string; hint: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="card group flex items-center gap-3 p-4 text-left transition-colors hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <ChevronRight size={16} className="text-muted group-hover:text-accent" aria-hidden="true" />
    </button>
  );
}

export default function Overview() {
  const { data, t, patchService } = useStore();
  const navigate = useNavigate();
  const [serviceForm, setServiceForm] = useState(false);
  const [extraFlow, setExtraFlow] = useState<'closed' | 'pick' | 'form'>('closed');
  const [targetId, setTargetId] = useState('');

  const active = data.services.filter((s) => !s.archived);
  const fixed = active.filter((s) => s.priceMode === 'fixed').length;
  const ranged = active.length - fixed;
  const categoriesInUse = new Set(active.map((s) => s.categoryId)).size;
  const hourlyRates = data.rates.filter((r) => r.kind === 'hourly');
  const configuredRates = hourlyRates.filter((r) => r.rate != null).length;
  const recent = [...active].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
  const landscape = [...active].sort((a, b) => a.priceMin - b.priceMin);
  const scale = Math.max(1, ...active.map((s) => s.priceMax));
  const categoryName = (id: string) => data.categories.find((c) => c.id === id)?.name ?? '—';

  function startExtra() {
    setTargetId(active[0]?.id ?? '');
    setExtraFlow('pick');
  }

  function saveExtra(extra: Extra) {
    patchService(targetId, (s) => ({ ...s, extras: [...s.extras, extra] }));
    setExtraFlow('closed');
    navigate(`/services/${targetId}?tab=extras`);
  }

  return (
    <>
      <PageHeader title={t('overview.title')} description={t('overview.subtitle')} />

      <section aria-label="Key figures" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label={t('overview.stat.services')} value={String(active.length)} sub={data.services.length > active.length ? `${data.services.length - active.length} archived` : undefined} />
        <Stat label={t('overview.stat.categories')} value={String(data.categories.length)} sub={`${categoriesInUse} with services`} />
        <Stat label={t('overview.stat.pricing')} value={`${fixed} / ${ranged}`} sub={`${fixed} fixed · ${ranged} range or starting`} />
        <Stat label={t('overview.stat.rates')} value={`${configuredRates}`} sub={configuredRates < hourlyRates.length ? `${hourlyRates.length - configuredRates} not configured yet` : 'all configured'} />
        <Stat label={t('overview.stat.maintenance')} value={String(data.maintenance.length)} sub={data.maintenance.length ? `from ${eur(Math.min(...data.maintenance.map((m) => m.priceMin)))}${t('price.perMonth')}` : undefined} />
      </section>

      <section className="mt-8" aria-label={t('overview.shortcuts')}>
        <SectionTitle>{t('overview.shortcuts')}</SectionTitle>
        <div className="grid gap-3 md:grid-cols-3">
          <Shortcut icon={PackagePlus} title={t('overview.newService')} hint={t('overview.newServiceHint')} onClick={() => setServiceForm(true)} />
          <Shortcut icon={PlusCircle} title={t('overview.newExtra')} hint={active.length ? t('overview.newExtraHint') : 'Create a service first'} onClick={startExtra} disabled={active.length === 0} />
          <Shortcut icon={Calculator} title={t('overview.newQuote')} hint={t('overview.newQuoteHint')} onClick={() => navigate('/quote')} />
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="card p-5" aria-label={t('overview.landscape')}>
          <SectionTitle>{t('overview.landscape')}</SectionTitle>
          <p className="-mt-1 mb-4 text-xs text-muted">{t('overview.landscapeHint')}</p>
          {landscape.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No active services yet.</p>
          ) : (
            <ul className="space-y-3">
              {landscape.map((s) => {
                const left = (s.priceMin / scale) * 100;
                const width = Math.max(1.5, ((s.priceMax - s.priceMin) / scale) * 100);
                return (
                  <li key={s.id}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
                      <Link to={`/services/${s.id}`} className="truncate font-medium hover:text-accent">
                        {s.name}
                      </Link>
                      <span className="shrink-0 tabular-nums text-muted">{priceLabel(s, t('price.from'))}</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-surface2" role="img" aria-label={`${s.name}: ${priceLabel(s, t('price.from'))}`}>
                      <div
                        className={`absolute inset-y-0 rounded-full bg-accent/80 ${s.openEnded || s.priceMode === 'starting' ? 'rounded-r-none' : ''}`}
                        style={{ left: `${left}%`, width: `${s.priceMode === 'range' ? width : 1.5}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card p-5" aria-label={t('overview.recent')}>
          <SectionTitle>{t('overview.recent')}</SectionTitle>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Nothing here yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((s) => (
                <li key={s.id}>
                  <Link to={`/services/${s.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-accent">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{s.name}</span>
                      <span className="block text-xs text-muted">{dateTimeLabel(s.updatedAt)}</span>
                    </span>
                    <Badge>{categoryName(s.categoryId)}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {serviceForm && (
        <ServiceFormModal
          onClose={() => setServiceForm(false)}
          onSaved={(id) => {
            setServiceForm(false);
            navigate(`/services/${id}`);
          }}
        />
      )}

      {extraFlow === 'pick' && (
        <Modal
          size="sm"
          title="Add an optional extra"
          onClose={() => setExtraFlow('closed')}
          footer={
            <>
              <Button onClick={() => setExtraFlow('closed')}>{t('common.cancel')}</Button>
              <Button variant="primary" disabled={!targetId} onClick={() => setExtraFlow('form')}>
                {t('common.continue')}
              </Button>
            </>
          }
        >
          <Field label="Which service is this extra for?">
            <Select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
              {active.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
        </Modal>
      )}
      {extraFlow === 'form' && <ExtraFormModal onSave={saveExtra} onClose={() => setExtraFlow('closed')} />}
    </>
  );
}
