import type { ReactNode } from 'react';

export const fieldCls = (bad?: string) =>
  `w-full rounded border bg-neutral-900 p-3 text-white ${bad ? 'border-red-400' : 'border-white/10'}`;

export const labelCls = 'font-mono text-xs text-neutral-300';

export type FormErrors = Record<string, string | undefined>;

export interface FormProps<Values> {
  busy: boolean;
  serverError: string | null;
  onCancel: () => void;
  onSubmit: (values: Values, fileInfo: { file: File | null } | null) => void;
}

export function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Focuses the first invalid field so keyboard users land on the problem. */
export function focusFirstError(prefix: string, errs: FormErrors): boolean {
  const first = Object.keys(errs).find((k) => errs[k]);
  if (!first) return false;
  document.getElementById(`${prefix}-${first}`)?.focus();
  return true;
}

export function FormActions({
  busy,
  submitLabel,
  onCancel,
}: {
  busy: boolean;
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={busy}
        className="rounded border border-white/20 px-4 py-2 text-sm disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={busy}
        className="rounded bg-cyan-400 px-4 py-2 text-sm font-bold text-void disabled:opacity-50"
      >
        {busy ? 'Saving…' : submitLabel}
      </button>
    </div>
  );
}

export function ServerError({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className="text-sm text-red-300">
      {message}
    </p>
  ) : null;
}
