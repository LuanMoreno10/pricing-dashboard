import type {
  AppData,
  Category,
  Exclusion,
  Extra,
  Feature,
  HourlyRate,
  MaintenancePackage,
  QuoteDraft,
  Service,
  Settings,
} from '../types';
import { uid } from '../lib/id';
import { addDays, todayISO } from '../lib/format';

/*
 * Seed data.
 * - PRICES (service ranges, hourly rates, maintenance ranges) are the reference prices supplied by the owner.
 * - Everything else (hours, feature lists, descriptions, response times…) is realistic SAMPLE content to be edited.
 * - Sample optional extras are priced from the owner's own hourly rates (€25/h content, €30/h layout & integrations),
 *   not from invented market prices.
 */

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-websites', name: 'Websites' },
  { id: 'cat-ecommerce', name: 'E-commerce' },
  { id: 'cat-webapps', name: 'Web Applications' },
  { id: 'cat-dashboards', name: 'Dashboards and Portals' },
  { id: 'cat-automation', name: 'Automation and Integrations' },
  { id: 'cat-saas', name: 'SaaS Products' },
  { id: 'cat-maintenance', name: 'Maintenance and Support' },
];

/** Standard exclusion names offered as one-click suggestions. */
export const STANDARD_EXCLUSIONS: string[] = [
  'Domain registration',
  'Hosting and cloud infrastructure',
  'Paid plugins and licences',
  'Third-party API costs',
  'Copywriting and translation',
  'Professional photography',
  'Ongoing maintenance',
  'Advanced SEO',
  'Additional features outside the agreed scope',
];

/** Standard feature names offered as one-click suggestions. */
export const STANDARD_FEATURES: string[] = [
  'Responsive design',
  'Number of pages',
  'Contact form',
  'SEO basics',
  'CMS or content editing',
  'Booking functionality',
  'Payment integration',
  'User authentication',
  'Admin dashboard',
  'Testing and deployment',
];

const feat = (
  name: string,
  included: boolean,
  hours: number,
  description = '',
  notes = '',
): Feature => ({ id: uid('feat'), name, description, included, hours, notes });

const NOTES: Record<string, string> = {
  'Domain registration': 'Domain purchase and yearly renewal are paid by the client.',
  'Hosting and cloud infrastructure': 'Hosting, servers and cloud usage are billed separately.',
  'Paid plugins and licences': 'Any premium plugin, theme or software licence is an extra cost.',
  'Third-party API costs': 'Usage fees of external APIs and services are paid by the client.',
  'Copywriting and translation': 'The client supplies final texts, or writing/translation is quoted separately.',
  'Professional photography': 'The client supplies images; stock or commissioned photography is extra.',
  'Ongoing maintenance': 'Updates, backups and support after launch need a maintenance package.',
  'Advanced SEO': 'Keyword research, link building and SEO audits are quoted separately.',
  'Additional features outside the agreed scope': 'Anything beyond the agreed scope is quoted before work starts.',
};

const exc = (names: string[], extra: Exclusion[] = []): Exclusion[] => [
  ...names.map((name) => ({ id: uid('exc'), name, notes: NOTES[name] ?? '' })),
  ...extra,
];

const extraHourly = (
  name: string,
  description: string,
  rate: number,
  hours: number,
  notes = '',
): Extra => ({
  id: uid('extra'),
  name,
  description,
  model: 'hourly',
  priceMin: rate,
  priceMax: rate,
  hours,
  notes,
});

/** Basic maintenance plan as a recurring extra, using the owner's reference range. */
const maintenanceExtra = (): Extra => ({
  id: uid('extra'),
  name: 'Basic maintenance plan',
  description: 'Monthly updates and basic upkeep after launch.',
  model: 'recurring',
  priceMin: 30,
  priceMax: 50,
  hours: 0,
  notes: 'Mirrors the "Basic maintenance" reference range. See Maintenance & rates for full packages.',
});

const emptyCosts = () => ({
  internalHourlyCost: null,
  oneTime: [],
  recurring: [],
  recommendedPrice: null,
});

type ServiceInput = Omit<Service, 'id' | 'costs' | 'archived' | 'createdAt' | 'updatedAt'>;

