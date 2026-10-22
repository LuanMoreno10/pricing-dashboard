# Services & Pricing — Luan Moreno

**The published site is a public, read-only services page** (`src/pages/Showcase.tsx`): service cards with indicative prices, what's included, optional add-ons, maintenance plans and hourly rates. Visitors can't edit anything; every "Contact" / "Request a quote" button links to https://luan-moreno.com/#contact.

To change services, prices or texts, edit `src/data/seed.ts` and push to `main` — GitHub Actions redeploys the page. The contact link is set at the top of `Showcase.tsx`.

The sections below describe the original internal pricing dashboard. Its code is still in `src/` but is no longer routed or published.

## Original: Rate Card — Freelance Pricing Dashboard

A private, backend-free reference tool for a freelance web developer: organise services, define what each package includes, keep price ranges and optional extras, track internal costs, and prepare indicative client quotes you can print or save as PDF.

It is a **service catalogue and pricing tool** — not a project manager or finance tracker. Prices shown are editable reference estimates and are never presented as guaranteed quotations.

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Lucide React · LocalStorage (no backend, no login, no external APIs).

## Features

- **Overview** — service, category and rate counts, fixed vs range pricing, maintenance packages, a price-landscape chart, recently updated services, and shortcuts (new service, add extra, new quote).
- **Services** — cards with clear pricing; search by name, technology/tag or feature; category filter; sorting; archive; duplicate; delete (with confirmation); JSON export/import.
- **Service detail** (tabs): overview · included features (per-service checklist with hours, notes and an "included by default" toggle) · exclusions & assumptions · optional extras (fixed, hourly or recurring) · costs & effort.
- **Costs & effort** — hours, internal hourly cost, one-time and recurring third-party expenses, recommended price. Your own labour (internal) is kept separate from expenses charged to the client. All optional.
- **Maintenance & rates** — hourly rates / additional services and configurable monthly maintenance packages.
- **Quote builder** — select service → features → extras → additional hours → maintenance → review totals → client details. One-time and recurring totals are kept strictly separate. Edit everything, then use **Print / save as PDF** (clean light print layout).
- **Categories** — seven defaults plus custom categories.
- **Dark theme by default** with light mode; responsive layout with a collapsible sidebar.

Portuguese conventions are used throughout: EUR formatting via `Intl` with `pt-PT` (e.g. `1 500 €`), `dd/mm/yyyy` dates, and decimal commas accepted in number fields.

## Seed data

The initial catalogue uses **your reference prices exactly**: the service ranges, the hourly rates (€25/h content, €30/h layout & integrations, extensive changes as a fixed quote, technical support left as a configurable rate), and the three maintenance ranges (€30–50, €50–100, €75–150 per month).

Everything else — estimated hours, feature lists, descriptions, response times, exclusions — is **realistic sample content** meant to be edited. Sample optional extras are priced from *your own* hourly rates, not invented market prices. Internal costs and expenses start empty.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

Requires Node 18+ (Node 22 is used in CI).

## Deploying to GitHub Pages

1. Push this project to a GitHub repository (default branch `main`).
2. In the repository go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main`. The workflow in `.github/workflows/deploy.yml` installs dependencies, type-checks, builds and publishes `dist/`.

The site is served from the custom domain in `public/CNAME` (`services.luan-moreno.com`). It needs a DNS `CNAME` record `services` → `<user>.github.io`, and the domain set under Settings → Pages → Custom domain.

**Base path.** `vite.config.ts` reads `VITE_BASE_PATH` (default `/`). The workflow doesn't set it, so the site is built for the root `/` (right for a custom domain). The app uses **hash routing** (`/#/services`), so refreshes and deep links work on GitHub Pages without 404 rewrites. To build for a specific path manually:

```bash
VITE_BASE_PATH=/my-repo/ npm run build
```

## Data & privacy

All data lives in your browser's LocalStorage under the key `pricing-dashboard:v1`. Nothing is sent anywhere. Because LocalStorage is per browser and per site:

- **Export a JSON backup regularly** (Settings & data → Export JSON) and import it on another browser or device.
- Clearing site data erases the catalogue. If the browser blocks storage, a banner warns you.
- Imports are validated and normalised; an invalid file shows an error and changes nothing.

## Project structure

```
src/
  types.ts              data model
  data/seed.ts          initial catalogue, default categories, suggestions
  lib/calc.ts           cost and quote calculations (pure functions)
  lib/format.ts         EUR / pt-PT number and date formatting
  lib/storage.ts        load/save, validation and normalisation (also used by import)
  store/store.tsx       app state + LocalStorage persistence + actions
  i18n/                 UI strings (en.ts is the source; pt.ts is a starter)
  components/           UI primitives, layout, confirm dialog + toasts, forms
  pages/                Overview, Services, ServiceDetail, Maintenance, QuoteBuilder, Categories, Settings
```

## Translating the UI later

Navigation, page titles, common actions and enum labels go through `t('key')` from `src/i18n`. To add Portuguese: translate the keys in `src/i18n/pt.ts` (missing keys fall back to English) and set `available: true` for `pt` in `src/i18n/index.ts`; the language selector in Settings then enables it. Some longer helper texts and form labels are still inline English strings — move them into `en.ts` as you translate. Number, currency and date formatting already follow `pt-PT`.

## Notes on calculations

- **Quote one-time total** = base service + one-time extras + additional work (including optional features you tick) + third-party costs charged to the client (if included).
- **Recurring monthly total** = maintenance + recurring extras + recurring third-party costs charged to the client (if included). It is never added to the one-time total.
- **Estimated margin** = recommended price − absorbed expenses − internal labour cost. Expenses charged on to the client cancel out.
