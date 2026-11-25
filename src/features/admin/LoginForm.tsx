import { useState, type FormEvent } from 'react';
import { PortfolioStore } from '@/shared/lib/store';

interface Props {
  configured: boolean;
  onDone: () => void;
}

export function LoginForm({ configured, onDone }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const sb = await PortfolioStore.client();
      if (!sb) throw new Error('no client');
      const { error: authError } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setBusy(false);
      if (authError) {
        setError("Couldn't sign in. Check your email and password, then try again.");
        return;
      }
      onDone();
    } catch {
      setBusy(false);
      setError("Couldn't sign in. Check your connection and try again.");
    }
  };

  const reset = async () => {
    if (!email.trim()) {
      setError('Type your email first, then choose forgot password.');
      return;
    }
    try {
      const sb = await PortfolioStore.client();
      if (!sb) throw new Error('no client');
      await sb.auth.resetPasswordForEmail(email.trim());
      setResetSent(true);
    } catch {
      setError("Couldn't send the reset link. Check your connection and try again.");
    }
  };

  const inputCls =
    'w-full rounded border border-white/10 bg-neutral-900 p-3 text-white disabled:opacity-50';

  return (
    <form
      onSubmit={submit}
      className="mx-auto max-w-sm space-y-4 rounded-lg border border-white/10 bg-white/5 p-8"
    >
      <h2 className="font-heading text-xl font-bold text-white">Log in</h2>
      {!configured ? (
        <p className="text-sm text-neutral-300">
          Backend isn&apos;t connected. Set <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> for this deployment, then redeploy.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      ) : null}
      {resetSent ? (
        <p role="status" className="text-sm text-cyan-300">
          If the address exists, a reset link is on its way.
        </p>
      ) : null}
      <div className="space-y-1">
        <label htmlFor="admin-email" className="font-mono text-xs text-neutral-300">
          EMAIL
        </label>
        <input
          id="admin-email"
          type="email"
          required
          autoComplete="username"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!configured || busy}
          className={inputCls}
          placeholder="admin@example.com"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="admin-password" className="font-mono text-xs text-neutral-300">
          PASSWORD
        </label>
        <input
          id="admin-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={!configured || busy}
          className={inputCls}
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={!configured || busy}
        className="w-full rounded bg-cyan-400 py-3 font-bold text-void hover:bg-cyan-300 disabled:opacity-50"
      >
        {busy ? 'Logging in…' : 'Log in'}
      </button>
      <button
        type="button"
        onClick={() => void reset()}
        disabled={!configured || busy}
        className="w-full text-center font-mono text-xs text-neutral-300 hover:text-cyan-400 disabled:opacity-50"
      >
        Forgot password?
      </button>
    </form>
  );
}
