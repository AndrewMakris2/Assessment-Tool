import { useEffect, useState, useRef } from 'react';
import { RATING_COLORS } from '../utils/scoring';
import RadarChart from './RadarChart';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ReviewPage({ intake, answers, notes, scores, setScores, onGenerateReport, onStartOver, onSave }) {
  const [loading, setLoading] = useState(!scores);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const generateRef = useRef(false);

  useEffect(() => {
    if (scores) return;
    setLoading(true);
    fetch(`${API}/assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intake, answers, notes }),
    })
      .then((r) => { if (!r.ok) throw new Error('Scoring failed'); return r.json(); })
      .then((data) => { setScores(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  async function handleGenerate() {
    if (generateRef.current) return;
    generateRef.current = true;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${API}/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intake, answers, notes, scoring: scores }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || 'Failed'); }
      onGenerateReport(await res.json());
    } catch (e) {
      setError(friendlyError(e.message));
      setGenerating(false);
      generateRef.current = false;
    }
  }

  async function handleFallbackPdf() {
    try {
      const res = await fetch(`${API}/export-pdf-fallback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intake, scoring: scores, notes }),
      });
      if (!res.ok) throw new Error('PDF export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Risk_Assessment_${intake.org_name.replace(/\s+/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setError(e.message); }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-subtle text-sm">Calculating scores...</p>
      </div>
    );
  }

  if (error && !scores) {
    return (
      <div className="max-w-md mx-auto text-center py-24">
        <p className="text-red-400 text-sm mb-4">{error}</p>
        <button onClick={onStartOver} className="px-5 py-2 bg-accent text-white text-sm rounded-lg">Start Over</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white tracking-[-0.01em]">{intake.org_name}</h2>
        <p className="text-[13px] text-subtle mt-1 font-mono">
          {intake.industry} &middot; {intake.employee_count} &middot; {intake.assessment_date}
          {intake.assessor_name && <> &middot; {intake.assessor_name}</>}
        </p>
      </div>

      {/* Overall score */}
      <div className="border border-white/[0.06] rounded-2xl bg-surface-1 p-8 mb-4 text-center">
        <p className="text-[11px] text-subtle uppercase tracking-[0.12em] mb-3">Overall Risk Rating</p>
        <span className={`inline-block px-4 py-1.5 rounded-full text-white text-sm font-semibold ${RATING_COLORS[scores.risk_rating]}`}>
          {scores.risk_rating}
        </span>
        <p className="text-4xl font-bold text-white mt-3 font-mono tracking-tight">{(scores.overall_score * 100).toFixed(0)}%</p>
      </div>

      {/* Radar */}
      <div className="border border-white/[0.06] rounded-2xl bg-surface-1 p-6 mb-4">
        <RadarChart domainScores={scores.domain_scores} />
      </div>

      {/* Score table */}
      <div className="border border-white/[0.06] rounded-2xl overflow-hidden mb-4">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-2">
              <th className="text-left px-5 py-3 text-[11px] font-medium text-subtle uppercase tracking-[0.08em]">Domain</th>
              <th className="text-center px-5 py-3 text-[11px] font-medium text-subtle uppercase tracking-[0.08em]">Score</th>
              <th className="text-center px-5 py-3 text-[11px] font-medium text-subtle uppercase tracking-[0.08em]">Rating</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(scores.domain_scores).map(([domain, data], i) => (
              <tr key={domain} className="border-t border-white/[0.04] hover:bg-white/[0.01] transition-colors">
                <td className="px-5 py-3 text-[13px] text-zinc-300">{domain}</td>
                <td className="px-5 py-3 text-center text-[13px] text-zinc-400 font-mono">
                  {data.excluded ? '—' : `${(data.score * 100).toFixed(0)}%`}
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-white text-[11px] font-medium ${RATING_COLORS[data.rating]}`}>
                    {data.rating}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Flagged findings — prioritized by severity */}
      {scores.flagged_findings.length > 0 && (
        <div className="border border-white/[0.06] rounded-2xl bg-surface-1 p-5 mb-4">
          <h3 className="text-[11px] font-medium text-subtle mb-4 uppercase tracking-[0.12em]">
            Prioritized findings ({scores.flagged_findings.length})
          </h3>
          {(() => {
            const groups = {};
            for (const f of scores.flagged_findings) {
              const s = f.severity || 'Medium';
              if (!groups[s]) groups[s] = [];
              groups[s].push(f);
            }
            const order = ['Critical', 'High', 'Medium', 'Low'];
            const sevStyle = {
              Critical: 'text-red-400 bg-red-500/10 border-red-500/20',
              High: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
              Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
              Low: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
            };
            const effortLabel = { Low: 'Quick win', Medium: 'Moderate', High: 'Long-term' };
            return order.filter(s => groups[s]).map(severity => (
              <div key={severity} className="mb-4 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${sevStyle[severity]}`}>{severity}</span>
                  <span className="text-[11px] text-subtle">{severity === 'Critical' ? 'Fix immediately' : severity === 'High' ? 'Fix this week' : severity === 'Medium' ? 'Fix this month' : 'Plan for next quarter'}</span>
                </div>
                <div className="space-y-2 ml-1">
                  {groups[severity].map(f => (
                    <div key={f.id} className="border border-white/[0.04] rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] text-zinc-300">
                          <span className="font-mono text-subtle text-[11px] mr-1">{f.id}</span> {f.question}
                        </p>
                        {f.effort && (
                          <span className="text-[10px] text-zinc-500 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded flex-shrink-0">
                            {effortLabel[f.effort] || f.effort}
                          </span>
                        )}
                      </div>
                      {f.fix_hint && (
                        <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">{f.fix_hint}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {error && (
        <div className="border border-red-500/15 rounded-xl bg-red-500/[0.03] p-4 mb-4">
          <p className="text-red-400 text-[13px]">{error}</p>
          <button onClick={handleFallbackPdf} className="mt-2 text-[12px] text-accent-light underline hover:no-underline">
            Download scores-only PDF instead
          </button>
        </div>
      )}

      <div className="flex justify-between items-center pt-6 border-t border-white/[0.06]">
        <button
          onClick={onStartOver}
          className="px-5 py-2 text-sm text-muted hover:text-white border border-white/[0.08] rounded-lg hover:border-white/[0.15] transition-all duration-200"
        >
          Start Over
        </button>
        <div className="flex gap-2">
          {onSave && (
            <SaveButton onSave={onSave} />
          )}
          <button
            onClick={handleFallbackPdf}
            className="px-5 py-2 text-sm text-muted hover:text-white border border-white/[0.08] rounded-lg hover:border-white/[0.15] transition-all duration-200"
          >
            Export PDF
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-5 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-lg shadow-accent/20"
          >
            {generating ? 'Generating...' : 'Generate AI Report'}
          </button>
        </div>
      </div>

      {generating && (
        <div className="flex flex-col items-center py-10">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-subtle text-sm">Generating AI report...</p>
        </div>
      )}
    </div>
  );
}

function SaveButton({ onSave }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  async function handleSave() {
    setSaving(true);
    try { await onSave(); setSaved(true); } catch { } finally { setSaving(false); }
  }
  if (saved) return <span className="px-5 py-2 text-sm text-emerald-400">Saved ✓</span>;
  return (
    <button onClick={handleSave} disabled={saving}
      className="px-5 py-2 text-sm text-muted hover:text-white border border-white/[0.08] rounded-lg hover:border-white/[0.15] transition-all duration-200 disabled:opacity-50">
      {saving ? 'Saving...' : 'Save'}
    </button>
  );
}

function friendlyError(msg) {
  if (/api|key|auth/i.test(msg)) return 'Report generation is currently unavailable. Please check your API configuration.';
  if (/fetch|network|failed/i.test(msg)) return 'Unable to connect to the server. Please check that the backend is running.';
  return 'An unexpected error occurred. Please try again.';
}