function buildServices(): Service[] {
  const inputs: ServiceInput[] = [
    {
      name: 'Institutional Website',
      categoryId: 'cat-websites',
      shortDescription: 'A clean, fast presentation site for a business, association or professional.',
      description:
        'A small multi-page website that presents who you are, what you do and how to get in touch. Built to be fast, accessible and easy to find on search engines, with a content structure agreed up front.',
      targetClient: 'Small businesses, associations and independent professionals who need a credible online presence.',
      priceMode: 'range',
      priceMin: 350,
      priceMax: 600,
      openEnded: false,
      hours: 16,
      complexity: 'low',
      tags: ['React', 'Static site', 'Responsive', 'SEO basics'],
      features: [
        feat('Responsive design', true, 3, 'Layouts for mobile, tablet and desktop.'),
        feat('Number of pages', true, 5, 'Up to 5 pages (e.g. Home, About, Services, Contact, Legal).', 'Adjust the page count per quote.'),
        feat('Contact form', true, 1.5, 'Form with spam protection that emails the enquiry.'),
        feat('SEO basics', true, 2, 'Page titles, descriptions, sitemap and social preview tags.'),
        feat('Testing and deployment', true, 2, 'Cross-browser checks and launch on the client’s hosting.'),
        feat('CMS or content editing', false, 6, 'Lets the client edit texts without code.', 'Optional — raises the price.'),
        feat('Multilingual pages', false, 5, 'Second language with a language switcher.'),
      ],
      exclusions: exc([
        'Domain registration',
        'Hosting and cloud infrastructure',
        'Copywriting and translation',
        'Professional photography',
        'Ongoing maintenance',
        'Advanced SEO',
        'Additional features outside the agreed scope',
      ]),
      extras: [
        extraHourly('Additional page', 'One extra content page in the existing design.', 30, 3),
        extraHourly('Additional language', 'Translate the structure and wire a language switcher.', 30, 6, 'Translations are not included.'),
        maintenanceExtra(),
      ],
    },
    {
      name: 'Professional Website',
      categoryId: 'cat-websites',
      shortDescription: 'A more complete, custom-designed site with content editing and stronger SEO groundwork.',
      description:
        'A custom-designed website with more pages, richer sections and an editable content setup, aimed at businesses that update their site regularly and want to stand out.',
      targetClient: 'Established businesses and professional services that need a polished, editable site.',
      priceMode: 'range',
      priceMin: 600,
      priceMax: 1000,
      openEnded: false,
      hours: 28,
      complexity: 'medium',
      tags: ['React', 'CMS', 'Responsive', 'SEO'],
      features: [
        feat('Responsive design', true, 4),
        feat('Number of pages', true, 8, 'Up to 8–10 pages.', 'Adjust the page count per quote.'),
        feat('Custom visual design', true, 5, 'Tailored layout and components, not a generic template.'),
        feat('Contact form', true, 1.5),
        feat('SEO basics', true, 3, 'Structured metadata, sitemap, performance tuning.'),
        feat('CMS or content editing', true, 6, 'Client can edit texts and images.'),
        feat('Blog or news section', false, 6, 'Listing and article pages.'),
        feat('Analytics setup', false, 1.5, 'Privacy-friendly analytics configuration.'),
        feat('Testing and deployment', true, 3),
      ],
      exclusions: exc([
        'Domain registration',
        'Hosting and cloud infrastructure',
        'Paid plugins and licences',
        'Copywriting and translation',
        'Professional photography',
        'Ongoing maintenance',
        'Advanced SEO',
        'Additional features outside the agreed scope',
      ]),
      extras: [
        extraHourly('Additional page', 'One extra page in the existing design.', 30, 3),
        extraHourly('Additional language', 'Second language and switcher.', 30, 8),
        extraHourly('Advanced animations', 'Scroll-based and interactive animations.', 30, 8),
        maintenanceExtra(),
      ],
    },
    {
      name: 'E-commerce Website',
      categoryId: 'cat-ecommerce',
      shortDescription: 'An online shop with catalogue, cart and checkout.',
      description:
        'An online store with product catalogue, cart, checkout and order notifications. Scope depends heavily on the number of products, payment methods and shipping rules, which are agreed before work starts.',
      targetClient: 'Shops and brands moving online or replacing an outdated store.',
      priceMode: 'range',
      priceMin: 900,
      priceMax: 1500,
      openEnded: false,
      hours: 45,
      complexity: 'medium',
      tags: ['E-commerce', 'Payments', 'Responsive', 'Catalogue'],
      features: [
        feat('Responsive design', true, 5),
        feat('Product catalogue', true, 8, 'Categories, product pages and filtering.', 'Define how many products are loaded in.'),
        feat('Cart and checkout', true, 10),
        feat('Payment integration', true, 6, 'One payment provider.', 'Provider fees are paid by the client.'),
        feat('Order emails', true, 3),
        feat('Admin dashboard', true, 6, 'Manage products and orders.'),
        feat('SEO basics', true, 3),
        feat('Testing and deployment', true, 4),
        feat('Discount codes', false, 4),
        feat('Multiple payment providers', false, 5),
      ],
      exclusions: exc([
        'Domain registration',
        'Hosting and cloud infrastructure',
        'Paid plugins and licences',
        'Third-party API costs',
        'Copywriting and translation',
        'Professional photography',
        'Ongoing maintenance',
        'Advanced SEO',
        'Additional features outside the agreed scope',
      ], [{ id: uid('exc'), name: 'Product data entry', notes: 'Bulk import of product data is quoted separately.' }]),
      extras: [
        extraHourly('Additional payment method', 'Another payment provider integration.', 30, 5),
        extraHourly('Additional language', 'Store translated into a second language.', 30, 10),
        extraHourly('Additional integration', 'Shipping, invoicing or stock system integration.', 30, 8),
        maintenanceExtra(),
      ],
    },
    {
      name: 'Booking System',
      categoryId: 'cat-webapps',
      shortDescription: 'Online appointment or reservation booking with availability management.',
      description:
        'A booking flow where clients choose a service, date and time, with availability rules, confirmations and an admin view for the business owner.',
      targetClient: 'Clinics, studios, salons, tour operators and any service business that takes appointments.',
      priceMode: 'range',
      priceMin: 800,
      priceMax: 1300,
      openEnded: false,
      hours: 40,
      complexity: 'medium',
      tags: ['Booking', 'Calendar', 'Notifications', 'Admin'],
      features: [
        feat('Booking functionality', true, 14, 'Service, date and time selection with availability rules.'),
        feat('Admin dashboard', true, 8, 'View, confirm and cancel bookings.'),
        feat('Email confirmations', true, 3),
        feat('Responsive design', true, 4),
        feat('Calendar sync', false, 5, 'Sync with an external calendar.', 'May require third-party credentials.'),
        feat('Payment integration', false, 6, 'Deposits or full payment at booking.'),
        feat('SMS reminders', false, 4, '', 'SMS provider costs are paid by the client.'),
        feat('Testing and deployment', true, 4),
      ],
      exclusions: exc([
        'Hosting and cloud infrastructure',
        'Paid plugins and licences',
        'Third-party API costs',
        'Copywriting and translation',
        'Ongoing maintenance',
        'Additional features outside the agreed scope',
      ]),
      extras: [
        extraHourly('Payment integration', 'Take deposits or full payments at booking.', 30, 6),
        extraHourly('Additional language', 'Booking flow in a second language.', 30, 6),
        extraHourly('Additional integration', 'Connect to calendar, CRM or messaging tools.', 30, 6),
        maintenanceExtra(),
      ],
    },
    {
      name: 'Client Portal',
      categoryId: 'cat-dashboards',
      shortDescription: 'A private area where clients log in to see documents, status or data.',
      description:
        'A secure, login-protected portal for sharing documents, project status, invoices or account data with clients, with role-based access and an admin area.',
      targetClient: 'Agencies, consultancies and service providers who share information with their clients.',
      priceMode: 'range',
      priceMin: 1000,
      priceMax: 2000,
      openEnded: false,
      hours: 55,
      complexity: 'high',
      tags: ['Authentication', 'Roles', 'Documents', 'Admin'],
      features: [
        feat('User authentication', true, 8, 'Sign-up/invite, login, password reset.'),
        feat('Role-based access', true, 6, 'Client and admin roles.'),
        feat('Client dashboard', true, 10),
        feat('Document sharing', true, 8, 'Upload and download files per client.', 'Storage costs depend on the provider.'),
        feat('Admin dashboard', true, 10),
        feat('Email notifications', false, 4),
        feat('Responsive design', true, 4),
        feat('Testing and deployment', true, 5),
      ],
      exclusions: exc([
        'Hosting and cloud infrastructure',
        'Paid plugins and licences',
        'Third-party API costs',
        'Ongoing maintenance',
        'Additional features outside the agreed scope',
      ], [{ id: uid('exc'), name: 'Data migration', notes: 'Importing existing client data is quoted separately.' }]),
      extras: [
        extraHourly('Additional integration', 'Connect to invoicing, CRM or other tools.', 30, 8),
        extraHourly('Custom dashboard widgets', 'Extra charts or data views for clients.', 30, 10),
        maintenanceExtra(),
      ],
    },
    {
      name: 'Custom Dashboard',
      categoryId: 'cat-dashboards',
      shortDescription: 'Internal dashboard that turns a business’s data into clear charts and tables.',
      description:
        'A tailored dashboard connected to the client’s data sources, with filtering, charts, tables and exports. Complexity depends on the number of data sources and views.',
      targetClient: 'Teams who need visibility over sales, operations or performance data.',
      priceMode: 'range',
      priceMin: 1000,
      priceMax: 2500,
      openEnded: false,
      hours: 60,
      complexity: 'high',
      tags: ['Charts', 'Data', 'Reporting', 'Internal tools'],
      features: [
        feat('Data source connection', true, 10, 'One data source (API, spreadsheet or database).'),
        feat('Charts and tables', true, 14),
        feat('Filters and date ranges', true, 6),
        feat('User authentication', false, 8),
        feat('Export to CSV/PDF', false, 4),
        feat('Responsive design', true, 4),
        feat('Testing and deployment', true, 5),
      ],
      exclusions: exc([
        'Hosting and cloud infrastructure',
        'Third-party API costs',
        'Paid plugins and licences',
        'Ongoing maintenance',
        'Additional features outside the agreed scope',
      ], [{ id: uid('exc'), name: 'Data cleaning', notes: 'Fixing inconsistent source data is quoted separately.' }]),
      extras: [
        extraHourly('Additional data source', 'Connect another database, API or spreadsheet.', 30, 8),
        extraHourly('Additional dashboard view', 'One more report page with charts and tables.', 30, 8),
        maintenanceExtra(),
      ],
    },
    {
      name: 'Custom Web Application',
      categoryId: 'cat-webapps',
      shortDescription: 'A bespoke web app built around a specific workflow or business need.',
      description:
        'A custom-built web application designed from your requirements: data model, user flows, interface and deployment. Scoped after a short discovery conversation, with the final price depending on features and integrations.',
      targetClient: 'Businesses with a process that off-the-shelf software does not handle well.',
      priceMode: 'range',
      priceMin: 1500,
      priceMax: 3000,
      openEnded: true,
      hours: 90,
      complexity: 'high',
      tags: ['React', 'TypeScript', 'API', 'Database'],
      features: [
        feat('Requirements and scoping', true, 8, 'Discovery, user flows and agreed feature list.'),
        feat('User authentication', true, 8),
        feat('Core application features', true, 40, 'The main features agreed in scope.', 'Define explicitly in the quote.'),
        feat('Admin dashboard', false, 10),
        feat('Third-party integration', false, 8),
        feat('Responsive design', true, 6),
        feat('Testing and deployment', true, 8),
      ],
      exclusions: exc([
        'Hosting and cloud infrastructure',
        'Paid plugins and licences',
        'Third-party API costs',
        'Ongoing maintenance',
        'Additional features outside the agreed scope',
      ]),
      extras: [
        extraHourly('Additional integration', 'Connect to another external service.', 30, 8),
        extraHourly('Additional feature module', 'A self-contained extra feature.', 30, 12),
        maintenanceExtra(),
      ],
    },
  ];

  const now = Date.now();
  return inputs.map((input, i) => {
    // Space the timestamps so "Recently updated" has a stable, sensible order.
    const stamp = new Date(now - i * 60_000).toISOString();
    return {
      ...input,
      id: uid('svc'),
      costs: emptyCosts(),
      archived: false,
      createdAt: stamp,
      updatedAt: stamp,
    };
  });
}

