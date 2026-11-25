import { useState, type FormEvent } from 'react';
import type { Certificate, Values } from '@/shared/lib/store';
import { monthLabel } from '../upload';
import {
  Field,
  FormActions,
  ServerError,
  fieldCls,
  focusFirstError,
  type FormErrors,
  type FormProps,
} from './shared';

type Props = FormProps<Values<'certificates'>> & { initial: Partial<Certificate> };

export function CertForm({ initial, busy, serverError, onSubmit, onCancel }: Props) {
  const [v, setV] = useState({
    title: initial.title ?? '',
    issuer: initial.issuer ?? '',
    month: '',
    image: initial.image ?? '',
    sort_order: initial.sort_order ?? 0,
    file: null as File | null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: FormErrors = {};
    const title = v.title.trim();
    if (title.length < 3 || title.length > 120)
      errs.title = 'Keep the title between 3 and 120 characters.';
    if (v.issuer.trim().length < 2) errs.issuer = 'Name the issuer.';
    const label = initial.date && !v.month ? initial.date : monthLabel(v.month);
    if (!/^[A-Z][a-z]{2} [0-9]{4}$/.test(label)) errs.month = 'Pick a month.';
    if (!v.file && !v.image) errs.image = 'Choose a file or keep the current image.';
    setErrors(errs);
    if (focusFirstError('cf', errs)) return;
    onSubmit(
      {
        title,
        issuer: v.issuer.trim(),
        date: label,
        image: v.image,
        sort_order: Number(v.sort_order) || 0,
      },
      v.file ? { file: v.file } : null,
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
      <h3 className="font-heading font-bold text-white">
        {initial.id ? 'Edit certificate' : 'Add certificate'}
      </h3>
      <ServerError message={serverError} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="cf-title" label="TITLE" error={errors.title}>
          <input
            id="cf-title"
            value={v.title}
            onChange={set('title')}
            className={fieldCls(errors.title)}
            aria-invalid={!!errors.title}
          />
        </Field>
        <Field id="cf-issuer" label="ISSUER" error={errors.issuer}>
          <input
            id="cf-issuer"
            value={v.issuer}
            onChange={set('issuer')}
            className={fieldCls(errors.issuer)}
            aria-invalid={!!errors.issuer}
          />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          id="cf-month"
          label={`MONTH ${initial.date && !v.month ? `(current: ${initial.date})` : ''}`}
          error={errors.month}
        >
          <input
            id="cf-month"
            type="month"
            value={v.month}
            onChange={set('month')}
            className={fieldCls(errors.month)}
            aria-invalid={!!errors.month}
          />
        </Field>
        <Field id="cf-sort_order" label="ORDER">
          <input
            id="cf-sort_order"
            type="number"
            value={v.sort_order}
            onChange={set('sort_order')}
            className={fieldCls()}
          />
        </Field>
      </div>
      <Field
        id="cf-image"
        label={`FILE (PNG, JPG, WebP, up to 10 MB)${v.image ? ' — current kept unless replaced' : ''}`}
        error={errors.image}
      >
        <input
          id="cf-image"
          type="file"
          accept=".png,.jpg,.jpeg,.webp"
          onChange={(e) => setV((s) => ({ ...s, file: e.target.files?.[0] ?? null }))}
          className="w-full text-sm text-neutral-300"
        />
        <p className="font-mono text-xs text-neutral-400">
          {v.file ? v.file.name : 'No file chosen.'}
        </p>
      </Field>
      <FormActions busy={busy} submitLabel="Save certificate" onCancel={onCancel} />
    </form>
  );
}
