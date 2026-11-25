import { PortfolioStore, StoreError } from '@/shared/lib/store';

const BUCKET = 'portfolio-media';
/** Hard cap enforced by the bucket (see migration 0002). */
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
/** What the admin may pick; it is shrunk before upload. */
export const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const MAX_EDGE_PX = 1600;
const ALLOWED_IMAGE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
};

export function normalizeFileName(name: string): string {
  return String(name ?? '')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function validation(message: string) {
  return new StoreError('validation', message);
}

export function validateImageFile(file: Pick<File, 'type' | 'size' | 'name'>): string {
  const ext = ALLOWED_IMAGE[file.type];
  if (!ext) throw validation('Use a PNG, JPG, or WebP image.');
  if (file.size > MAX_INPUT_BYTES) {
    throw validation('Image is too large. Choose a file under 10 MB or paste a URL.');
  }
  const base = normalizeFileName(file.name);
  if (!base) throw validation('Rename the file with letters or numbers first.');
  return base;
}

/** Downscale + re-encode as WebP in the browser. Falls back to the original file. */
export async function compressImage(file: File): Promise<File> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.82),
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[a-z0-9]+$/i, '') + '.webp', {
      type: 'image/webp',
    });
  } catch {
    return file;
  }
}

const shortId = () =>
  (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2))
    .replace(/-/g, '')
    .slice(0, 8);

/**
 * Uploads to Storage and returns the public URL. File names carry a random
 * suffix and upsert is off, so an upload can never silently overwrite another file.
 */
export async function uploadImage(file: File, folder: 'projects' | 'certs'): Promise<string> {
  validateImageFile(file);
  const prepared = await compressImage(file);
  if (prepared.size > MAX_UPLOAD_BYTES) {
    throw validation(
      'Image is still over 2 MB after compression. Choose a smaller file or paste a URL.',
    );
  }
  const ext = ALLOWED_IMAGE[prepared.type] ?? 'webp';
  const base = normalizeFileName(file.name);
  const sb = await PortfolioStore.client();
  if (!sb)
    throw new StoreError('not-configured', "Backend isn't configured. Connect Supabase first.");
  const path = `${folder}/${base}-${shortId()}.${ext}`;
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(path, prepared, { upsert: false, contentType: prepared.type });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Best-effort cleanup of a replaced Storage file; never throws. */
export async function removeOldFile(url: string | null | undefined): Promise<void> {
  try {
    if (!url || !url.includes(`${BUCKET}/`)) return;
    const path = url.split(`${BUCKET}/`)[1];
    const sb = await PortfolioStore.client();
    if (sb && path) await sb.storage.from(BUCKET).remove([path]);
  } catch {
    /* best-effort: don't crash the save */
  }
}

export function monthLabel(monthValue: string): string {
  const [y, m] = String(monthValue ?? '')
    .split('-')
    .map(Number);
  if (!y || !m) return '';
  try {
    return new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}
