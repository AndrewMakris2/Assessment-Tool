import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ClientLogin({ onAuth, onBack, inviteToken }) {
  const [mode, setMode] = useState(inviteToken ? 'activate' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteInfo, setInviteInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useState(() => {
    if (inviteToken) {
      fetch(`${API}/client/invite/${inviteToken}`)
        .then(r => { if (!r.ok) throw new Error('Invalid invite'); return r.json(); })
        .then(data => { setInviteInfo(data); setEmail(data.email); })
        .catch(e => setError('This invite link is invalid or has expired.'));
    }
  }, [inviteToken]);

  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/client/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || 'Invalid credentials'); }
      const data = await res.json();
      onAuth(data.token, data.user);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  async function handleActivate(e) {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/client/activate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteToken, password }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || 'Activation failed'); }
      const data = await res.json();
      onAuth(data.token, data.user);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-surface-0 border border-white/[0.08] rounded-lg text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all duration-200";

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern bg-grid" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent/[0.03] rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-[380px]">
        <div className="text-center mb-8">
          <button onClick={onBack} className="inline-flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <span className="text-[15px] font-semibold text-white tracking-[-0.01em]">CyberAssess</span>
          </button>
        </div>

        <div className="border border-white/[0.06] rounded-2xl bg-surface-1 p-7">
          {mode === 'activate' ? (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white">Set up your account</h2>
                {inviteInfo && <p className="text-sm text-muted mt-1">Welcome to {inviteInfo.org_name}'s security portal</p>}
              </div>
              <form onSubmit={handleActivate} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-subtle mb-1.5 uppercase tracking-[0.08em]">Email</label>
                  <input type="email" className={`${inputClass} opacity-60`} value={email} disabled />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-subtle mb-1.5 uppercase tracking-[0.08em]">Create password</label>
                  <input type="password" className={inputClass} placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-subtle mb-1.5 uppercase tracking-[0.08em]">Confirm password</label>
                  <input type="password" className={inputClass} placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
                {error && <div className="px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-lg"><p className="text-red-400 text-[13px]">{error}</p></div>}
                <button type="submit" disabled={loading} className="w-full py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-30 transition-colors">
                  {loading ? 'Activating...' : 'Create account'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white">Client portal</h2>
                <p className="text-sm text-muted mt-1">Sign in to view your assessments</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-subtle mb-1.5 uppercase tracking-[0.08em]">Email</label>
                  <input type="email" className={inputClass} placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-subtle mb-1.5 uppercase tracking-[0.08em]">Password</label>
                  <input type="password" className={inputClass} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                {error && <div className="px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-lg"><p className="text-red-400 text-[13px]">{error}</p></div>}
                <button type="submit" disabled={loading || !email || !password} className="w-full py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-30 transition-colors">
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
