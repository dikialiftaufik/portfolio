import type { Translation } from '@/shared/lib/locale';
import { profile } from '@/shared/lib/profile';
import { GithubIcon, InstagramIcon } from '@/shared/ui/brand-icons';

export function Footer({ t }: { t: Translation }) {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-void py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="text-center md:text-left">
          <div className="mb-2 font-heading text-xl font-bold tracking-tighter">
            DAT<span className="text-cyan-400">.</span>
          </div>
          <p className="font-mono text-sm text-neutral-400">{t.footer.quote}</p>
        </div>
        <div className="flex gap-6 text-neutral-400">
          <a
            href={profile.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile"
            className="transition-colors hover:text-cyan-400"
          >
            <GithubIcon />
          </a>
          <a
            href={profile.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram profile"
            className="transition-colors hover:text-cyan-400"
          >
            <InstagramIcon />
          </a>
        </div>
        <div className="text-center font-mono text-xs text-neutral-400 md:text-right">
          <p>
            © {new Date().getFullYear()} {profile.name}.
          </p>
          <p>{t.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}
