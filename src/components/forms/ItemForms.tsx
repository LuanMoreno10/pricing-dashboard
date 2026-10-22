import { useState } from 'react';
import { Button, Field, Modal, NumberInput, Select, TextArea, TextInput, Toggle } from '../ui';
import { EXTRA_MODELS, type Category, type Exclusion, type Extra, type Feature, type HourlyRate, type MaintenancePackage } from '../../types';
import { uid } from '../../lib/id';
import { useStore } from '../../store/store';

/* ------------------------------------------------------------------ */
/* Feature                                                             */
/* ------------------------------------------------------------------ */

export function FeatureFormModal({ feature, onSave, onClose }: { feature?: Feature; onSave: (f: Feature) => void; onClose: () => void }) {
  const [v, setV] = useState<Feature>(() => feature ?? { id: uid('feat'), name: '', description: '', included: true, hours: 0, notes: '' });
  const [submitted, setSubmitted] = useState(false);
  const errName = submitted && !v.name.trim() ? 'Give the feature a name.' : undefined;
  const errHours = submitted && v.hours < 0 ? 'Hours cannot be negative.' : undefined;

  return (
    <Modal
      title={feature ? 'Edit feature' : 'Add feature'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="feature-form">
            Save
          </Button>
        </>
      }
    >
      <form
        id="feature-form"
        noValidate
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (!v.name.trim() || v.hours < 0) return;
          onSave({ ...v, name: v.name.trim() });
        }}
      >
        <Field label="Name" required error={errName}>
          <TextInput autoFocus value={v.name} invalid={!!errName} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="e.g. Contact form" />
        </Field>
        <Field label="Description">
          <TextArea rows={2} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Estimated implementation hours" error={errHours}>
            <NumberInput value={v.hours} suffix="h" invalid={!!errHours} onChange={(n) => setV({ ...v, hours: n ?? 0 })} aria-label="Estimated implementation hours" />
          </Field>
          <Field label="Included in the base price" group>
            <div className="flex items-center gap-3 pt-1.5">
              <Toggle checked={v.included} onChange={(c) => setV({ ...v, included: c })} label="Included by default" />
              <span className="text-sm text-muted">{v.included ? 'Included by default' : 'Optional / not in base price'}</span>
            </div>
          </Field>
        </div>
        <Field label="Notes">
          <TextArea rows={2} value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} />
        </Field>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Exclusion                                                           */
/* ------------------------------------------------------------------ */

export function ExclusionFormModal({ exclusion, onSave, onClose }: { exclusion?: Exclusion; onSave: (x: Exclusion) => void; onClose: () => void }) {
  const [v, setV] = useState<Exclusion>(() => exclusion ?? { id: uid('exc'), name: '', notes: '' });
  const [submitted, setSubmitted] = useState(false);
  const err = submitted && !v.name.trim() ? 'Give the exclusion a name.' : undefined;
  return (
    <Modal
      size="sm"
      title={exclusion ? 'Edit exclusion' : 'Add exclusion or assumption'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="exclusion-form">
            Save
          </Button>
        </>
      }
    >
      <form
        id="exclusion-form"
        noValidate
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (!v.name.trim()) return;
          onSave({ ...v, name: v.name.trim() });
        }}
      >
        <Field label="Name" required error={err}>
          <TextInput autoFocus value={v.name} invalid={!!err} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="e.g. Domain registration" />
        </Field>
        <Field label="Notes / assumption">
          <TextArea rows={3} value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} />
        </Field>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Extra                                                               */
/* ------------------------------------------------------------------ */

