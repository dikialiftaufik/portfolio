import type { ImgHTMLAttributes } from 'react';

const LEGACY_RE = /^assets\/.+\.(png|jpe?g)$/i;

/** assets/x/y.png -> /assets/x/y.webp (written by scripts/optimize-images.mjs). */
export function webpSibling(src: string): string | null {
  return LEGACY_RE.test(src) ? `/${src.replace(/\.(png|jpe?g)$/i, '.webp')}` : null;
}

/** Legacy seed paths are root-relative so they work on any route. */
export function resolveSrc(src: string): string {
  return src.startsWith('assets/') ? `/${src}` : src;
}

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src: string; alt: string };

// Legacy `assets/` images ship a WebP sibling; everything else (Storage / external URL)
// is rendered as-is. Callers pass width/height so the layout never shifts.
export function OptimizedImage({ src, alt, ...rest }: Props) {
  const webp = webpSibling(src);
  const img = <img src={resolveSrc(src)} alt={alt} loading="lazy" decoding="async" {...rest} />;
  if (!webp) return img;
  return (
    <picture>
      <source srcSet={webp} type="image/webp" />
      {img}
    </picture>
  );
}
