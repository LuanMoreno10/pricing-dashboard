import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, ChevronDown, Clock, Minus, Plus, ShieldCheck } from 'lucide-react';
import { createSeedData } from '../data/seed';
import { eur, numberLabel, priceLabel, rangeLabel } from '../lib/format';
import { CONTENT_PT, UI, type Lang, type ShowcaseText } from '../i18n/showcase';
import type { Extra, Service } from '../types';

// Public, read-only catalogue. The content comes straight from src/data/seed.ts:
// edit prices and descriptions there (and their Portuguese in src/i18n/showcase.ts), then push to redeploy.
const PORTFOLIO_URL = 'https://luan-moreno.com';
const CONTACT_URL = `${PORTFOLIO_URL}/#contact`;
const LANG_KEY = 'showcase:lang';

const data = createSeedData();
const services = data.services.filter((s) => !s.archived);
const categories = data.categories.filter((c) => services.some((s) => s.categoryId === c.id));
const categoryName = (id: string) => data.categories.find((c) => c.id === id)?.name ?? '';

/** Translates a catalogue text (from seed.ts). */
type Tr = (text: string) => string;

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'pt' || saved === 'en') return saved;
  } catch {
    // Storage blocked: fall back to the browser language.
  }
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

function extraPrice(x: Extra, t: ShowcaseText): string {
  if (x.model === 'recurring') return rangeLabel(x.priceMin, x.priceMax, t.perMonth);
  if (x.model === 'hourly') {
    return x.hours > 0 ? `${t.fromLower} ${eur(x.priceMin * x.hours)}` : rangeLabel(x.priceMin, x.priceMax, t.perHour);
  }
  return rangeLabel(x.priceMin, x.priceMax);
}

function ContactButton({ label }: { label: string }) {
  return (
    <a
      href={CONTACT_URL}
      target="_blank"
      rel="noopener"
      className="inline-flex items-center gap-1.5 rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-fg/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40"
    >
      {label}
      <ArrowUpRight size={15} aria-hidden="true" />
    </a>
  );
}

