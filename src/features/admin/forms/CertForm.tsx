import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import type { Certificate, Values } from '@/shared/lib/store';
import { OptimizedImage } from '@/shared/ui/OptimizedImage';
import { describeFile, imageFileError, monthLabel } from '../upload';
import { ImagePreview } from './ImagePreview';
import {
  Field,
  FormActions,
  ORDER_HINT,
  PREVIEW_ERROR,
  ServerError,
  fieldCls,
  focusFirstError,
  hintCls,
  orderError,
  previewCls,
  toPosition,
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
    sort_order: String(initial.sort_order ?? 0),
    file: null as File | null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) =>
    setV((s) => ({ ...s, [k]: e.target.value }));
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    const image = file ? imageFileError(file) : undefined;
    // Clearing the input lets the same file be picked again after it is fixed.
    if (image) e.target.value = '';
    setV((s) => ({ ...s, file: image ? null : file }));
    setErrors((s) => ({ ...s, image }));
  };
  const rejectPreview = () => {
    if (fileRef.current) fileRef.current.value = '';
    setV((s) => ({ ...s, file: null }));
    setErrors((s) => ({ ...s, image: PREVIEW_ERROR }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: FormErrors = {};
    const title = v.title.trim();
    if (title.length < 3 || title.length > 120)
      errs.title = 'Keep the title between 3 and 120 characters.';
    if (v.issuer.trim().length < 2) errs.issuer = 'Name the issuer.';
    const label = initial.date && !v.month ? initial.date : monthLabel(v.month);
    if (!/^[A-Z][a-z]{2} [0-9]{4}$/.test(label)) errs.month = 'Pick a month.';
    errs.sort_order = orderError(v.sort_order);
    if (!v.file && !v.image) errs.image = 'Choose a file or keep the current image.';
    setErrors(errs);
    if (focusFirstError('cf', errs)) return;
    onSubmit(
      {
        title,
        issuer: v.issuer.trim(),
        date: label,
        image: v.image,
        sort_order: toPosition(v.sort_order),
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
        <Field id="cf-sort_order" label="ORDER" error={errors.sort_order}>
          <input
            id="cf-sort_order"
            type="number"
            value={v.sort_order}
            onChange={set('sort_order')}
            className={fieldCls(errors.sort_order)}
            aria-invalid={!!errors.sort_order}
            aria-describedby={
              errors.sort_order ? 'cf-sort_order-hint cf-sort_order-error' : 'cf-sort_order-hint'
            }
          />
          <p id="cf-sort_order-hint" className={hintCls}>
            {ORDER_HINT}
          </p>
        </Field>
      </div>
      <div className="space-y-2">
        <Field id="cf-image" label="FILE (PNG, JPG, WebP, up to 10 MB)" error={errors.image}>
          <input
            ref={fileRef}
            id="cf-image"
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            onChange={pickFile}
            className="w-full text-sm text-neutral-300"
            aria-invalid={!!errors.image}
            aria-describedby={errors.image ? 'cf-image-error' : undefined}
          />
          <p className={hintCls}>
            {v.file
              ? describeFile(v.file)
              : v.image
                ? 'No file chosen. Current image kept.'
                : 'No file chosen.'}
          </p>
        </Field>
        {v.file ? (
          <ImagePreview file={v.file} className={previewCls} onError={rejectPreview} />
        ) : v.image ? (
          <OptimizedImage src={v.image} alt="Preview" className={previewCls} />
        ) : null}
      </div>
      <FormActions busy={busy} submitLabel="Save certificate" onCancel={onCancel} />
    </form>
  );
}