export function defaultRates(): HourlyRate[] {
  return [
    { id: 'rate-content', name: 'Content and text updates', kind: 'hourly', rate: 25, notes: 'Changing texts, images and simple content.' },
    { id: 'rate-layout', name: 'Layout, responsive design and integrations', kind: 'hourly', rate: 30, notes: 'Layout work, responsive fixes and third-party integrations.' },
    { id: 'rate-extensive', name: 'Extensive website changes', kind: 'quote', rate: null, notes: 'Fixed quote, based on scope.' },
    { id: 'rate-support', name: 'Technical support and other services', kind: 'hourly', rate: null, notes: 'Configurable hourly rate — set yours.' },
  ];
}

export function defaultMaintenance(): MaintenancePackage[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'maint-basic',
      name: 'Basic maintenance',
      priceMin: 30,
      priceMax: 50,
      supportHours: 0.5,
      updatesBackups: 'Software and dependency updates.',
      securityChecks: '',
      contentChanges: '',
      response: 'Within 3 working days.',
      exclusions: 'Content changes, new features, security incident response.',
      extraHourlyRate: 30,
      updatedAt: now,
    },
    {
      id: 'maint-security',
      name: 'Maintenance with security and backups',
      priceMin: 50,
      priceMax: 100,
      supportHours: 1,
      updatesBackups: 'Software and dependency updates, plus scheduled backups.',
      securityChecks: 'Regular security checks and uptime monitoring.',
      contentChanges: '',
      response: 'Within 2 working days.',
      exclusions: 'New features and large content changes.',
      extraHourlyRate: 30,
      updatedAt: now,
    },
    {
      id: 'maint-seo',
      name: 'Maintenance with SEO and content updates',
      priceMin: 75,
      priceMax: 150,
      supportHours: 2,
      updatesBackups: 'Software and dependency updates, plus scheduled backups.',
      securityChecks: 'Regular security checks and uptime monitoring.',
      contentChanges: 'Routine text and image updates within the included hours.',
      response: 'Within 1 working day.',
      exclusions: 'New features and extensive redesigns.',
      extraHourlyRate: 30,
      updatedAt: now,
    },
  ];
}

