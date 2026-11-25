import { X } from 'lucide-react';
import type { Certificate } from '@/shared/lib/store';
import { Modal } from '@/shared/ui/Modal';
import { OptimizedImage } from '@/shared/ui/OptimizedImage';

interface Props {
  open: boolean;
  cert: Certificate | null;
  onClose: () => void;
}

export function CertModal({ open, cert, onClose }: Props) {
  if (!cert) return null;
  return (
    <Modal open={open} label={cert.title} onClose={onClose}>
      <div className="relative mx-auto flex max-h-[90vh] w-full max-w-4xl animate-fade-up flex-col rounded-lg border border-white/10 bg-neutral-900 p-2 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div>
            <h3 className="text-xl font-bold text-white">{cert.title}</h3>
            <p className="font-mono text-sm text-cyan-400">{cert.issuer}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close certificate view"
            className="text-neutral-400 hover:text-white"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center overflow-hidden bg-black p-4">
          <OptimizedImage
            src={cert.image}
            alt={cert.title}
            className="max-h-[70vh] max-w-full rounded object-contain"
          />
        </div>
      </div>
    </Modal>
  );
}
