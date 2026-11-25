import { useEffect, useRef, useState } from 'react';
import { Bot, Send } from 'lucide-react';
import type { Translation } from '@/shared/lib/locale';
import { findAnswer } from './matcher';

interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
}

const QUICK_CHIPS = ['Education?', 'Freelance?', 'Strength?', 'Weakness?', 'MBTI?'];
const REPLY_DELAY_MS = 800;

export function Chatbot({ t }: { t: Translation }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: "Hi there! I'm Diki's virtual assistant. Ask me anything about my background!",
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Scroll only the log itself: scrollIntoView would also scroll the whole page
  // (it used to jump past the hero on every load).
  useEffect(() => {
    const log = logRef.current;
    if (log?.scrollTo) log.scrollTo({ top: log.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Answers come from the static knowledge base only (see matcher.ts).
  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text) return;
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setInput('');
    setTyping(true);
    timerRef.current = setTimeout(() => {
      setMessages((prev) => [...prev, { sender: 'bot', text: findAnswer(text) }]);
      setTyping(false);
    }, REPLY_DELAY_MS);
  };

  return (
    <section id="about" className="relative z-10 bg-void py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 md:grid-cols-2">
        <div>
          <div className="mb-6 flex items-center gap-4">
            <div className="h-1 w-12 bg-cyan-400" />
            <h2 className="font-mono tracking-wide text-cyan-400 uppercase">About Me</h2>
          </div>
          <h3 className="mb-6 font-heading text-4xl font-bold">{t.about.title}</h3>
          <p className="mb-8 text-lg leading-relaxed text-neutral-400">
            Reading a traditional bio can be boring. So I built this interactive Q&amp;A assistant
            to give you quick answers about my background.
          </p>
        </div>

        <div className="glass-panel relative flex h-[500px] w-full min-w-0 flex-col overflow-hidden rounded-lg border border-cyan-500/30 shadow-[0_0_20px_rgba(0,240,255,0.15)] transition-all duration-300 hover:shadow-neon">
          <div className="flex items-center justify-between border-b border-white/10 bg-neutral-900 p-3">
            <div className="flex items-center gap-2" aria-hidden="true">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <div className="ml-4 flex items-center gap-2">
              <Bot size={18} className="animate-pulse text-cyan-400" aria-hidden="true" />
              <span className="font-mono text-xs font-bold tracking-wide text-cyan-400">
                diki_assistant
              </span>
            </div>
            <div className="w-10" />
          </div>

          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-label="Conversation with Diki's assistant"
            className="flex-1 space-y-4 overflow-y-auto p-6 font-mono text-sm"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-md p-3 ${
                    msg.sender === 'user'
                      ? 'border border-cyan-400 bg-cyan-400/10 text-cyan-400'
                      : 'border border-transparent bg-steel text-white'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {typing && <div className="animate-pulse text-neutral-400">Typing...</div>}
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-white/5 bg-neutral-900/50 p-3">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => send(chip)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs whitespace-nowrap transition-colors hover:bg-cyan-400 hover:text-void"
              >
                {chip}
              </button>
            ))}
          </div>

          <form
            className="flex gap-2 border-t border-white/10 bg-neutral-900 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              id="chat-input"
              aria-label="Ask about Diki"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a command…"
              className="flex-1 border-none bg-transparent font-mono text-sm text-white outline-hidden placeholder:text-neutral-400"
            />
            <button type="submit" aria-label="Send message" className="text-cyan-400">
              <Send size={18} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