export function defaultSettings(): Settings {
  return {
    theme: 'dark',
    locale: 'en',
    businessName: '',
    businessContact: '',
    defaultInternalCost: null,
    quoteValidityDays: 30,
    disclaimer:
      'This is an indicative estimate, not a guaranteed quotation. Final prices are confirmed in writing once the scope is agreed. Prices exclude VAT unless stated otherwise.',
  };
}

export function newQuoteDraft(settings: Settings, layoutRate = 30): QuoteDraft {
  const issue = todayISO();
  const stamp = issue.replace(/-/g, '');
  return {
    reference: `Q-${stamp}-${Math.floor(100 + Math.random() * 900)}`,
    clientName: '',
    projectTitle: '',
    projectNotes: '',
    issueDate: issue,
    validUntil: addDays(issue, settings.quoteValidityDays),
    serviceId: null,
    basePrice: 0,
    featureIds: [],
    featureRate: layoutRate,
    extras: {},
    additional: [],
    maintenanceId: null,
    maintenancePrice: 0,
    includeThirdParty: false,
    disclaimer: settings.disclaimer,
  };
}

export function createSeedData(): AppData {
  const settings = defaultSettings();
  return {
    version: 1,
    services: buildServices(),
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    rates: defaultRates(),
    maintenance: defaultMaintenance(),
    settings,
    quote: newQuoteDraft(settings),
  };
}

export function blankService(categoryId: string): Service {
  const now = new Date().toISOString();
  return {
    id: uid('svc'),
    name: '',
    categoryId,
    shortDescription: '',
    description: '',
    targetClient: '',
    priceMode: 'range',
    priceMin: 0,
    priceMax: 0,
    openEnded: false,
    hours: null,
    complexity: 'medium',
    tags: [],
    features: [],
    exclusions: [],
    extras: [],
    costs: emptyCosts(),
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
}
