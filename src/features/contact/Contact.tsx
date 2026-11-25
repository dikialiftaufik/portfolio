import { useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Clock, Mail, MapPin } from 'lucide-react';
import type { Translation } from '@/shared/lib/locale';
import { profile } from '@/shared/lib/profile';
import { PortfolioStore, isStoreError, type MessageInput } from '@/shared/lib/store';

type Status = null | 'sending' | 'sent' | 'mailto' | 'error';
type Sender = (input: MessageInput) => Promise<void>;

interface FormState extends MessageInput {
  company: string; // honeypot: humans never see or fill it
}

const EMPTY: FormState = { name: '', email: '', message: '', company: '' };
const THROTTLE_MS = 30_000;

const inputCls =
  'w-full rounded border border-white/10 bg-neutral-900 p-3 text-white transition-all focus:border-cyan-400 focus:shadow-neon focus:outline-hidden';

function openMailto(f: MessageInput) {
  const subject = `Portfolio Contact from ${f.name}`;
  const body = `Name: ${f.name}\nEmail: ${f.email}\n\nMessage:\n${f.message}`;
  window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

interface Props {
  t: Translation;
  /** Injectable for tests; defaults to the real store. */
  send?: Sender;
}

export function Contact({ t, send = (i) => PortfolioStore.sendMessage(i) }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [status, setStatus] = useState<Status>(null);
  const [error, setError] = useState<string | null>(null);
  const lastSent = useRef(0);

  const field = (key: keyof FormState) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.company) return; // honeypot: bots pass silently, nothing happens
    if (Date.now() - lastSent.current < THROTTLE_MS) {
      setStatus('error');
      setError(t.contact.throttle);
      return;
    }
    setStatus('sending');
    try {
      await send({ name: form.name, email: form.email, message: form.message });
      lastSent.current = Date.now();
      setStatus('sent');
      setForm(EMPTY);
    } catch (err) {
      if (isStoreError(err) && err.code === 'not-configured') {
        openMailto(form); // backend off: honest mailto path, data kept
        setStatus('mailto');
        setTimeout(() => setStatus(null), 3000);
      } else {
        setStatus('error'); // offline/validation: message kept, never cleared
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Couldn't send. Check your connection and try again.",
        );
      }
    }
  };

  return (
    <section id="contact" className="relative z-10 border-t border-white/5 bg-neutral-900 py-20">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 md:grid-cols-2">
        <div className="space-y-8">
          <h2 className="font-heading text-4xl font-bold">
            {t.contact.title}
            <br />
            <span className="text-cyan-400">{t.contact.titleHigh}</span>
          </h2>
          <p className="text-lg text-neutral-400">{t.contact.desc}</p>
          <div className="space-y-4">
            <a
              href={`mailto:${profile.email}`}
              className="group flex items-center gap-4 rounded border border-white/5 bg-white/5 p-4 transition-all hover:border-cyan-400"
            >
              <div className="rounded bg-neutral-800 p-3 text-cyan-400 transition-shadow group-hover:shadow-neon">
                <Mail aria-hidden="true" />
              </div>
              <div>
                <div className="font-mono text-xs text-neutral-400 uppercase">
                  {t.contact.email}
                </div>
                <div className="text-white">{profile.email}</div>
              </div>
            </a>
            <div className="group flex items-center gap-4 rounded border border-white/5 bg-white/5 p-4 transition-all hover:border-cyan-400">
              <div className="rounded bg-neutral-800 p-3 text-cyan-400 transition-shadow group-hover:shadow-neon">
                <MapPin aria-hidden="true" />
              </div>
              <div>
                <div className="font-mono text-xs text-neutral-400 uppercase">{t.contact.loc}</div>
                <div className="flex items-center gap-3 text-white">
                  Bandung
                  <div className="flex items-center gap-1.5 rounded border border-cyan-500/20 bg-cyan-900/10 px-2 py-0.5 font-mono text-xs text-cyan-400">
                    <Clock size={12} aria-hidden="true" />
                    <span>WIB (UTC+7)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative space-y-6 rounded-lg border border-white/10 bg-glass p-8"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="contact-name" className="font-mono text-xs text-neutral-300">
                {t.contact.name}
              </label>
              <input
                id="contact-name"
                type="text"
                autoComplete="name"
                required
                value={form.name}
                onChange={field('name')}
                className={inputCls}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="contact-email" className="font-mono text-xs text-neutral-300">
                {t.contact.email}
              </label>
              <input
                id="contact-email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={form.email}
                onChange={field('email')}
                className={inputCls}
                placeholder="john@example.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="contact-message" className="font-mono text-xs text-neutral-300">
              {t.contact.msg}
            </label>
            <textarea
              id="contact-message"
              rows={4}
              required
              minLength={10}
              maxLength={2000}
              value={form.message}
              onChange={field('message')}
              className={inputCls}
              placeholder="Tell me about your thoughts…"
            />
          </div>
          <div aria-hidden="true" className="absolute h-px w-px overflow-hidden opacity-0">
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              value={form.company}
              onChange={field('company')}
            />
          </div>
          <button
            type="submit"
            disabled={status === 'sending'}
            className="flex w-full items-center justify-center gap-2 rounded-xs bg-cyan-400 py-4 font-bold text-void transition-all hover:bg-cyan-500 hover:shadow-neon disabled:opacity-70"
          >
            {status === 'sending'
              ? t.contact.sending
              : status === 'mailto'
                ? t.contact.opening
                : t.contact.btn}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
          <div role="status" aria-live="polite">
            {status === 'sent' ? <p className="text-sm text-cyan-300">{t.contact.sent}</p> : null}
            {status === 'error' && error ? <p className="text-sm text-red-300">{error}</p> : null}
          </div>
        </form>
      </div>
    </section>
  );
}
