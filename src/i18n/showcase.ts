// Strings for the public services page (src/pages/Showcase.tsx).
// The catalogue content in src/data/seed.ts is written in English; CONTENT_PT maps each
// English text to its Portuguese version. Anything missing from the map is shown in English,
// so when you add or rename something in seed.ts, add its translation here too.

export type Lang = 'en' | 'pt';

export const UI = {
  en: {
    pageTitle: 'Services & Pricing · Luan Moreno',
    navServices: 'Services',
    navMaintenance: 'Maintenance',
    navPortfolio: 'Portfolio',
    contact: 'Contact',
    language: 'Language',
    eyebrow: 'Services & pricing',
    title: 'What I can build for your business',
    intro:
      'Websites, online stores, web applications and dashboards, with clear starting prices. Every project is different, so the final price is agreed after a short conversation about your needs.',
    heroCta: "Let's talk about your project",
    seeServices: 'See services',
    filterLabel: 'Filter by category',
    all: 'All',
    from: 'From',
    fromLower: 'from',
    priceNote: 'Indicative price range',
    moreIncluded: (n: number) => `+ ${n} more included`,
    idealFor: 'Ideal for',
    addons: 'Optional add-ons',
    notIncluded: 'Not included',
    fullDetails: 'Full details',
    showLess: 'Show less',
    requestQuote: 'Request a quote',
    perMonth: ' / month',
    perHour: ' / hour',
    maintTitle: 'Maintenance after launch',
    maintText: 'Monthly plans to keep your website or application updated, secure and running smoothly.',
    supportHours: (h: string) => `${h} h of support included per month`,
    response: 'Response',
    ratesTitle: 'Changes and extra work',
    ratesText: 'For updates to an existing website or work outside a plan.',
    quoted: 'Quoted per project',
    ctaTitle: 'Have a project in mind?',
    ctaText: "Tell me what you need and I'll get back to you with a tailored proposal. Get in touch through my portfolio.",
    ctaButton: 'Contact me at luan-moreno.com',
  },
  pt: {
    pageTitle: 'Serviços e Preços · Luan Moreno',
    navServices: 'Serviços',
    navMaintenance: 'Manutenção',
    navPortfolio: 'Portfólio',
    contact: 'Contacto',
    language: 'Idioma',
    eyebrow: 'Serviços e preços',
    title: 'O que posso criar para o seu negócio',
    intro:
      'Websites, lojas online, aplicações web e dashboards, com preços de partida claros. Cada projeto é diferente, por isso o preço final é acordado depois de uma breve conversa sobre as suas necessidades.',
    heroCta: 'Vamos falar do seu projeto',
    seeServices: 'Ver serviços',
    filterLabel: 'Filtrar por categoria',
    all: 'Todos',
    from: 'A partir de',
    fromLower: 'desde',
    priceNote: 'Intervalo de preço indicativo',
    moreIncluded: (n: number) => `+ ${n} ${n === 1 ? 'incluído' : 'incluídos'}`,
    idealFor: 'Ideal para',
    addons: 'Extras opcionais',
    notIncluded: 'Não incluído',
    fullDetails: 'Ver detalhes',
    showLess: 'Ver menos',
    requestQuote: 'Pedir orçamento',
    perMonth: ' / mês',
    perHour: ' / hora',
    maintTitle: 'Manutenção após o lançamento',
    maintText: 'Planos mensais para manter o seu website ou aplicação atualizado, seguro e a funcionar sem problemas.',
    supportHours: (h: string) => `${h} h de suporte incluídas por mês`,
    response: 'Resposta',
    ratesTitle: 'Alterações e trabalho extra',
    ratesText: 'Para alterações a um website existente ou trabalho fora de um plano.',
    quoted: 'Orçamentado por projeto',
    ctaTitle: 'Tem um projeto em mente?',
    ctaText: 'Diga-me o que precisa e respondo com uma proposta à medida. Entre em contacto através do meu portfólio.',
    ctaButton: 'Contacte-me em luan-moreno.com',
  },
};

export type ShowcaseText = (typeof UI)['en'];

