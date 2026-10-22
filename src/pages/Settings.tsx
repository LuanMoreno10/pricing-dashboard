import { useRef } from 'react';
import { Download, RotateCcw, Upload } from 'lucide-react';
import { useStore } from '../store/store';
import { Button, Field, NumberInput, PageHeader, SectionTitle, Segmented, Select, TextArea, TextInput } from '../components/ui';
import { useConfirm, useToast } from '../components/feedback';
import { LOCALES } from '../i18n';
import { toISODate } from '../lib/format';
import type { Locale } from '../types';

export default function SettingsPage() {
  const { data, t, updateSettings, exportData, importData, resetAll } = useStore();
  const { settings } = data;
  const confirm = useConfirm();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  function download() {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rate-card-catalogue-${toISODate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoking synchronously can cancel the download in Safari and Firefox.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Catalogue exported');
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    const ok = await confirm({
      title: 'Replace your catalogue?',
      message: `Importing “${file.name}” replaces all current services, categories, rates, maintenance packages and settings. Export a backup first if you want to keep them.`,
      confirmLabel: 'Import and replace',
      danger: true,
    });
    if (fileRef.current) fileRef.current.value = '';
    if (!ok) return;
    const result = importData(text);
    if (result.ok) toast('Catalogue imported');
    else toast(result.error, 'error');
  }

  async function reset() {
    const ok = await confirm({
      title: 'Reset to the initial catalogue?',
      message: 'All your changes — services, rates, packages, categories, settings and the current quote — will be replaced by the original sample data. This cannot be undone.',
      confirmLabel: 'Reset everything',
    });
    if (ok) {
      resetAll();
      toast('Catalogue reset');
    }
  }

  return (
    <>
      <PageHeader title={t('settings.title')} description={t('settings.subtitle')} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <SectionTitle>Preferences</SectionTitle>
          <div className="grid gap-4">
            <Field label="Theme" group>
              <Segmented
                value={settings.theme}
                onChange={(theme) => updateSettings({ theme })}
                options={[
                  { value: 'dark', label: 'Dark' },
                  { value: 'light', label: 'Light' },
                ]}
              />
            </Field>
            <Field label="Language" hint="Portuguese is on the roadmap: strings live in src/i18n.">
              <Select value={settings.locale} onChange={(e) => updateSettings({ locale: e.target.value as Locale })}>
                {(Object.keys(LOCALES) as Locale[]).map((l) => (
                  <option key={l} value={l} disabled={!LOCALES[l].available}>
                    {LOCALES[l].label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Currency / number format" hint="EUR with Portuguese (pt-PT) number and date conventions.">
              <TextInput value="EUR · pt-PT" readOnly disabled />
            </Field>
          </div>
        </section>

        <section className="card p-5">
          <SectionTitle>Business & quote defaults</SectionTitle>
          <div className="grid gap-4">
            <Field label="Business / your name" hint="Shown at the top of printed quotes.">
              <TextInput value={settings.businessName} onChange={(e) => updateSettings({ businessName: e.target.value })} />
            </Field>
            <Field label="Contact details" hint="Email, phone or website — shown on printed quotes.">
              <TextInput value={settings.businessContact} onChange={(e) => updateSettings({ businessContact: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Default internal hourly cost" hint="Used for cost estimates when a service has none.">
                <NumberInput value={settings.defaultInternalCost} suffix="€/h" onChange={(n) => updateSettings({ defaultInternalCost: n == null ? null : Math.max(0, n) })} aria-label="Default internal hourly cost" />
              </Field>
              <Field label="Quote validity (days)">
                <NumberInput value={settings.quoteValidityDays} suffix="days" onChange={(n) => updateSettings({ quoteValidityDays: Math.max(1, Math.round(n ?? 30)) })} aria-label="Quote validity in days" />
              </Field>
            </div>
            <Field label="Default quote disclaimer" hint="Copied into new quotes. You can still edit it per quote.">
              <TextArea rows={4} value={settings.disclaimer} onChange={(e) => updateSettings({ disclaimer: e.target.value })} />
            </Field>
          </div>
        </section>

        <section className="card p-5 lg:col-span-2">
          <SectionTitle>Data</SectionTitle>
          <p className="mb-4 max-w-2xl text-sm text-muted">
            Everything is stored in this browser only (LocalStorage) — nothing is sent anywhere. Export a JSON backup regularly, and use it to move your catalogue to another browser or device.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button icon={Download} onClick={download}>
              {t('common.export')}
            </Button>
            <Button icon={Upload} onClick={() => fileRef.current?.click()}>
              {t('common.import')}
            </Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" aria-label="Import catalogue JSON file" onChange={(e) => onFile(e.target.files?.[0])} />
            <Button variant="danger" icon={RotateCcw} onClick={reset}>
              Reset to initial catalogue
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted">
            {data.services.length} services · {data.categories.length} categories · {data.rates.length} rates · {data.maintenance.length} maintenance packages
          </p>
        </section>
      </div>
    </>
  );
}
