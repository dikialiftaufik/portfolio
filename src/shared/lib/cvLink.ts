// The one rule for the CV link: used by the admin form, the store and the public button.
// Mirrors the check constraint in migration 0005.

export const CV_URL_MAX = 2048;

const INVALID = 'Paste a full https link, e.g. https://drive.google.com/…';

export type CvUrlResult = { url: string; error?: never } | { url?: never; error: string };

/** Returns the normalized href, or the message to show. */
export function parseCvUrl(raw: string): CvUrlResult {
  const text = raw.trim();
  if (!text || /\s/.test(text)) return { error: INVALID };
  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    return { error: INVALID };
  }
  if (parsed.protocol !== 'https:' || !/[^.]\.[^.]/.test(parsed.hostname)) {
    return { error: INVALID };
  }
  if (parsed.username || parsed.password) return { error: INVALID };
  if (parsed.href.length > CV_URL_MAX) return { error: 'Keep the link under 2048 characters.' };
  return { url: parsed.href };
}