export const CONTENT_PT: Record<string, string> = {
  // Categories
  Websites: 'Websites',
  'E-commerce': 'E-commerce',
  'Web Applications': 'Aplicações Web',
  'Dashboards and Portals': 'Dashboards e Portais',
  'Automation and Integrations': 'Automação e Integrações',
  'SaaS Products': 'Produtos SaaS',
  'Maintenance and Support': 'Manutenção e Suporte',

  // Institutional Website
  'Institutional Website': 'Website Institucional',
  'A clean, fast presentation site for a business, association or professional.':
    'Um site de apresentação limpo e rápido para empresas, associações ou profissionais.',
  'A small multi-page website that presents who you are, what you do and how to get in touch. Built to be fast, accessible and easy to find on search engines, with a content structure agreed up front.':
    'Um website com várias páginas que apresenta quem é, o que faz e como entrar em contacto. Rápido, acessível e fácil de encontrar nos motores de pesquisa, com uma estrutura de conteúdos definida desde o início.',
  'Small businesses, associations and independent professionals who need a credible online presence.':
    'Pequenas empresas, associações e profissionais independentes que precisam de uma presença online credível.',

  // Professional Website
  'Professional Website': 'Website Profissional',
  'A more complete, custom-designed site with content editing and stronger SEO groundwork.':
    'Um site mais completo, com design à medida, edição de conteúdos e uma base de SEO mais sólida.',
  'A custom-designed website with more pages, richer sections and an editable content setup, aimed at businesses that update their site regularly and want to stand out.':
    'Um website com design à medida, mais páginas, secções mais ricas e conteúdos editáveis, pensado para empresas que atualizam o site com regularidade e querem destacar-se.',
  'Established businesses and professional services that need a polished, editable site.':
    'Empresas estabelecidas e serviços profissionais que precisam de um site cuidado e editável.',

  // E-commerce Website
  'E-commerce Website': 'Loja Online',
  'An online shop with catalogue, cart and checkout.': 'Uma loja online com catálogo, carrinho e checkout.',
  'An online store with product catalogue, cart, checkout and order notifications. Scope depends heavily on the number of products, payment methods and shipping rules, which are agreed before work starts.':
    'Uma loja online com catálogo de produtos, carrinho, checkout e notificações de encomendas. O âmbito depende muito do número de produtos, dos métodos de pagamento e das regras de envio, que são definidos antes de começar.',
  'Shops and brands moving online or replacing an outdated store.':
    'Lojas e marcas que querem vender online ou substituir uma loja desatualizada.',

  // Booking System
  'Booking System': 'Sistema de Reservas',
  'Online appointment or reservation booking with availability management.':
    'Marcação online de consultas ou reservas, com gestão de disponibilidade.',
  'A booking flow where clients choose a service, date and time, with availability rules, confirmations and an admin view for the business owner.':
    'Um sistema de reservas onde os clientes escolhem o serviço, a data e a hora, com regras de disponibilidade, confirmações e uma área de gestão para o negócio.',
  'Clinics, studios, salons, tour operators and any service business that takes appointments.':
    'Clínicas, estúdios, salões, operadores turísticos e qualquer negócio que trabalhe com marcações.',

  // Client Portal
  'Client Portal': 'Portal de Clientes',
  'A private area where clients log in to see documents, status or data.':
    'Uma área privada onde os clientes entram para ver documentos, estados ou dados.',
  'A secure, login-protected portal for sharing documents, project status, invoices or account data with clients, with role-based access and an admin area.':
    'Um portal seguro, protegido por login, para partilhar documentos, estado de projetos, faturas ou dados de conta com os clientes, com acessos por perfil e uma área de administração.',
  'Agencies, consultancies and service providers who share information with their clients.':
    'Agências, consultoras e prestadores de serviços que partilham informação com os seus clientes.',

  // Custom Dashboard
  'Custom Dashboard': 'Dashboard Personalizado',
  'Internal dashboard that turns a business’s data into clear charts and tables.':
    'Um dashboard interno que transforma os dados do negócio em gráficos e tabelas claros.',
  'A tailored dashboard connected to the client’s data sources, with filtering, charts, tables and exports. Complexity depends on the number of data sources and views.':
    'Um dashboard à medida, ligado às fontes de dados do cliente, com filtros, gráficos, tabelas e exportações. A complexidade depende do número de fontes de dados e de vistas.',
  'Teams who need visibility over sales, operations or performance data.':
    'Equipas que precisam de visibilidade sobre vendas, operações ou desempenho.',

  // Custom Web Application
  'Custom Web Application': 'Aplicação Web à Medida',
  'A bespoke web app built around a specific workflow or business need.':
    'Uma aplicação web feita à medida de um processo ou necessidade específica do negócio.',
  'A custom-built web application designed from your requirements: data model, user flows, interface and deployment. Scoped after a short discovery conversation, with the final price depending on features and integrations.':
    'Uma aplicação web desenvolvida a partir dos seus requisitos: modelo de dados, fluxos de utilização, interface e publicação. O âmbito é definido após uma breve conversa inicial, e o preço final depende das funcionalidades e integrações.',
  'Businesses with a process that off-the-shelf software does not handle well.':
    'Empresas com processos que o software genérico não resolve bem.',

  // Features
  'Responsive design': 'Design responsivo',
  'Number of pages': 'Número de páginas',
  'Contact form': 'Formulário de contacto',
  'SEO basics': 'SEO básico',
  'Testing and deployment': 'Testes e publicação',
  'CMS or content editing': 'CMS ou edição de conteúdos',
  'Multilingual pages': 'Páginas multilingues',
  'Custom visual design': 'Design visual à medida',
  'Blog or news section': 'Blog ou secção de notícias',
  'Analytics setup': 'Configuração de estatísticas',
  'Product catalogue': 'Catálogo de produtos',
  'Cart and checkout': 'Carrinho e checkout',
  'Payment integration': 'Integração de pagamentos',
  'Order emails': 'Emails de encomenda',
  'Admin dashboard': 'Painel de administração',
  'Discount codes': 'Códigos de desconto',
  'Multiple payment providers': 'Vários métodos de pagamento',
  'Booking functionality': 'Funcionalidade de reservas',
  'Email confirmations': 'Confirmações por email',
  'Calendar sync': 'Sincronização de calendário',
  'SMS reminders': 'Lembretes por SMS',
  'User authentication': 'Autenticação de utilizadores',
  'Role-based access': 'Acessos por perfil',
  'Client dashboard': 'Painel do cliente',
  'Document sharing': 'Partilha de documentos',
  'Email notifications': 'Notificações por email',
  'Data source connection': 'Ligação a uma fonte de dados',
  'Charts and tables': 'Gráficos e tabelas',
  'Filters and date ranges': 'Filtros e intervalos de datas',
  'Export to CSV/PDF': 'Exportação para CSV/PDF',
  'Requirements and scoping': 'Levantamento de requisitos',
  'Core application features': 'Funcionalidades principais',
  'Third-party integration': 'Integração com serviços externos',

  // Optional extras
  'Additional page': 'Página adicional',
  'Additional language': 'Idioma adicional',
  'Basic maintenance plan': 'Plano de manutenção básico',
  'Advanced animations': 'Animações avançadas',
  'Additional payment method': 'Método de pagamento adicional',
  'Additional integration': 'Integração adicional',
  'Custom dashboard widgets': 'Widgets de dashboard personalizados',
  'Additional data source': 'Fonte de dados adicional',
  'Additional dashboard view': 'Vista de dashboard adicional',
  'Additional feature module': 'Módulo de funcionalidade adicional',

  // Exclusions
  'Domain registration': 'Registo de domínio',
  'Hosting and cloud infrastructure': 'Alojamento e infraestrutura cloud',
  'Paid plugins and licences': 'Plugins e licenças pagas',
  'Third-party API costs': 'Custos de APIs de terceiros',
  'Copywriting and translation': 'Redação de textos e tradução',
  'Professional photography': 'Fotografia profissional',
  'Ongoing maintenance': 'Manutenção contínua',
  'Advanced SEO': 'SEO avançado',
  'Additional features outside the agreed scope': 'Funcionalidades fora do âmbito acordado',
  'Product data entry': 'Introdução de dados de produtos',
  'Data migration': 'Migração de dados',
  'Data cleaning': 'Limpeza de dados',

  // Maintenance packages
  'Basic maintenance': 'Manutenção básica',
  'Maintenance with security and backups': 'Manutenção com segurança e cópias de segurança',
  'Maintenance with SEO and content updates': 'Manutenção com SEO e atualização de conteúdos',
  'Software and dependency updates.': 'Atualizações de software e dependências.',
  'Software and dependency updates, plus scheduled backups.':
    'Atualizações de software e dependências, com cópias de segurança agendadas.',
  'Regular security checks and uptime monitoring.': 'Verificações de segurança regulares e monitorização da disponibilidade.',
  'Routine text and image updates within the included hours.':
    'Atualizações regulares de textos e imagens dentro das horas incluídas.',
  'Within 3 working days.': 'Até 3 dias úteis.',
  'Within 2 working days.': 'Até 2 dias úteis.',
  'Within 1 working day.': 'Até 1 dia útil.',
  'Content changes, new features, security incident response.':
    'Alterações de conteúdo, novas funcionalidades e resposta a incidentes de segurança.',
  'New features and large content changes.': 'Novas funcionalidades e grandes alterações de conteúdo.',
  'New features and extensive redesigns.': 'Novas funcionalidades e redesigns extensos.',

  // Rates
  'Content and text updates': 'Atualização de conteúdos e textos',
  'Layout, responsive design and integrations': 'Layout, design responsivo e integrações',
  'Extensive website changes': 'Alterações extensas ao website',

  // Disclaimer
  'This is an indicative estimate, not a guaranteed quotation. Final prices are confirmed in writing once the scope is agreed. Prices exclude VAT unless stated otherwise.':
    'Este é um valor indicativo, não um orçamento garantido. Os preços finais são confirmados por escrito depois de definido o âmbito. Os preços não incluem IVA, salvo indicação em contrário.',
};
