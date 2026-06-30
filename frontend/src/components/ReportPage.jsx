import { useState } from 'react';
import { RATING_COLORS } from '../utils/scoring';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ReportPage({ intake, scores, report, notes, onStartOver }) {
  const [downloading, setDownloading] = useState(false);
  const [expandedDomains, setExpandedDomains] = useState({});
  const [error, setError] = useState(null);

  function toggleDomain(d) { setExpandedDomains((p) => ({ ...p, [d]: !p[d] })); }

  async function handleDownload() {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intake, scoring: scores, report, notes }),
      });
      if (!res.ok) throw new Error('PDF export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Risk_Assessment_${intake.org_name.replace(/\s+/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setError(e.message); } finally { setDownloading(false); }
  }

  const SectionTitle = ({ children }) => (
    <h3 className="text-[11px] font-medium text-subtle mb-4 uppercase tracking-[0.12em]">{children}</h3>
  );

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-[-0.01em]">{intake.org_name}</h2>
          <p className="text-[13px] text-subtle mt-1 font-mono">
            {intake.industry} &middot; {intake.employee_count} &middot; {intake.assessment_date}
            {intake.assessor_name && <> &middot; {intake.assessor_name}</>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-30 transition-colors shadow-lg shadow-accent/20"
          >
            {downloading ? 'Exporting...' : 'Export PDF'}
          </button>
          <button
            onClick={onStartOver}
            className="px-4 py-2 text-sm text-muted hover:text-white border border-white/[0.08] rounded-lg hover:border-white/[0.15] transition-all duration-200"
          >
            New
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-red-500/15 rounded-xl bg-red-500/[0.03] p-3 mb-4">
          <p className="text-red-400 text-[13px]">{error}</p>
        </div>
      )}

      {/* Executive Summary */}
      <section className="border border-white/[0.06] rounded-2xl bg-surface-1 p-6 mb-4">
        <SectionTitle>Executive Summary</SectionTitle>
        {report.executive_summary.split('\n\n').map((p, i) => (
          <p key={i} className="text-[14px] text-zinc-300 mb-3 leading-relaxed">{p}</p>
        ))}
        <div className="mt-4 pt-4 border-t border-white/[0.04] text-center">
          <span className={`inline-block px-3 py-1 rounded-full text-white text-[12px] font-medium ${RATING_COLORS[scores.risk_rating]}`}>
            {scores.risk_rating} — {(scores.overall_score * 100).toFixed(0)}%
          </span>
        </div>
      </section>

      {/* Key Findings */}
      <section className="border border-white/[0.06] rounded-2xl bg-surface-1 p-6 mb-4">
        <SectionTitle>Key Findings</SectionTitle>
        <ul className="space-y-2.5">
          {report.key_findings.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[14px] text-zinc-300">
              <span className="text-accent-light text-[10px] mt-1.5">&#9679;</span>
              <span className="leading-relaxed">{f}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Domain Analysis */}
      <section className="border border-white/[0.06] rounded-2xl bg-surface-1 p-6 mb-4">
        <SectionTitle>Domain Analysis</SectionTitle>
        <div className="space-y-1">
          {Object.entries(report.domain_analysis).map(([domain, analysis]) => (
            <div key={domain} className="border border-white/[0.04] rounded-xl overflow-hidden">
              <button
                onClick={() => toggleDomain(domain)}
                className="w-full flex justify-between items-center px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
                aria-expanded={!!expandedDomains[domain]}
              >
                <span className="text-[13px] font-medium text-zinc-300">{domain}</span>
                <svg
                  className={`w-4 h-4 text-subtle transition-transform duration-200 ${expandedDomains[domain] ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {expandedDomains[domain] && (
                <div className="px-4 pb-4 text-[13px] text-zinc-400 leading-relaxed border-t border-white/[0.04] pt-3">
                  {analysis}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Remediation Roadmap */}
      <section className="border border-white/[0.06] rounded-2xl bg-surface-1 p-6 mb-4">
        <SectionTitle>Remediation Roadmap</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { key: 'short_term', label: '0–30 days', color: 'border-red-500/30', dot: 'bg-red-400' },
            { key: 'mid_term', label: '30–90 days', color: 'border-amber-500/30', dot: 'bg-amber-400' },
            { key: 'long_term', label: '90+ days', color: 'border-emerald-500/30', dot: 'bg-emerald-400' },
          ].map(({ key, label, color, dot }) => (
            <div key={key} className={`border-l-2 ${color} bg-white/[0.01] rounded-r-xl p-4`}>
              <div className="flex items-center gap-1.5 mb-3">
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                <span className="text-[11px] text-subtle uppercase tracking-wider font-medium">{label}</span>
              </div>
              <ul className="space-y-2">
                {(report.remediation_roadmap[key] || []).map((item, i) => (
                  <li key={i} className="text-[12px] text-zinc-400 leading-relaxed">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="border border-white/[0.06] rounded-2xl bg-surface-1 p-6 mb-8">
        <SectionTitle>Closing Statement</SectionTitle>
        <p className="text-[14px] text-zinc-300 leading-relaxed">{report.closing_statement}</p>
      </section>
    </div>
  );
}
