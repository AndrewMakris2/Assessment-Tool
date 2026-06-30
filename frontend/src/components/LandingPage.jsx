import ParticleNetwork from './ParticleNetwork';

const ShieldIcon = ({ size = 'w-5 h-5' }) => (
  <svg className={size} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="url(#shieldGrad)">
    <defs>
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a78bfa" />
        <stop offset="50%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#e879f9" />
      </linearGradient>
    </defs>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);

export default function LandingPage({ onGetStarted, onClientPortal }) {
  return (
    <div className="min-h-screen bg-surface-0 relative overflow-hidden">
      {/* Particle network background */}
      <div className="absolute inset-0">
        <ParticleNetwork />
      </div>

      {/* Gradient orbs for color depth */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-violet-600/[0.06] rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-fuchsia-600/[0.04] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-purple-500/[0.03] rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 lg:px-8 py-5 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
              <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <span className="text-[15px] font-semibold text-white tracking-[-0.01em]">CyberAssess</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClientPortal}
              className="px-4 py-2 text-sm text-muted hover:text-white border border-white/[0.08] rounded-lg hover:border-white/[0.15] hover:bg-white/[0.03] transition-all duration-200"
            >
              Client Portal
            </button>
            <button
              onClick={onGetStarted}
              className="px-4 py-2 text-sm text-white bg-accent/80 hover:bg-accent rounded-lg transition-all duration-200"
            >
              Admin
            </button>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-3xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/[0.06] text-xs text-violet-300 mb-8">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            NIST CSF &middot; CIS Controls v8 &middot; ISO 27001
          </div>

          <h1 className="text-[3.25rem] md:text-[3.75rem] font-bold text-white leading-[1.08] tracking-[-0.035em] mb-5">
            Security risk assessment,
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-purple-300 bg-clip-text text-transparent">
              simplified.
            </span>
          </h1>

          <p className="text-[17px] text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Evaluate your organization across 9 critical security domains.
            Get AI-generated analysis, weighted scoring, and client-ready PDF reports.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onGetStarted}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-sm font-medium rounded-lg hover:shadow-xl hover:shadow-violet-500/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              Get Started
            </button>
            <a
              href="#features"
              className="px-6 py-2.5 text-sm text-muted hover:text-white border border-white/[0.08] rounded-lg hover:border-white/[0.15] hover:bg-white/[0.03] transition-all duration-200"
            >
              Learn More
            </a>
          </div>
        </section>

        {/* Domains */}
        <div className="max-w-4xl mx-auto px-6 pb-20">
          <div className="border border-white/[0.06] rounded-xl bg-surface-0/60 backdrop-blur-sm p-6">
            <p className="text-[11px] text-subtle uppercase tracking-[0.12em] text-center mb-5 font-medium">Assessment Domains</p>
            <div className="grid grid-cols-3 md:grid-cols-3 gap-2">
              {DOMAINS.map((d, i) => (
                <div key={i} className="text-center py-2.5 px-3 rounded-lg hover:bg-violet-500/[0.04] transition-colors">
                  <p className="text-[13px] text-zinc-300 font-medium">{d.name}</p>
                  <p className="text-[11px] text-subtle mt-0.5 font-mono">{d.framework}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <section id="features" className="max-w-5xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-white tracking-[-0.02em] mb-2">Built for security professionals</h2>
            <p className="text-muted text-[15px]">Everything you need to deliver thorough, defensible assessments.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="border border-white/[0.06] rounded-xl p-5 bg-surface-0/40 backdrop-blur-sm hover:border-violet-500/20 hover:bg-violet-500/[0.02] transition-all duration-200 group"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center mb-4 text-violet-300 group-hover:from-violet-600/30 group-hover:to-fuchsia-500/30 transition-all">
                  {f.icon}
                </div>
                <h3 className="text-[15px] font-medium text-white mb-1.5">{f.title}</h3>
                <p className="text-[13px] text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-4xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-white tracking-[-0.02em] mb-2">How it works</h2>
            <p className="text-muted text-[15px]">Four steps from intake to deliverable.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <div key={i} className="relative">
                <div className="text-[11px] font-mono font-medium mb-3 tracking-wider bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  STEP {String(i + 1).padStart(2, '0')}
                </div>
                <h4 className="text-[15px] font-medium text-white mb-1.5">{s.title}</h4>
                <p className="text-[13px] text-zinc-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
          <div className="border border-violet-500/10 rounded-2xl bg-gradient-to-b from-violet-600/[0.04] to-transparent p-12">
            <h2 className="text-2xl font-semibold text-white tracking-[-0.02em] mb-3">Ready to assess?</h2>
            <p className="text-muted text-[15px] mb-6">Start your first assessment in under a minute.</p>
            <button
              onClick={onGetStarted}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-sm font-medium rounded-lg hover:shadow-xl hover:shadow-violet-500/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              Get Started
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] py-6 px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-md flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <span className="text-xs text-subtle">CyberAssess</span>
            </div>
            <p className="text-xs text-subtle">
              Built by Andrew Makris
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>,
    title: 'Framework-aligned',
    desc: 'Questions mapped to NIST CSF, CIS Controls v8, and ISO 27001 for credibility with auditors and stakeholders.',
  },
  {
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>,
    title: 'AI-powered reports',
    desc: 'Generate executive summaries, domain analysis, and phased remediation roadmaps with Claude AI.',
  },
  {
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>,
    title: 'Industry-weighted scoring',
    desc: 'Risk weights adjust automatically by industry — Finance weights compliance heavier, Healthcare weights data protection.',
  },
  {
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>,
    title: 'PDF export',
    desc: 'Branded, client-ready reports with cover pages, score tables, flagged findings, and remediation timelines.',
  },
  {
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>,
    title: 'Assessor notes',
    desc: 'Capture context per question — notes flow into the AI report and PDF for full documentation.',
  },
  {
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>,
    title: 'MFA protected',
    desc: 'TOTP-based multi-factor authentication. No data stored externally. Built for consultant-grade confidentiality.',
  },
];

const DOMAINS = [
  { name: 'Asset Management', framework: 'CIS v8' },
  { name: 'Access Control & IAM', framework: 'NIST + ISO' },
  { name: 'Vulnerability Management', framework: 'CIS v8' },
  { name: 'Data Protection & Backup', framework: 'ISO 27001' },
  { name: 'Incident Response', framework: 'NIST CSF' },
  { name: 'Vendor & Third-Party Risk', framework: 'NIST CSF' },
  { name: 'Compliance & Regulatory', framework: 'Custom' },
  { name: 'Physical Security', framework: 'ISO 27001' },
  { name: 'Security Awareness', framework: 'CIS v8' },
];

const STEPS = [
  { title: 'Organization intake', desc: 'Company details, industry, and team size for tailored risk weighting.' },
  { title: 'Answer questions', desc: '41 questions across 9 domains with optional assessor notes.' },
  { title: 'Review scores', desc: 'Domain scores, radar visualization, and flagged findings.' },
  { title: 'Generate report', desc: 'AI-powered narrative analysis with exportable PDF.' },
];
