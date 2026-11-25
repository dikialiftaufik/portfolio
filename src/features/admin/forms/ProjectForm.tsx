import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import type { Project, Values } from '@/shared/lib/store';
import { OptimizedImage } from '@/shared/ui/OptimizedImage';
import { describeFile, imageFileError } from '../upload';
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
  labelCls,
  orderError,
  previewCls,
  toPosition,
  type FormErrors,
  type FormProps,
} from './shared';

type Props = FormProps<Values<'projects'>> & { initial: Partial<Project> };

export function ProjectForm({ initial, busy, serverError, onSubmit, onCancel }: Props) {
  const [v, setV] = useState({
    title: initial.title ?? '',
    tagline: initial.tagline ?? '',
    description: initial.description ?? '',
    tech: (initial.tech ?? []).join(', '),
    image: initial.image ?? '',
    githubLink: initial.githubLink ?? '',
    sort_order: String(initial.sort_order ?? 0),
    mode: 'url' as 'url' | 'upload',
    file: null as File | null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) =>
    setV((s) => ({ ...s, [k]: e.target.value }));
  const fileRef = useRef<HTMLInputElement>(null);
  const savedImage = initial.image ?? '';
  const shownImage = v.mode === 'url' ? v.image : savedImage;

  const setMode = (mode: 'url' | 'upload') => {
    setV((s) => ({ ...s, mode }));
    setErrors((s) => ({ ...s, image: undefined }));
  };
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
    const image = v.image.trim();
    if (title.length < 3 || title.length > 80)
      errs.title = 'Keep the title between 3 and 80 characters.';
    if (v.description.trim().length > 500)
      errs.description = 'Keep the description under 500 characters.';
    if (
      v.tech
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean).length < 1
    )
      errs.tech = 'Add at least one technology.';
    errs.sort_order = orderError(v.sort_order);
    if (v.mode === 'url' && !/^https?:\/\//.test(image) && !/^assets\//.test(image)) {
      errs.image = 'Paste an https URL or pick Upload.';
    }
    if (v.mode === 'upload' && !v.file && !savedImage) errs.image = 'Choose a file first.';
    if (v.githubLink.trim() && !/^https?:\/\//.test(v.githubLink.trim())) {
      errs.githubLink = 'Use a full https URL or leave it empty.';
    }
    setErrors(errs);
    if (focusFirstError('pf', errs)) return;
    onSubmit(
      {
        title,
        tagline: v.tagline.trim(),
        description: v.description.trim(),
        tech: v.tech
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        image: v.mode === 'url' ? image : savedImage,
        githubLink: v.githubLink.trim() || null,
        sort_order: toPosition(v.sort_order),
      },
      v.mode === 'upload' ? { file: v.file } : null,
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
      <h3 className="font-heading font-bold text-white">
        {initial.id ? 'Edit project' : 'Add project'}
      </h3>
      <ServerError message={serverError} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="pf-title" label="TITLE" error={errors.title}>
          <input
            id="pf-title"
            value={v.title}
            onChange={set('title')}
            className={fieldCls(errors.title)}
            placeholder="My project"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'pf-title-error' : undefined}
          />
        </Field>
        <Field id="pf-tagline" label="TAGLINE">
          <input
            id="pf-tagline"
            value={v.tagline}
            onChange={set('tagline')}
            className={fieldCls()}
            placeholder="One-line pitch"
          />
        </Field>
      </div>
      <Field
        id="pf-description"
        label={`DESCRIPTION (${v.description.trim().length}/500)`}
        error={errors.description}
      >
        <textarea
          id="pf-description"
          rows={3}
          value={v.description}
          onChange={set('description')}
          className={fieldCls(errors.description)}
          aria-invalid={!!errors.description}
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="pf-tech" label="TECH (comma-separated)" error={errors.tech}>
          <input
            id="pf-tech"
            value={v.tech}
            onChange={set('tech')}
            className={fieldCls(errors.tech)}
            placeholder="React, Tailwind"
            aria-invalid={!!errors.tech}
          />
        </Field>
        <Field id="pf-sort_order" label="ORDER" error={errors.sort_order}>
          <input
            id="pf-sort_order"
            type="number"
            value={v.sort_order}
            onChange={set('sort_order')}
            className={fieldCls(errors.sort_order)}
            aria-invalid={!!errors.sort_order}
            aria-describedby={
              errors.sort_order ? 'pf-sort_order-hint pf-sort_order-error' : 'pf-sort_order-hint'
            }
          />
          <p id="pf-sort_order-hint" className={hintCls}>
            {ORDER_HINT}
          </p>
        </Field>
      </div>
      <fieldset className="space-y-2">
        <legend className={labelCls}>IMAGE</legend>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="pf-mode"
              checked={v.mode === 'url'}
              onChange={() => setMode('url')}
            />{' '}
            URL
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="pf-mode"
              checked={v.mode === 'upload'}
              onChange={() => setMode('upload')}
            />{' '}
            Upload (resized automatically)
          </label>
        </div>
        {v.mode === 'url' ? (
          <Field id="pf-image" label="IMAGE URL" error={errors.image}>
            <input
              id="pf-image"
              value={v.image}
              onChange={set('image')}
              className={fieldCls(errors.image)}
              placeholder="https://…"
              aria-invalid={!!errors.image}
            />
          </Field>
        ) : (
          <Field id="pf-image" label="FILE (PNG, JPG, WebP, up to 10 MB)" error={errors.image}>
            <input
              ref={fileRef}
              id="pf-image"
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={pickFile}
              className="w-full text-sm text-neutral-300"
              aria-invalid={!!errors.image}
              aria-describedby={errors.image ? 'pf-image-error' : undefined}
            />
            <p className={hintCls}>
              {v.file
                ? describeFile(v.file)
                : savedImage
                  ? 'No file chosen. Current image kept.'
                  : 'No file chosen.'}
            </p>
          </Field>
        )}
        {v.mode === 'upload' && v.file ? (
          <ImagePreview file={v.file} className={previewCls} onError={rejectPreview} />
        ) : shownImage ? (
          <OptimizedImage src={shownImage} alt="Preview" className={previewCls} />
        ) : null}
      </fieldset>
      <Field id="pf-githubLink" label="GITHUB (optional)" error={errors.githubLink}>
        <input
          id="pf-githubLink"
          value={v.githubLink}
          onChange={set('githubLink')}
          className={fieldCls(errors.githubLink)}
          placeholder="https://github.com/…"
          aria-invalid={!!errors.githubLink}
        />
      </Field>
      <FormActions busy={busy} submitLabel="Save project" onCancel={onCancel} />
    </form>
  );
}
