import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { Lang, Translation } from '@/shared/lib/locale';
import { LanguageSwitch } from './LanguageSwitch';
import { useCvUrl } from './useCvUrl';

const SECTION_IDS = ['home', 'about', 'showcase', 'contact'] as const;
const CV_LINK_CLS =
  'rounded-xs bg-cyan-400 px-5 py-2 font-heading text-sm font-bold text-void transition-colors hover:bg-cyan-500 hover:shadow-neon';

interface Props {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translation;
}

export function Navbar({ lang, setLang, t }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const cvUrl = useCvUrl();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  return (
    <nav
      aria-label="Primary"
      className={`fixed z-50 w-full border-b transition-all duration-300 ${
        scrolled
          ? 'border-white/10 bg-void/90 py-3 backdrop-blur-md'
          : 'border-transparent bg-transparent py-6'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <button
          type="button"
          onClick={() => scrollTo('home')}
          aria-label="DAT. Back to top"
          className="font-heading text-2xl font-bold tracking-tighter"
        >
          DAT<span className="text-cyan-400">.</span>
        </button>

        <div className="hidden items-center gap-8 font-mono text-sm md:flex">
          {t.nav.map((item, idx) => (
            <button
              key={item}
              type="button"
              onClick={() => scrollTo(SECTION_IDS[idx] ?? 'home')}
              className="group relative transition-colors hover:text-cyan-400"
            >
              {item}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-cyan-400 transition-all group-hover:w-full" />
            </button>
          ))}
        </div>

        <div className="hidden items-center gap-6 md:flex">
          <div className="rounded-md border border-white/5 bg-white/5 p-1.5">
            <LanguageSwitch lang={lang} setLang={setLang} />
          </div>
          <a href={cvUrl} target="_blank" rel="noopener noreferrer" className={CV_LINK_CLS}>
            Download CV
          </a>
        </div>

        <button
          type="button"
          className="text-white md:hidden"
          aria-label="Menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          id="mobile-menu"
          data-testid="mobile-menu"
          className="flex flex-col gap-4 border-t border-white/10 bg-void/95 px-6 py-4 font-mono text-sm backdrop-blur-md md:hidden"
        >
          {t.nav.map((item, idx) => (
            <button
              key={item}
              type="button"
              onClick={() => scrollTo(SECTION_IDS[idx] ?? 'home')}
              className="py-2 text-left transition-colors hover:text-cyan-400"
            >
              {item}
            </button>
          ))}
          <div className="pt-2">
            <LanguageSwitch lang={lang} setLang={setLang} />
          </div>
          <a
            href={cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileOpen(false)}
            className={`${CV_LINK_CLS} block py-3 text-center`}
          >
            Download CV
          </a>
        </div>
      )}
    </nav>
  );
}
