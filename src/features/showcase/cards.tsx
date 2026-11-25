import { useState } from 'react';
import { Award, Eye, FolderOpen } from 'lucide-react';
import type { Certificate, Project, TechItem } from '@/shared/lib/store';
import { GithubIcon } from '@/shared/ui/brand-icons';
import { OptimizedImage } from '@/shared/ui/OptimizedImage';
import { TechIcon } from '@/shared/ui/TechIcon';

export function ProjectCard({ project }: { project: Project }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-glass transition-all duration-500 hover:-translate-y-2 hover:border-cyan-400/50 hover:shadow-neon-strong">
      <div className="relative h-52 overflow-hidden">
        <div className="absolute inset-0 z-10 bg-neutral-900/40 transition-all duration-500 group-hover:bg-transparent" />
        {imgOk ? (
          <OptimizedImage
            src={project.image}
            alt={project.title}
            width={640}
            height={416}
            onError={() => setImgOk(false)}
            className="h-full w-full transform object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-neutral-800"
            role="img"
            aria-label={project.title}
          >
            <FolderOpen size={32} className="text-neutral-400" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-8">
        <div className="mb-4">
          <h3 className="mb-1 font-heading text-2xl font-bold text-white transition-colors group-hover:text-cyan-400">
            {project.title}
          </h3>
          <p className="font-mono text-xs tracking-wider text-cyan-400 uppercase">
            {project.tagline}
          </p>
        </div>
        <p className="mb-6 flex-1 text-sm leading-relaxed text-neutral-300">
          {project.description}
        </p>
        <div className="mb-6 flex items-center justify-between">
          <ul className="flex flex-wrap gap-2" aria-label="Technologies">
            {(project.tech ?? []).map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-cyan-500/20 bg-cyan-900/20 px-3 py-1 font-mono text-[10px] font-bold text-cyan-300"
              >
                {tag}
              </li>
            ))}
          </ul>
          {project.githubLink ? (
            <a
              href={project.githubLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${project.title} on GitHub`}
              className="text-neutral-400 transition-colors hover:text-white"
            >
              <GithubIcon size={20} />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function CertCard({
  cert,
  onOpen,
}: {
  cert: Certificate;
  onOpen: (cert: Certificate) => void;
}) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <button
      type="button"
      onClick={() => onOpen(cert)}
      aria-label={`View certificate: ${cert.title}, ${cert.issuer}`}
      className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-neutral-900 text-left transition-all duration-300 hover:border-cyan-400 hover:shadow-neon"
    >
      {imgOk ? (
        <OptimizedImage
          src={cert.image}
          alt=""
          width={640}
          height={480}
          onError={() => setImgOk(false)}
          className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-neutral-800">
          <Award size={32} className="text-neutral-400" aria-hidden="true" />
        </div>
      )}
      <div className="cert-overlay absolute inset-0 flex flex-col justify-end p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
        <div className="translate-y-4 transform transition-transform duration-300 group-hover:translate-y-0 group-focus-visible:translate-y-0">
          <h4 className="mb-1 text-lg leading-tight font-bold text-white">{cert.title}</h4>
          <div className="flex items-center justify-between font-mono text-xs text-cyan-400">
            <span>{cert.issuer}</span>
            <span className="flex items-center gap-1 rounded bg-cyan-900/50 px-2 py-1 text-white">
              <Eye size={12} aria-hidden="true" /> View
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export function TechGrid({ items }: { items: TechItem[] }) {
  return (
    <ul className="grid animate-fade-up grid-cols-3 gap-8 px-4 md:grid-cols-5 lg:grid-cols-6">
      {items.map((tech) => (
        <li
          key={tech.id ?? tech.name}
          className="group flex cursor-default flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-glass p-6 transition-all duration-300 hover:-translate-y-2 hover:border-cyan-400 hover:bg-white/10"
        >
          <TechIcon
            icon={tech.icon}
            size={64}
            className="opacity-80 grayscale transition-all duration-300 group-hover:scale-110 group-hover:opacity-100 group-hover:grayscale-0"
          />
          <span className="font-mono text-xs text-neutral-400 transition-colors group-hover:text-white">
            {tech.name}
          </span>
        </li>
      ))}
    </ul>
  );
}
