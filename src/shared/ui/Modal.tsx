import { useEffect, useRef, type ReactNode, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  open: boolean;
  label: string;
  onClose: () => void;
  /** Block Escape / backdrop dismissal while an action is running. */
  locked?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  backdropClassName?: string;
  children: ReactNode;
}

// Accessible modal: role=dialog, Escape to close, focus trapped while open,
// focus restored to the trigger on close.
export function Modal({
  open,
  label,
  onClose,
  locked = false,
  initialFocusRef,
  backdropClassName = 'bg-black/90 backdrop-blur-md',
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const lockedRef = useRef(locked);
  // Keep the latest callbacks reachable from the key handler without re-subscribing it.
  useEffect(() => {
    onCloseRef.current = onClose;
    lockedRef.current = locked;
  });

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () =>
      panel ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];

    (initialFocusRef?.current ?? focusables()[0] ?? panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!lockedRef.current) onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panel?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel?.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, initialFocusRef]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        className={`absolute inset-0 ${backdropClassName}`}
        onClick={() => {
          if (!locked) onClose();
        }}
      />
      <div ref={panelRef} tabIndex={-1} className="relative w-full outline-hidden">
        {children}
      </div>
    </div>
  );
}