export function ExtraFormModal({ extra, onSave, onClose }: { extra?: Extra; onSave: (x: Extra) => void; onClose: () => void }) {
  const { t } = useStore();
  const [v, setV] = useState<Extra>(
    () => extra ?? { id: uid('extra'), name: '', description: '', model: 'fixed', priceMin: 0, priceMax: 0, hours: 0, notes: '' },
  );
  const [submitted, setSubmitted] = useState(false);
  const errName = submitted && !v.name.trim() ? 'Give the extra a name.' : undefined;
  const errPrice = submitted && v.priceMax < v.priceMin ? 'The maximum must be at least the minimum.' : undefined;
  const priceLabel = v.model === 'hourly' ? 'Hourly rate' : v.model === 'recurring' ? 'Monthly fee' : 'Price';

  return (
    <Modal
      title={extra ? 'Edit optional extra' : 'Add optional extra'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="extra-form">
            Save
          </Button>
        </>
      }
    >
      <form
        id="extra-form"
        noValidate
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (!v.name.trim() || v.priceMax < v.priceMin) return;
          onSave({ ...v, name: v.name.trim() });
        }}
      >
        <Field label="Name" required error={errName} className="sm:col-span-2">
          <TextInput autoFocus value={v.name} invalid={!!errName} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="e.g. Additional language" />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <TextArea rows={2} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />
        </Field>
        <Field label="Pricing model" className="sm:col-span-2">
          <Select value={v.model} onChange={(e) => setV({ ...v, model: e.target.value as Extra['model'] })}>
            {EXTRA_MODELS.map((m) => (
              <option key={m} value={m}>
                {t(`extraModel.${m}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={`${priceLabel} — from`}>
          <NumberInput
            value={v.priceMin}
            suffix={v.model === 'hourly' ? '€/h' : v.model === 'recurring' ? '€/mo' : 'EUR'}
            onChange={(n) => {
              const min = n ?? 0;
              setV({ ...v, priceMin: min, priceMax: v.priceMax < min || v.priceMax === v.priceMin ? min : v.priceMax });
            }}
            aria-label={`${priceLabel} minimum`}
          />
        </Field>
        <Field label={`${priceLabel} — up to`} error={errPrice} hint="Same as “from” for a single price.">
          <NumberInput
            value={v.priceMax}
            suffix={v.model === 'hourly' ? '€/h' : v.model === 'recurring' ? '€/mo' : 'EUR'}
            invalid={!!errPrice}
            onChange={(n) => setV({ ...v, priceMax: n ?? 0 })}
            aria-label={`${priceLabel} maximum`}
          />
        </Field>
        <Field label="Estimated additional hours" hint={v.model === 'hourly' ? 'Multiplied by the hourly rate in quotes.' : undefined}>
          <NumberInput value={v.hours} suffix="h" onChange={(n) => setV({ ...v, hours: n ?? 0 })} aria-label="Estimated additional hours" />
        </Field>
        <div />
        <Field label="Notes" className="sm:col-span-2">
          <TextArea rows={2} value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} />
        </Field>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Hourly rate                                                         */
/* ------------------------------------------------------------------ */

export function RateFormModal({ rate, onSave, onClose }: { rate?: HourlyRate; onSave: (r: HourlyRate) => void; onClose: () => void }) {
  const [v, setV] = useState<HourlyRate>(() => rate ?? { id: uid('rate'), name: '', kind: 'hourly', rate: null, notes: '' });
  const [submitted, setSubmitted] = useState(false);
  const errName = submitted && !v.name.trim() ? 'Give the rate a name.' : undefined;
  const errRate = submitted && v.kind === 'hourly' && v.rate != null && v.rate < 0 ? 'Enter 0 or more.' : undefined;
  return (
    <Modal
      size="sm"
      title={rate ? 'Edit rate' : 'Add rate or service'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="rate-form">
            Save
          </Button>
        </>
      }
    >
      <form
        id="rate-form"
        noValidate
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (!v.name.trim() || (v.kind === 'hourly' && v.rate != null && v.rate < 0)) return;
          onSave({ ...v, name: v.name.trim(), rate: v.kind === 'quote' ? null : v.rate });
        }}
      >
        <Field label="Name" required error={errName}>
          <TextInput autoFocus value={v.name} invalid={!!errName} onChange={(e) => setV({ ...v, name: e.target.value })} />
        </Field>
        <Field label="Charged as">
          <Select value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value as HourlyRate['kind'] })}>
            <option value="hourly">Hourly rate</option>
            <option value="quote">Fixed quote, based on scope</option>
          </Select>
        </Field>
        {v.kind === 'hourly' && (
          <Field label="Hourly rate" error={errRate} hint="Leave empty if not configured yet.">
            <NumberInput value={v.rate} suffix="€/h" invalid={!!errRate} onChange={(n) => setV({ ...v, rate: n })} aria-label="Hourly rate" />
          </Field>
        )}
        <Field label="Notes">
          <TextArea rows={2} value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} />
        </Field>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Maintenance package                                                 */
/* ------------------------------------------------------------------ */

export function PackageFormModal({ pkg, onSave, onClose }: { pkg?: MaintenancePackage; onSave: (p: MaintenancePackage) => void; onClose: () => void }) {
  const [v, setV] = useState<MaintenancePackage>(
    () =>
      pkg ?? {
        id: uid('maint'),
        name: '',
        priceMin: 0,
        priceMax: 0,
        supportHours: 0,
        updatesBackups: '',
        securityChecks: '',
        contentChanges: '',
        response: '',
        exclusions: '',
        extraHourlyRate: null,
        updatedAt: new Date().toISOString(),
      },
  );
  const [submitted, setSubmitted] = useState(false);
  const errName = submitted && !v.name.trim() ? 'Give the package a name.' : undefined;
  const errPrice = submitted && v.priceMax < v.priceMin ? 'The maximum must be at least the minimum.' : undefined;

  return (
    <Modal
      size="lg"
      title={pkg ? 'Edit maintenance package' : 'New maintenance package'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="package-form">
            Save
          </Button>
        </>
      }
    >
      <form
        id="package-form"
        noValidate
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (!v.name.trim() || v.priceMax < v.priceMin) return;
          onSave({ ...v, name: v.name.trim() });
        }}
      >
        <Field label="Package name" required error={errName} className="sm:col-span-2">
          <TextInput autoFocus value={v.name} invalid={!!errName} onChange={(e) => setV({ ...v, name: e.target.value })} />
        </Field>
        <Field label="Monthly price — from">
          <NumberInput
            value={v.priceMin}
            suffix="€/mo"
            onChange={(n) => {
              const min = n ?? 0;
              setV({ ...v, priceMin: min, priceMax: v.priceMax < min || v.priceMax === v.priceMin ? min : v.priceMax });
            }}
            aria-label="Monthly price minimum"
          />
        </Field>
        <Field label="Monthly price — up to" error={errPrice}>
          <NumberInput value={v.priceMax} suffix="€/mo" invalid={!!errPrice} onChange={(n) => setV({ ...v, priceMax: n ?? 0 })} aria-label="Monthly price maximum" />
        </Field>
        <Field label="Included support hours / month">
          <NumberInput value={v.supportHours} suffix="h" onChange={(n) => setV({ ...v, supportHours: n ?? 0 })} aria-label="Included support hours" />
        </Field>
        <Field label="Additional hourly rate">
          <NumberInput value={v.extraHourlyRate} suffix="€/h" onChange={(n) => setV({ ...v, extraHourlyRate: n })} aria-label="Additional hourly rate" />
        </Field>
        <Field label="Updates and backups" hint="Leave empty if not included.">
          <TextArea rows={2} value={v.updatesBackups} onChange={(e) => setV({ ...v, updatesBackups: e.target.value })} />
        </Field>
        <Field label="Security checks" hint="Leave empty if not included.">
          <TextArea rows={2} value={v.securityChecks} onChange={(e) => setV({ ...v, securityChecks: e.target.value })} />
        </Field>
        <Field label="Content changes" hint="Leave empty if not included.">
          <TextArea rows={2} value={v.contentChanges} onChange={(e) => setV({ ...v, contentChanges: e.target.value })} />
        </Field>
        <Field label="Response expectations">
          <TextArea rows={2} value={v.response} onChange={(e) => setV({ ...v, response: e.target.value })} />
        </Field>
        <Field label="Exclusions" className="sm:col-span-2">
          <TextArea rows={2} value={v.exclusions} onChange={(e) => setV({ ...v, exclusions: e.target.value })} />
        </Field>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Category                                                            */
/* ------------------------------------------------------------------ */

export function CategoryFormModal({ category, existing, onSave, onClose }: { category?: Category; existing: Category[]; onSave: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState(category?.name ?? '');
  const [submitted, setSubmitted] = useState(false);
  const trimmed = name.trim();
  const duplicate = existing.some((c) => c.id !== category?.id && c.name.toLowerCase() === trimmed.toLowerCase());
  const err = !submitted ? undefined : !trimmed ? 'Give the category a name.' : duplicate ? 'A category with this name already exists.' : trimmed.length > 60 ? 'Keep it under 60 characters.' : undefined;
  return (
    <Modal
      size="sm"
      title={category ? 'Rename category' : 'New category'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="category-form">
            Save
          </Button>
        </>
      }
    >
      <form
        id="category-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (!trimmed || duplicate || trimmed.length > 60) return;
          onSave(trimmed);
        }}
      >
        <Field label="Category name" required error={err}>
          <TextInput autoFocus value={name} invalid={!!err} onChange={(e) => setName(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
