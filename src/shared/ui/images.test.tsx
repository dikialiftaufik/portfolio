import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OptimizedImage, resolveSrc, webpSibling } from './OptimizedImage';
import { TechIcon, techIconUrl } from './TechIcon';

describe('OptimizedImage helpers', () => {
  it('derives a webp sibling only for legacy assets/ png/jpg paths', () => {
    expect(webpSibling('assets/images/projects/a.png')).toBe('/assets/images/projects/a.webp');
    expect(webpSibling('assets/images/certs/b.JPG')).toBe('/assets/images/certs/b.webp');
    expect(
      webpSibling('https://x.supabase.co/storage/v1/object/public/portfolio-media/a.png'),
    ).toBeNull();
    expect(webpSibling('assets/images/a.webp')).toBeNull();
  });

  it('makes legacy paths root-relative and leaves URLs alone', () => {
    expect(resolveSrc('assets/a.png')).toBe('/assets/a.png');
    expect(resolveSrc('https://x/y.png')).toBe('https://x/y.png');
  });

  it('renders <picture> with a webp source for legacy images', () => {
    const { container } = render(<OptimizedImage src="assets/images/projects/a.png" alt="A" />);
    expect(container.querySelector('source')).toHaveAttribute(
      'srcset',
      '/assets/images/projects/a.webp',
    );
    expect(screen.getByAltText('A')).toHaveAttribute('src', '/assets/images/projects/a.png');
  });

  it('renders a plain img for external URLs', () => {
    const { container } = render(<OptimizedImage src="https://x/y.png" alt="Y" />);
    expect(container.querySelector('picture')).toBeNull();
    expect(screen.getByAltText('Y')).toHaveAttribute('loading', 'lazy');
  });
});

describe('TechIcon', () => {
  it('maps a devicon class to its synced svg', () => {
    expect(techIconUrl('devicon-react-original')).toBe('/tech/react.svg');
    expect(techIconUrl('devicon-googlecolab-plain')).toBe('/tech/googlecolab.svg');
    expect(techIconUrl('fa-solid fa-code')).toBeNull();
  });

  it('falls back to a generic icon for unknown classes', () => {
    const { container } = render(<TechIcon icon="not-a-devicon" />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
