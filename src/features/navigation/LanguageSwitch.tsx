import type { Lang } from '@/shared/lib/locale';
import { FlagID, FlagUK } from '@/shared/ui/flags';

interface Props {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const OPTIONS: { lang: Lang; label: string }[] = [
  { lang: 'en', label: 'English' },
  { lang: 'id', label: 'Bahasa Indonesia' },
];

export function LanguageSwitch({ lang, setLang }: Props) {
  return (
    <div role="group" aria-label="Language" className="flex gap-2">
      {OPTIONS.map((o) => (
        <button
          key={o.lang}
          type="button"
          onClick={() => setLang(o.lang)}
          aria-pressed={lang === o.lang}
          aria-label={o.label}
          title={o.label}
          className={`flag-btn p-1 ${lang === o.lang ? 'active' : ''}`}
        >
          {o.lang === 'en' ? (
            <FlagUK className="h-4 w-6 rounded-[2px]" />
          ) : (
            <FlagID className="h-4 w-6 rounded-[2px]" />
          )}
        </button>
      ))}
    </div>
  );
}
