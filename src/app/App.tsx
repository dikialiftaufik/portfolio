import { useEffect, useState } from 'react';
import { Chatbot } from '@/features/chatbot/Chatbot';
import { Contact } from '@/features/contact/Contact';
import { Hero } from '@/features/hero/Hero';
import { Navbar } from '@/features/navigation/Navbar';
import { PortfolioShowcase } from '@/features/showcase/PortfolioShowcase';
import { translations, type Lang } from '@/shared/lib/locale';
import { Footer } from './Footer';

function GlobalBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-void"
    >
      {/* Soft radial gradients read like the old blurred blobs but cost no filter pass. */}
      <div className="absolute top-[-20%] left-[-20%] h-[60vw] w-[60vw] animate-pulse-glow rounded-full bg-[radial-gradient(circle,rgba(88,28,135,0.2)_0%,transparent_65%)]" />
      <div
        className="absolute right-[-10%] bottom-[-10%] h-[50vw] w-[50vw] animate-pulse-glow rounded-full bg-[radial-gradient(circle,rgba(0,48,51,0.3)_0%,transparent_65%)]"
        style={{ animationDelay: '2s' }}
      />
      <div className="film-grain absolute inset-0 opacity-[0.04] mix-blend-overlay" />
    </div>
  );
}

export function App() {
  const [lang, setLang] = useState<Lang>('en');
  const t = translations[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <div className="relative min-h-screen text-titanium">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:bg-cyan-400 focus:px-4 focus:py-2 focus:font-mono focus:text-sm focus:text-void"
      >
        Skip to content
      </a>
      <GlobalBackground />
      <Navbar lang={lang} setLang={setLang} t={t} />
      <main id="main">
        <Hero t={t} />
        <Chatbot t={t} />
        <PortfolioShowcase t={t} />
        <Contact t={t} />
      </main>
      <Footer t={t} />
    </div>
  );
}
