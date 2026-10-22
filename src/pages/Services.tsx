import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Archive, ArchiveRestore, Clock, Copy, Package, Plus, Search, Trash2 } from 'lucide-react';
import { useStore } from '../store/store';
import { Badge, Button, Checkbox, EmptyState, IconButton, PageHeader, Select, TextInput } from '../components/ui';
import { ServiceFormModal } from '../components/forms/ServiceFormModal';
import { useConfirm, useToast } from '../components/feedback';
import { featureStats } from '../lib/calc';
import { hoursLabel, priceLabel } from '../lib/format';
import type { Service } from '../types';
import type { MessageKey } from '../i18n';

type Sort = 'updated' | 'name' | 'priceAsc' | 'priceDesc' | 'hours';
const SORTS: Sort[] = ['updated', 'name', 'priceAsc', 'priceDesc', 'hours'];

function ServiceCard({ service, categoryName }: { service: Service; categoryName: string }) {
  const { t, duplicateService, toggleArchive, deleteService } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();
  const stats = featureStats(service);

  async function remove() {
    const ok = await confirm({
      title: `Delete “${service.name}”?`,
      message: 'This permanently removes the service with its features, exclusions, extras and cost data. Consider archiving it instead.',
      confirmLabel: 'Delete service',
    });
    if (ok) {
      deleteService(service.id);
      toast('Service deleted');
    }
  }

  return (
    <article className={`card flex flex-col p-5 transition-colors hover:border-muted/50 ${service.archived ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <Badge>{categoryName}</Badge>
        {service.archived && <Badge tone="warn">Archived</Badge>}
      </div>
      <h3 className="mt-3 text-base font-semibold leading-snug">
        <Link to={`/services/${service.id}`} className="hover:text-accent focus-visible:outline-none focus-visible:underline">
          {service.name}
        </Link>
      </h3>
      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-muted">{service.shortDescription || 'No description yet.'}</p>

      <div className="mt-4">
        <div className="text-xl font-semibold tabular-nums text-accent">{priceLabel(service, t('price.from'))}</div>
        <div className="mt-0.5 text-xs text-muted">{t(`priceMode.${service.priceMode}`)}{service.openEnded ? ' · open-ended' : ''}</div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-xs">
        <div>
          <dt className="text-muted">Est. hours</dt>
          <dd className="mt-0.5 flex items-center gap-1 font-medium">
            <Clock size={12} className="text-muted" aria-hidden="true" />
            {hoursLabel(service.hours)}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Complexity</dt>
          <dd className="mt-0.5 font-medium">{t(`complexity.${service.complexity}`)}</dd>
        </div>
        <div>
          <dt className="text-muted">Features</dt>
          <dd className="mt-0.5 font-medium">{stats.included} included</dd>
        </div>
      </dl>

      {service.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {service.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded bg-surface2 px-1.5 py-0.5 text-[11px] text-muted">
              {tag}
            </span>
          ))}
          {service.tags.length > 4 && <span className="text-[11px] text-muted">+{service.tags.length - 4}</span>}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-4">
        <Link to={`/services/${service.id}`} className="text-sm font-medium text-accent hover:underline">
          {t('common.view')} details
        </Link>
        <div className="flex">
          <IconButton
            icon={Copy}
            label={t('common.duplicate')}
            onClick={() => {
              const id = duplicateService(service.id);
              if (id) {
                toast('Service duplicated');
                navigate(`/services/${id}`);
              }
            }}
          />
          <IconButton
            icon={service.archived ? ArchiveRestore : Archive}
            label={service.archived ? t('common.unarchive') : t('common.archive')}
            onClick={() => {
              toggleArchive(service.id);
              toast(service.archived ? 'Service restored' : 'Service archived');
            }}
          />
          <IconButton icon={Trash2} label={t('common.delete')} tone="danger" onClick={remove} />
        </div>
      </div>
    </article>
  );
}

export default function Services() {
  const { data, t } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<Sort>('updated');
  const [showArchived, setShowArchived] = useState(false);
  const [creating, setCreating] = useState(false);

  const categoryName = (id: string) => data.categories.find((c) => c.id === id)?.name ?? '—';

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = data.services.filter((s) => {
      if (!showArchived && s.archived) return false;
      if (category !== 'all' && s.categoryId !== category) return false;
      if (!q) return true;
      const haystack = [s.name, s.shortDescription, s.description, s.targetClient, categoryName(s.categoryId), ...s.tags, ...s.features.map((f) => f.name)]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'priceAsc':
          return a.priceMin - b.priceMin || a.priceMax - b.priceMax;
        case 'priceDesc':
          return b.priceMax - a.priceMax || b.priceMin - a.priceMin;
        case 'hours':
          return (b.hours ?? 0) - (a.hours ?? 0);
        default:
          return b.updatedAt.localeCompare(a.updatedAt);
      }
    });
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.services, data.categories, query, category, sort, showArchived]);

  const filtering = query.trim() !== '' || category !== 'all';

  return (
    <>
      <PageHeader
        title={t('services.title')}
        description={t('services.subtitle')}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>
            {t('services.new')}
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_14rem_13rem]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <TextInput type="search" aria-label="Search services" className="pl-9" placeholder={t('services.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">{t('services.allCategories')}</option>
          {data.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Sort services" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          {SORTS.map((s) => (
            <option key={s} value={s}>
              {t(`services.sort.${s}` as MessageKey)}
            </option>
          ))}
        </Select>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span>
          Showing {visible.length} of {data.services.filter((s) => showArchived || !s.archived).length} services
        </span>
        <Checkbox checked={showArchived} onChange={setShowArchived} label={t('services.showArchived')} />
      </div>

      {visible.length === 0 ? (
        filtering ? (
          <EmptyState
            icon={Search}
            title={t('services.noMatchTitle')}
            text={t('services.noMatchText')}
            action={
              <Button
                onClick={() => {
                  setQuery('');
                  setCategory('all');
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Package}
            title={t('services.emptyTitle')}
            text={t('services.emptyText')}
            action={
              <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>
                {t('services.new')}
              </Button>
            }
          />
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((s) => (
            <ServiceCard key={s.id} service={s} categoryName={categoryName(s.categoryId)} />
          ))}
        </div>
      )}

      {creating && (
        <ServiceFormModal
          onClose={() => setCreating(false)}
          onSaved={(id) => {
            setCreating(false);
            navigate(`/services/${id}`);
          }}
        />
      )}
    </>
  );
}
