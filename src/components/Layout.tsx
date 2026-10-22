import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Calculator, FolderTree, LayoutDashboard, Menu, Moon, Package, Settings as SettingsIcon, Sun, Wrench, X, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/store';
import type { MessageKey } from '../i18n';

const NAV: { to: string; key: MessageKey; icon: typeof LayoutDashboard; end?: boolean }[] = [
  { to: '/', key: 'nav.overview', icon: LayoutDashboard, end: true },
  { to: '/services', key: 'nav.services', icon: Package },
  { to: '/maintenance', key: 'nav.maintenance', icon: Wrench },
  { to: '/quote', key: 'nav.quote', icon: Calculator },
  { to: '/categories', key: 'nav.categories', icon: FolderTree },
  { to: '/settings', key: 'nav.settings', icon: SettingsIcon },
];

function Brand() {
  const { t } = useStore();
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-accent/40 bg-accent/10 text-sm font-bold text-accent" aria-hidden="true">
        €
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold">{t('app.name')}</div>
        <div className="text-xs text-muted">{t('app.tagline')}</div>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t, data, updateSettings } = useStore();
  const dark = data.settings.theme === 'dark';
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Brand />
      <nav className="flex flex-col gap-0.5" aria-label="Main">
        {NAV.map(({ to, key, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                isActive ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-surface2 hover:text-fg'
              }`
            }
          >
            <Icon size={17} aria-hidden="true" />
            {t(key)}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto space-y-3">
        <button
          type="button"
          onClick={() => updateSettings({ theme: dark ? 'light' : 'dark' })}
          className="flex w-full items-center gap-3 rounded-md border border-border px-3 py-2 text-sm text-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          {dark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          {dark ? t('nav.lightMode') : t('nav.darkMode')}
        </button>
        <p className="px-1 text-[11px] leading-snug text-muted">{t('app.disclaimer')}</p>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { t, storageOk } = useStore();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Close the mobile drawer and scroll to top on navigation.
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr] print:block">
      <aside className="sticky top-0 hidden h-screen border-r border-border bg-surface lg:block print:hidden">
        <SidebarContent />
      </aside>

      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden print:hidden">
        <Brand />
        <button
          type="button"
          aria-label={t('nav.menu')}
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-muted hover:bg-surface2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden print:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-border bg-surface">
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-md p-1.5 text-muted hover:text-fg">
              <X size={18} aria-hidden="true" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-8 print:p-0">
        {!storageOk && (
          <div role="alert" className="mb-4 flex items-start gap-2 rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn print:hidden">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            Your browser is blocking local storage, so changes will be lost when you close this tab. Export a JSON backup from Settings & data.
          </div>
        )}
        <div className="mx-auto max-w-6xl print:max-w-none">{children}</div>
      </main>
    </div>
  );
}
