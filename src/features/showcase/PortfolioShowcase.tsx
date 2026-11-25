import { useRef, useState, type KeyboardEvent } from 'react';
import { Award, Cpu, FolderOpen, Plus, type LucideIcon } from 'lucide-react';
import type { Translation } from '@/shared/lib/locale';
import type { Certificate } from '@/shared/lib/store';
import { CertCard, ProjectCard, TechGrid } from './cards';
import { CertModal } from './CertModal';
import { useShowcaseData, type ShowcaseStore } from './useShowcaseData';

type TabId = 'projects' | 'certificates' | 'stack';
const TAB_IDS: TabId[] = ['projects', 'certificates', 'stack'];
const TAB_ICONS: Record<TabId, LucideIcon> = {
  projects: FolderOpen,
  certificates: Award,
  stack: Cpu,
};

const EMPTY_CLS = 'text-center font-mono text-neutral-400';

export function PortfolioShowcase({ t, store }: { t: Translation; store?: ShowcaseStore }) {
  const [activeTab, setActiveTab] = useState<TabId>('projects');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const { projects, certificates, tech, status, source, reload } = useShowcaseData(store);
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    projects: null,
    certificates: null,
    stack: null,
  });

  const initialLoad =
    status === 'loading' && projects.length === 0 && certificates.length === 0 && tech.length === 0;

  // WAI-ARIA tabs: arrows move + activate, Home/End jump, roving tabindex.
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = TAB_IDS.length - 1;
    const targets: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    const next = targets[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const id = TAB_IDS[next]!;
    setActiveTab(id);
    tabRefs.current[id]?.focus();
  };

  const body = () => {
    if (initialLoad) {
      return (
        <div role="status" className="grid animate-pulse gap-8 md:grid-cols-3">
          <p className="text-center font-mono text-sm text-neutral-400 md:col-span-3">
            Loading projects…
          </p>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 rounded-2xl border border-white/10 bg-white/5" />
          ))}
        </div>
      );
    }
    if (activeTab === 'projects') {
      if (projects.length === 0)
        return <p className={EMPTY_CLS}>No projects yet. Check back soon.</p>;
      return (
        <div className="grid animate-fade-up gap-8 md:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      );
    }
    if (activeTab === 'certificates') {
      return (
        <div className="grid animate-fade-up gap-8 md:grid-cols-2 lg:grid-cols-4">
          {certificates.length === 0 ? (
            <p className={`${EMPTY_CLS} md:col-span-2 lg:col-span-4`}>
              No certificates yet. Check back soon.
            </p>
          ) : (
            certificates.map((c) => <CertCard key={c.id} cert={c} onOpen={setSelectedCert} />)
          )}
          <div className="group flex aspect-[4/3] cursor-default flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-center transition-colors hover:border-cyan-400/50">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-900/20 transition-transform group-hover:scale-110">
              <Plus className="text-cyan-400" aria-hidden="true" />
            </div>
            <h4 className="font-heading text-lg font-bold text-white transition-colors group-hover:text-cyan-400">
              {t.portfolio.more}
            </h4>
            <p className="mt-2 font-mono text-xs text-neutral-400">{t.portfolio.moreSub}</p>
          </div>
        </div>
      );
    }
    if (tech.length === 0) return <p className={EMPTY_CLS}>No tech stack yet. Check back soon.</p>;
    return <TechGrid items={tech} />;
  };

  return (
    <section id="showcase" className="relative z-10 py-24">
      <CertModal
        open={selectedCert !== null}
        cert={selectedCert}
        onClose={() => setSelectedCert(null)}
      />
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-heading text-5xl font-bold text-white drop-shadow-lg">
            {t.portfolio.title}
          </h2>
          <p className="mx-auto max-w-2xl text-neutral-400">{t.portfolio.subtitle}</p>
        </div>

        {source === 'seed' && status === 'ready' ? (
          <p className="mb-8 text-center font-mono text-xs text-neutral-400">
            Showing cached content…{' '}
            <button
              type="button"
              onClick={() => void reload()}
              className="text-cyan-400 hover:underline"
            >
              Try again
            </button>
          </p>
        ) : null}
        {status === 'error' ? (
          <p role="alert" className="mb-8 text-center font-mono text-sm text-red-300">
            Couldn&apos;t load the showcase. Check your connection and try again.{' '}
            <button
              type="button"
              onClick={() => void reload()}
              className="text-cyan-400 hover:underline"
            >
              Try again
            </button>
          </p>
        ) : null}

        <div className="mb-16 flex justify-center">
          <div
            role="tablist"
            aria-label="Showcase sections"
            className="tab-bar flex rounded-2xl border border-white/10 bg-white/5 p-1.5 shadow-xl backdrop-blur-md"
          >
            {TAB_IDS.map((id, idx) => {
              const Icon = TAB_ICONS[id];
              const selected = activeTab === id;
              return (
                <button
                  key={id}
                  ref={(el) => {
                    tabRefs.current[id] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(id)}
                  onKeyDown={(e) => onTabKey(e, idx)}
                  className={`flex items-center gap-3 rounded-xl px-8 py-4 font-mono text-sm transition-all duration-300 ${
                    selected
                      ? 'border border-cyan-500/30 bg-linear-to-r from-cyan-900/50 to-blue-900/50 font-bold text-cyan-400 shadow-neon'
                      : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={18} aria-hidden="true" /> {t.portfolio.tabs[idx]}
                </button>
              );
            })}
          </div>
        </div>

        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          tabIndex={0}
          className="min-h-[400px] outline-hidden"
        >
          {body()}
        </div>
      </div>
    </section>
  );
}
