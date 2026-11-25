import { useState } from 'react';
import { Cpu } from 'lucide-react';

// Stored value is a devicon class, e.g. "devicon-react-original". The matching
// SVG is copied from the devicon package into /tech by scripts/sync-tech-icons.mjs,
// so the visitor downloads only the icons actually shown (no icon font).
const CLASS_RE = /^devicon-([a-z0-9]+)-/;

export function techIconUrl(iconClass: string): string | null {
  const match = CLASS_RE.exec(iconClass.trim());
  return match ? `/tech/${match[1]}.svg` : null;
}

interface TechIconProps {
  icon: string;
  size?: number;
  className?: string;
}

export function TechIcon({ icon, size = 48, className }: TechIconProps) {
  const url = techIconUrl(icon);
  const [failed, setFailed] = useState(false);
  if (!url || failed) {
    return <Cpu size={size} className={className} aria-hidden="true" />;
  }
  return (
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
