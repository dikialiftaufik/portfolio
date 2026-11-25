import { useRef } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import type { Certificate, Collection, Message, Project, TechItem } from '@/shared/lib/store';
import { Modal } from '@/shared/ui/Modal';
import { OptimizedImage } from '@/shared/ui/OptimizedImage';
import { TechIcon } from '@/shared/ui/TechIcon';

export type AdminCollection = Exclude<Collection, 'messages'>;
export type ContentRow = Project | Certificate | TechItem;
export type DeletableRow = ContentRow | Message;

export const rowTitle = (row: DeletableRow): string =>
  ('title' in row && row.title) || ('name' in row && row.name) || 'Untitled';

export function rowSub(collection: AdminCollection, row: ContentRow): string {
  if (collection === 'projects') return ((row as Project).tech ?? []).join(', ');
  if (collection === 'certificates') {
    const c = row as Certificate;
    return `${c.issuer ?? ''} · ${c.date ?? ''}`;
  }
  return (row as TechItem).icon ?? '';
}

export const deleteNoun = (collection: Collection): string =>
  collection === 'tech_stack' ? 'tech' : collection.slice(0, -1);

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const btnGhost =
  'rounded border border-white/15 px-3 py-1.5 font-mono text-xs hover:border-cyan-400 hover:text-cyan-400';
const btnDanger =
  'rounded border border-red-500/40 px-3 py-1.5 font-mono text-xs text-red-300 hover:bg-red-500 hover:text-white';

interface RowProps {
  collection: AdminCollection;
  row: ContentRow;
  onEdit: (collection: AdminCollection, row: ContentRow) => void;
  onDelete: (collection: AdminCollection, row: ContentRow) => void;
}

export function Row({ collection, row, onEdit, onDelete }: RowProps) {
  const title = rowTitle(row);
  const image = 'image' in row ? row.image : '';
  return (
    <li className="flex items-center gap-4 rounded border border-white/5 bg-white/5 p-3 hover:border-white/15">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-neutral-800">
        {collection === 'tech_stack' ? (
          <TechIcon icon={(row as TechItem).icon} size={28} />
        ) : image ? (
          <OptimizedImage
            src={image}
            alt=""
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon size={20} className="text-neutral-400" aria-hidden="true" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-white">{title}</span>
        <span className="block truncate font-mono text-xs text-neutral-400">
          {rowSub(collection, row)}
        </span>
      </span>
      <button
        type="button"
        onClick={() => onEdit(collection, row)}
        aria-label={`Edit ${title}`}
        className={btnGhost}
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => onDelete(collection, row)}
        aria-label={`Delete ${title}`}
        className={btnDanger}
      >
        Delete
      </button>
    </li>
  );
}

export interface DeleteTarget {
  collection: Collection;
  row: DeletableRow;
}

interface DeleteDialogProps {
  target: DeleteTarget | null;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteDialog({ target, busy, error, onCancel, onConfirm }: DeleteDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const noun = target ? deleteNoun(target.collection) : '';
  return (
    <Modal
      open={target !== null}
      label={`Delete ${noun}`}
      onClose={onCancel}
      locked={busy}
      initialFocusRef={cancelRef}
      backdropClassName="bg-black/80"
    >
      {target ? (
        <div className="relative mx-auto w-full max-w-md rounded-lg border border-white/10 bg-neutral-900 p-6">
          <h3 className="mb-2 font-heading text-lg font-bold text-white">Delete {noun}?</h3>
          <p className="mb-1 text-sm text-neutral-300">
            “{rowTitle(target.row)}” will be removed everywhere.
          </p>
          <p className="mb-6 font-mono text-xs text-neutral-400">This can&apos;t be undone.</p>
          {error ? (
            <p role="alert" className="mb-4 text-sm text-red-300">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-3">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded border border-white/20 px-4 py-2 text-sm hover:border-white/50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="rounded bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {busy ? 'Deleting…' : `Delete ${noun}`}
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

interface InboxProps {
  items: Message[];
  onMarkRead: (m: Message) => void;
  onDelete: (m: Message) => void;
}

export function InboxSection({ items, onMarkRead, onDelete }: InboxProps) {
  return (
    <section aria-label="Inbox">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="font-heading text-xl font-bold text-white">Inbox</h2>
        <span className="font-mono text-xs text-neutral-400">
          {items.filter((m) => !m.is_read).length} unread
        </span>
      </div>
      {items.length === 0 ? (
        <p className="rounded border border-dashed border-white/10 p-6 text-center font-mono text-sm text-neutral-400">
          No messages yet.
        </p>
      ) : (
        <ul className="admin-rows space-y-2">
          {items.map((m) => (
            <li key={m.id} className="rounded border border-white/5 bg-white/5 p-4">
              <div className="mb-1 flex items-center gap-3">
                {!m.is_read ? (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full bg-cyan-400"
                    role="img"
                    aria-label="Unread"
                  />
                ) : null}
                <span className="truncate text-sm font-bold text-white">{m.name}</span>
                <a
                  href={`mailto:${m.email}`}
                  className="truncate font-mono text-xs text-neutral-300 hover:text-cyan-400"
                >
                  {m.email}
                </a>
                <span className="ml-auto shrink-0 font-mono text-[10px] text-neutral-400">
                  {m.created_at
                    ? new Date(m.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : ''}
                </span>
              </div>
              <p className="mb-3 text-sm whitespace-pre-wrap text-neutral-300">{m.message}</p>
              <div className="flex gap-2">
                {!m.is_read ? (
                  <button
                    type="button"
                    onClick={() => onMarkRead(m)}
                    aria-label={`Mark as read: message from ${m.name}`}
                    className={btnGhost}
                  >
                    Mark as read
                  </button>
                ) : null}
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message to Diki Alif Taufik')}`}
                  className={btnGhost}
                >
                  Reply
                </a>
                <button
                  type="button"
                  onClick={() => onDelete(m)}
                  aria-label={`Delete message from ${m.name}`}
                  className={btnDanger}
                >
                  Delete message
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
