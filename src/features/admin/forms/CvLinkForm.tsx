import { useState, type FormEvent } from 'react';
import { parseCvUrl } from '@/shared/lib/cvLink';
import type { SiteSettings } from '@/shared/lib/store';
import {
  Field,
  FormActions,
  ServerError,
  fieldCls,
  focusFirstError,
  hintCls,
  type FormErrors,
  type FormProps,
} from './shared';

type Props = FormProps<SiteSettings> & { initial: SiteSettings };

export function CvLinkForm({ initial, busy, serverError, onSubmit, onCancel }: Props) {
  const [cvUrl, setCvUrl] = useState(initial.cvUrl);
  const [errors, setErrors] = useState<FormErrors>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const link = parseCvUrl(cvUrl);
    const errs: FormErrors = { cvUrl: link.error };
    setErrors(errs);
    if (focusFirstError('cv', errs) || link.url === undefined) return;
    onSubmit({ cvUrl: link.url }, null);
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
      <h3 className="font-heading font-bold text-white">Edit CV link</h3>
      <ServerError message={serverError} />
      <Field id="cv-cvUrl" label="CV LINK" error={errors.cvUrl}>
        <input
          id="cv-cvUrl"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          value={cvUrl}
          onChange={(e) => setCvUrl(e.target.value)}
          className={fieldCls(errors.cvUrl)}
          placeholder="https://…"
          aria-invalid={!!errors.cvUrl}
          aria-describedby={errors.cvUrl ? 'cv-cvUrl-hint cv-cvUrl-error' : 'cv-cvUrl-hint'}
        />
        <p id="cv-cvUrl-hint" className={hintCls}>
          Opens from the “Download CV” button. Use an https link anyone can view.
        </p>
      </Field>
      <FormActions busy={busy} submitLabel="Save CV link" onCancel={onCancel} />
    </form>
  );
}
