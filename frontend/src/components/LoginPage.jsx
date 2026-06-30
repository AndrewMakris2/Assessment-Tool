import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);

export default function LoginPage({ onAuth, onBack }) {
  const [phase, setPhase] = useState('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Invalid credentials');
      }
      const data = await res.json();
      if (data.enrolled) {
        setPhase('mfa_verify');
      } else {
        setQrCode(data.qr_code);
        setTotpSecret(data.totp_secret);
        setPhase('mfa_setup');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMfa(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/verify-mfa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, code: mfaCode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Invalid code');
      }
      const data = await res.json();
      onAuth(data.token, data.username);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-surface-0 border border-white/[0.08] rounded-lg text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all duration-200";
  const labelClass = "block text-[11px] font-medium text-subtle mb-1.5 uppercase tracking-[0.08em]";

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern bg-grid" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent/[0.03] rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-[380px]">
        <div className="text-center mb-8">
          <button onClick={onBack} className="inline-flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
              <ShieldIcon />
            </div>
            <span className="text-[15px] font-semibold text-white tracking-[-0.01em] group-hover:text-accent-light transition-colors">CyberAssess</span>
          </button>
        </div>

        <div className="border border-white/[0.06] rounded-2xl bg-surface-1 p-7">
          {phase === 'credentials' ? (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white tracking-[-0.01em]">Sign in</h2>
                <p className="text-sm text-muted mt-1">Enter your credentials to continue</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="username" className={labelClass}>Username</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={inputClass}
                    placeholder="Username"
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label htmlFor="password" className={labelClass}>Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Password"
                    autoComplete="current-password"
                  />
                </div>

                {error && (
                  <div className="px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-[13px]">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !username || !password}
                  className="w-full py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? 'Verifying...' : 'Continue'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white tracking-[-0.01em]">Two-factor authentication</h2>
                <p className="text-sm text-muted mt-1">
                  {phase === 'mfa_setup'
                    ? 'Scan with your authenticator app to set up MFA'
                    : 'Enter the code from your authenticator app'}
                </p>
              </div>

              <form onSubmit={handleMfa} className="space-y-5">
                {phase === 'mfa_setup' && (
                  <>
                    <div className="flex justify-center">
                      <div className="bg-white rounded-xl p-3 shadow-lg">
                        <img src={qrCode} alt="TOTP QR Code" className="w-44 h-44" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] text-subtle mb-1.5 uppercase tracking-wider">Manual entry key</p>
                      <code className="text-[12px] text-accent-light bg-surface-0 px-3 py-1.5 rounded-md font-mono select-all border border-white/[0.06]">
                        {totpSecret}
                      </code>
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="mfa-code" className={labelClass}>Verification Code</label>
                  <input
                    id="mfa-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-3 bg-surface-0 border border-white/[0.08] rounded-lg text-white text-center text-xl font-mono tracking-[0.4em] placeholder-zinc-700 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
                    placeholder="000000"
                    autoComplete="one-time-code"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-[13px]">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || mfaCode.length !== 6}
                  className="w-full py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? 'Verifying...' : 'Verify & Sign In'}
                </button>

                <button
                  type="button"
                  onClick={() => { setPhase('credentials'); setError(''); setMfaCode(''); }}
                  className="w-full py-2 text-subtle text-[13px] hover:text-muted transition-colors"
                >
                  Back to sign in
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-subtle text-[11px] mt-5 tracking-wide">
          Secured with TOTP multi-factor authentication
        </p>
      </div>
    </div>
  );
}
