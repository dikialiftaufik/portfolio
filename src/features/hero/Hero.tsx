import { useEffect, useRef } from 'react';
import { ChevronsDown } from 'lucide-react';
import type { Translation } from '@/shared/lib/locale';
import { usePrefersReducedMotion } from '@/shared/lib/useReducedMotion';
import { startParticleField } from './particle-field';
import { useTypewriter } from './useTypewriter';

const ROLES = ['Junior Web Developer', 'Tech Enthusiast', 'Creative Problem Solver'] as const;

const scrollToId = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

export function Hero({ t }: { t: Translation }) {
  const reduced = usePrefersReducedMotion();
  const text = useTypewriter(ROLES, reduced);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startParticleField(canvas, { reducedMotion: reduced });
  }, [reduced]);

  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 z-0 bg-void">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 block h-full w-full"
        />
        <div className="perspective-grid pointer-events-none absolute bottom-0 left-0 h-[30vh] w-full opacity-30" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050b14_100%)] opacity-80" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl animate-fade-up space-y-8 px-6 text-center">
        <div className="mb-2 inline-block">
          <span className="rounded-full border border-cyan-500/30 bg-cyan-900/10 px-4 py-1.5 font-mono text-sm tracking-widest text-cyan-400 uppercase shadow-neon">
            {t.hero.greeting}
          </span>
        </div>
        <h1 className="font-heading text-6xl leading-tight font-bold tracking-tighter text-white drop-shadow-2xl md:text-8xl">
          {t.hero.im}
          <span className="animate-pulse bg-linear-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
            Diki Alif Taufik
          </span>
        </h1>
        <div className="typing-line flex h-12 items-center justify-center font-mono text-2xl text-cyan-400 md:text-3xl">
          <span className="sr-only">{ROLES.join(', ')}</span>
          <span className="mr-3 opacity-60" aria-hidden="true">
            {'>'}
          </span>
          <span aria-hidden="true" className="border-r-2 border-cyan-400 pr-1 font-bold">
            {text}
          </span>
        </div>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-neutral-300 drop-shadow-md md:text-xl">
          {t.hero.subPitch}
        </p>
        <div className="flex flex-col justify-center gap-6 pt-8 sm:flex-row">
          <button
            type="button"
            onClick={() => scrollToId('showcase')}
            className="rounded-xs bg-cyan-400 px-10 py-4 font-bold tracking-wide text-void transition-all hover:-translate-y-1 hover:bg-cyan-300 hover:shadow-neon"
          >
            {t.hero.btnPrimary}
          </button>
          <button
            type="button"
            onClick={() => scrollToId('contact')}
            className="rounded-xs border border-white/20 bg-transparent px-10 py-4 font-bold tracking-wide text-white backdrop-blur-sm transition-all hover:border-cyan-400 hover:bg-white/5 hover:text-cyan-400"
          >
            {t.hero.btnSecondary}
          </button>
        </div>
      </div>
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/60"
        aria-hidden="true"
      >
        <ChevronsDown size={24} />
      </div>
    </section>
  );
}