function LangSwitch({ lang, onChange, label }: { lang: Lang; onChange: (l: Lang) => void; label: string }) {
  return (
    <div className="inline-flex rounded-full border border-border bg-surface p-0.5" role="group" aria-label={label}>
      {(['pt', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          onClick={() => onChange(l)}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40 ${
            lang === l ? 'bg-fg text-surface' : 'text-muted hover:text-fg'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function ServiceCard({ service, t, tr }: { service: Service; t: ShowcaseText; tr: Tr }) {
  const [open, setOpen] = useState(false);
  const included = service.features.filter((f) => f.included);
  const optionalFeatures = service.features.filter((f) => !f.included);
  const detailsId = `details-${service.id}`;

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-surface p-6">
      <span className="self-start rounded-full bg-surface2 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted">
        {tr(categoryName(service.categoryId))}
      </span>
      <h3 className="mt-4 text-lg font-semibold leading-snug">{tr(service.name)}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{tr(service.shortDescription)}</p>

      <div className="mt-5">
        <div className="text-2xl font-semibold tabular-nums tracking-tight">{priceLabel(service, t.from)}</div>
        <div className="mt-0.5 text-xs text-muted">{t.priceNote}</div>
      </div>

      <ul className="mt-5 space-y-2 border-t border-border pt-5">
        {included.slice(0, open ? undefined : 4).map((f) => (
          <li key={f.id} className="flex gap-2 text-sm">
            <Check size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{tr(f.name)}</span>
          </li>
        ))}
        {!open && included.length > 4 && <li className="pl-6 text-xs text-muted">{t.moreIncluded(included.length - 4)}</li>}
      </ul>

      {open && (
        <div id={detailsId} className="mt-5 space-y-5 border-t border-border pt-5 text-sm">
          <p className="leading-relaxed">{tr(service.description)}</p>
          {service.targetClient && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">{t.idealFor}</h4>
              <p className="mt-1 leading-relaxed">{tr(service.targetClient)}</p>
            </div>
          )}
          {(optionalFeatures.length > 0 || service.extras.length > 0) && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">{t.addons}</h4>
              <ul className="mt-2 space-y-2">
                {optionalFeatures.map((f) => (
                  <li key={f.id} className="flex gap-2">
                    <Plus size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                    <span>{tr(f.name)}</span>
                  </li>
                ))}
                {service.extras.map((x) => (
                  <li key={x.id} className="flex gap-2">
                    <Plus size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                    <span className="flex-1">{tr(x.name)}</span>
                    <span className="shrink-0 tabular-nums text-muted">{extraPrice(x, t)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {service.exclusions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">{t.notIncluded}</h4>
              <ul className="mt-2 space-y-2">
                {service.exclusions.map((x) => (
                  <li key={x.id} className="flex gap-2 text-muted">
                    <Minus size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{tr(x.name)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={detailsId}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-fg focus-visible:outline-none focus-visible:underline"
        >
          {open ? t.showLess : t.fullDetails}
          <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        <ContactButton label={t.requestQuote} />
      </div>
    </article>
  );
}

export default function Showcase() {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [category, setCategory] = useState('all');
  const t = UI[lang];
  const tr: Tr = (text) => (lang === 'pt' ? CONTENT_PT[text] ?? text : text);
  const visible = category === 'all' ? services : services.filter((s) => s.categoryId === category);
  const rates = data.rates.filter((r) => r.kind === 'quote' || r.rate != null);

  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-PT' : 'en';
    document.title = t.pageTitle;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // Not critical: the choice just won't be remembered.
    }
  }, [lang, t]);

  const chip = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40 ${
      active ? 'bg-fg text-surface' : 'border border-border bg-surface text-muted hover:text-fg'
    }`;

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <a href={PORTFOLIO_URL} className="text-base font-semibold tracking-tight hover:opacity-80">
          Luan Moreno
        </a>
        <nav className="flex items-center gap-2 text-sm sm:gap-4" aria-label="Main">
          <a href="#services" className="hidden rounded-full px-3 py-1.5 text-muted hover:text-fg md:inline">
            {t.navServices}
          </a>
          <a href="#maintenance" className="hidden rounded-full px-3 py-1.5 text-muted hover:text-fg md:inline">
            {t.navMaintenance}
          </a>
          <a href={PORTFOLIO_URL} className="hidden rounded-full px-3 py-1.5 text-muted hover:text-fg sm:inline">
            {t.navPortfolio}
          </a>
          <LangSwitch lang={lang} onChange={setLang} label={t.language} />
          <ContactButton label={t.contact} />
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <section className="py-12 text-center sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.eyebrow}</p>
          <h1 className="mx-auto mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted">{t.intro}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ContactButton label={t.heroCta} />
            <a href="#services" className="inline-flex items-center rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium hover:border-fg/40">
              {t.seeServices}
            </a>
          </div>
        </section>

        <section id="services" className="scroll-mt-6" aria-labelledby="services-title">
          <h2 id="services-title" className="sr-only">
            {t.navServices}
          </h2>
          <div className="mb-6 flex flex-wrap justify-center gap-2" role="group" aria-label={t.filterLabel}>
            <button type="button" className={chip(category === 'all')} aria-pressed={category === 'all'} onClick={() => setCategory('all')}>
              {t.all}
            </button>
            {categories.map((c) => (
              <button key={c.id} type="button" className={chip(category === c.id)} aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
                {tr(c.name)}
              </button>
            ))}
          </div>
          <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((s) => (
              <ServiceCard key={s.id} service={s} t={t} tr={tr} />
            ))}
          </div>
        </section>

        <section id="maintenance" className="mt-20 scroll-mt-6" aria-labelledby="maintenance-title">
          <div className="mb-6 text-center">
            <h2 id="maintenance-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t.maintTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted">{t.maintText}</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {data.maintenance.map((p) => {
              const response = tr(p.response);
              return (
                <article key={p.id} className="flex flex-col rounded-2xl border border-border bg-surface p-6">
                  <h3 className="text-base font-semibold leading-snug">{tr(p.name)}</h3>
                  <div className="mt-3 text-2xl font-semibold tabular-nums tracking-tight">
                    {rangeLabel(p.priceMin, p.priceMax)}
                    <span className="text-sm font-normal text-muted">{t.perMonth}</span>
                  </div>
                  <ul className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
                    {[p.updatesBackups, p.securityChecks, p.contentChanges].filter((x) => x.trim()).map((text) => (
                      <li key={text} className="flex gap-2">
                        <Check size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{tr(text)}</span>
                      </li>
                    ))}
                    {p.supportHours > 0 && (
                      <li className="flex gap-2">
                        <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{t.supportHours(numberLabel(p.supportHours))}</span>
                      </li>
                    )}
                    {response && (
                      <li className="flex gap-2">
                        <Clock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <span>
                          {t.response}: {response.charAt(0).toLowerCase() + response.slice(1)}
                        </span>
                      </li>
                    )}
                  </ul>
                  {p.exclusions && (
                    <p className="mt-4 text-xs text-muted">
                      {t.notIncluded}: {tr(p.exclusions)}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {rates.length > 0 && (
          <section className="mt-20" aria-labelledby="rates-title">
            <div className="mb-6 text-center">
              <h2 id="rates-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t.ratesTitle}
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-muted">{t.ratesText}</p>
            </div>
            <ul className="mx-auto max-w-3xl divide-y divide-border rounded-2xl border border-border bg-surface">
              {rates.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
                  <span className="text-sm font-medium">{tr(r.name)}</span>
                  <span className="text-sm tabular-nums text-muted">{r.kind === 'quote' ? t.quoted : `${eur(r.rate ?? 0)}${t.perHour}`}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-20 rounded-3xl bg-fg px-6 py-12 text-center text-surface sm:px-12">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.ctaTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-surface/70">{t.ctaText}</p>
          <a
            href={CONTACT_URL}
            target="_blank"
            rel="noopener"
            className="mt-7 inline-flex items-center gap-1.5 rounded-full bg-surface px-6 py-3 text-sm font-medium text-fg hover:bg-surface/90"
          >
            {t.ctaButton}
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </section>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-muted">{tr(data.settings.disclaimer)}</p>
      </main>
    </div>
  );
}
