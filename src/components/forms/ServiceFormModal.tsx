import { useState } from 'react';
import { Button, Checkbox, Field, Modal, NumberInput, Segmented, Select, TagInput, TextArea, TextInput } from '../ui';
import { useStore } from '../../store/store';
import { blankService } from '../../data/seed';
import { COMPLEXITIES, PRICE_MODES, type Service } from '../../types';

interface Props {
  /** Existing service to edit. Omit to create a new one. */
  service?: Service;
  onClose: () => void;
  onSaved: (id: string) => void;
}

type Errors = Partial<Record<'name' | 'categoryId' | 'priceMin' | 'priceMax' | 'hours', string>>;

export function ServiceFormModal({ service, onClose, onSaved }: Props) {
  const { data, t, createService, saveService } = useStore();
  const [v, setV] = useState<Service>(() => service ?? blankService(data.categories[0]?.id ?? ''));
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof Service>(key: K, value: Service[K]) => setV((s) => ({ ...s, [key]: value }));

  function validate(s: Service): Errors {
    const e: Errors = {};
    if (!s.name.trim()) e.name = 'Give the service a name.';
    else if (s.name.trim().length > 80) e.name = 'Keep the name under 80 characters.';
    if (!s.categoryId) e.categoryId = 'Choose a category.';
    if (s.priceMin < 0 || !Number.isFinite(s.priceMin)) e.priceMin = 'Enter a price of 0 or more.';
    if (s.priceMode === 'range' && s.priceMax < s.priceMin) e.priceMax = 'The maximum must be at least the minimum.';
    if (s.hours != null && s.hours < 0) e.hours = 'Hours cannot be negative.';
    return e;
  }

  // Re-validate live once the user has tried to submit.
  const liveErrors = submitted ? validate(v) : errors;

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setSubmitted(true);
    const found = validate(v);
    setErrors(found);
    if (Object.keys(found).length) return;
    const cleaned: Service = {
      ...v,
      name: v.name.trim(),
      shortDescription: v.shortDescription.trim(),
      description: v.description.trim(),
      targetClient: v.targetClient.trim(),
      priceMax: v.priceMode === 'range' ? v.priceMax : v.priceMin,
      openEnded: v.priceMode === 'range' && v.openEnded,
    };
    if (service) {
      saveService(cleaned);
      onSaved(cleaned.id);
    } else {
      onSaved(createService(cleaned));
    }
  }

  return (
    <Modal
      size="lg"
      title={service ? `Edit “${service.name}”` : 'New service'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" type="submit" form="service-form">
            {service ? t('common.save') : t('common.create')}
          </Button>
        </>
      }
    >
      <form id="service-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Service name" required error={liveErrors.name} className="sm:col-span-2">
          <TextInput autoFocus value={v.name} onChange={(e) => set('name', e.target.value)} invalid={!!liveErrors.name} placeholder="e.g. Professional Website" />
        </Field>

        <Field label="Category" required error={liveErrors.categoryId}>
          <Select value={v.categoryId} onChange={(e) => set('categoryId', e.target.value)} invalid={!!liveErrors.categoryId}>
            {data.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Complexity">
          <Select value={v.complexity} onChange={(e) => set('complexity', e.target.value as Service['complexity'])}>
            {COMPLEXITIES.map((c) => (
              <option key={c} value={c}>
                {t(`complexity.${c}`)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Short description" className="sm:col-span-2" hint="One line shown on the service card.">
          <TextInput value={v.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} />
        </Field>

        <Field label="Detailed description" className="sm:col-span-2">
          <TextArea rows={4} value={v.description} onChange={(e) => set('description', e.target.value)} />
        </Field>

        <Field label="Target client" className="sm:col-span-2">
          <TextInput value={v.targetClient} onChange={(e) => set('targetClient', e.target.value)} placeholder="Who is this service for?" />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Pricing type" group>
            <Segmented
              value={v.priceMode}
              onChange={(m) => set('priceMode', m)}
              options={PRICE_MODES.map((m) => ({ value: m, label: t(`priceMode.${m}`) }))}
            />
          </Field>
        </div>

        <Field
          label={v.priceMode === 'range' ? 'Minimum price' : v.priceMode === 'fixed' ? 'Fixed price' : 'Starting price'}
          required
          error={liveErrors.priceMin}
        >
          <NumberInput value={v.priceMin} onChange={(n) => set('priceMin', n ?? 0)} suffix="EUR" invalid={!!liveErrors.priceMin} aria-label="Minimum price" />
        </Field>

        {v.priceMode === 'range' ? (
          <Field label="Maximum price" required error={liveErrors.priceMax}>
            <NumberInput value={v.priceMax} onChange={(n) => set('priceMax', n ?? 0)} suffix="EUR" invalid={!!liveErrors.priceMax} aria-label="Maximum price" />
          </Field>
        ) : (
          <div />
        )}

        {v.priceMode === 'range' && (
          <div className="sm:col-span-2">
            <Checkbox checked={v.openEnded} onChange={(c) => set('openEnded', c)} label="Open-ended maximum (shown as “3 000 €+”)" />
          </div>
        )}

        <Field label="Estimated development hours" error={liveErrors.hours}>
          <NumberInput value={v.hours} onChange={(n) => set('hours', n)} suffix="h" invalid={!!liveErrors.hours} aria-label="Estimated development hours" />
        </Field>

        <Field label="Tags / technologies" group className="sm:col-span-2">
          <TagInput value={v.tags} onChange={(tags) => set('tags', tags)} placeholder="Type a tag and press Enter" />
        </Field>
      </form>
    </Modal>
  );
}
