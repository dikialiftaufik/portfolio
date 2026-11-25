import { useState, type FormEvent } from 'react';
import type { TechItem, Values } from '@/shared/lib/store';
import { TechIcon } from '@/shared/ui/TechIcon';
import {
  Field,
  FormActions,
  ORDER_HINT,
  ServerError,
  fieldCls,
  focusFirstError,
  hintCls,
  orderError,
  toPosition,
  type FormErrors,
  type FormProps,
} from './shared';

type Props = FormProps<Values<'tech_stack'>> & { initial: Partial<TechItem> };

export function TechForm({ initial, busy, serverError, onSubmit, onCancel }: Props) {
  const [v, setV] = useState({
    name: initial.name ?? '',
    icon: initial.icon ?? '',
    sort_order: String(initial.sort_order ?? 0),
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: FormErrors = {};
    if (!v.name.trim()) errs.name = 'Name the technology.';
    if (!/^devicon-[a-z0-9]+-[a-z-]+$/.test(v.icon.trim())) {
      errs.icon = 'Add a devicon class, e.g. devicon-react-original.';
    }
    errs.sort_order = orderError(v.sort_order);
    setErrors(errs);
    if (focusFirstError('tf', errs)) return;
    onSubmit(
      { name: v.name.trim(), icon: v.icon.trim(), sort_order: toPosition(v.sort_order) },
      null,
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
      <h3 className="font-heading font-bold text-white">{initial.id ? 'Edit tech' : 'Add tech'}</h3>
      <ServerError message={serverError} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="tf-name" label="NAME" error={errors.name}>
          <input
            id="tf-name"
            value={v.name}
            onChange={set('name')}
            className={fieldCls(errors.name)}
            placeholder="React"
            aria-invalid={!!errors.name}
          />
        </Field>
        <Field id="tf-icon" label="ICON CLASS" error={errors.icon}>
          <input
            id="tf-icon"
            value={v.icon}
            onChange={set('icon')}
            className={fieldCls(errors.icon)}
            placeholder="devicon-react-original"
            aria-invalid={!!errors.icon}
          />
        </Field>
      </div>
      {v.icon ? (
        <p className="flex items-center gap-3 text-sm text-neutral-300">
          Preview: <TechIcon icon={v.icon} size={32} />
        </p>
      ) : null}
      <Field id="tf-sort_order" label="ORDER" error={errors.sort_order}>
        <input
          id="tf-sort_order"
          type="number"
          value={v.sort_order}
          onChange={set('sort_order')}
          className={fieldCls(errors.sort_order)}
          aria-invalid={!!errors.sort_order}
          aria-describedby={
            errors.sort_order ? 'tf-sort_order-hint tf-sort_order-error' : 'tf-sort_order-hint'
          }
        />
        <p id="tf-sort_order-hint" className={hintCls}>
          {ORDER_HINT}
        </p>
      </Field>
      <FormActions
        busy={busy}
        submitLabel={initial.id ? 'Save tech' : 'Add tech'}
        onCancel={onCancel}
      />
    </form>
  );
}
