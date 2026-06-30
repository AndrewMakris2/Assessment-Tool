import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const RATING_COLORS = { Critical: 'text-red-400 bg-red-500/10 border-red-500/20', High: 'text-orange-400 bg-orange-500/10 border-orange-500/20', Moderate: 'text-amber-400 bg-amber-500/10 border-amber-500/20', Low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };

export default function ClientOverview({ token, user, onNavigate }) {
  const [assessments, setAssessments] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [remediation, setRemediation] = useState({});
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/client/assessments`, { headers }).then(r => r.json()).then(data => {
      setAssessments(data);
      data.forEach(a => {
        fetch(`${API}/client/remediation/${a.id}`, { headers }).then(r => r.json()).then(items => {
          setRemediation(prev => ({ ...prev, [a.id]: items }));
        });
      });
    });
    fetch(`${API}/client/engagements`, { headers }).then(r => r.json()).then(setEngagements);
  }, []);

  const latest = assessments[0];
  const latestRemediation = latest ? remediation[latest.id] || [] : [];
  const fixedCount = latestRemediation.filter(r => r.status === 'fixed').length;
  const totalFindings = latestRemediation.length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-[-0.02em]">Welcome back</h1>
        <p className="text-sm text-muted mt-1">{user.org_name} security portal</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-4">
          <p className="text-[11px] text-subtle uppercase tracking-[0.08em] mb-1">Assessments</p>
          <p className="text-2xl font-semibold text-white font-mono">{assessments.length}</p>
        </div>
        <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-4">
          <p className="text-[11px] text-subtle uppercase tracking-[0.08em] mb-1">Current rating</p>
          {latest ? (
            <span className={`text-lg font-semibold px-2 py-0.5 rounded border ${RATING_COLORS[latest.risk_rating] || ''}`}>{latest.risk_rating}</span>
          ) : <p className="text-lg text-zinc-500">—</p>}
        </div>
        <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-4">
          <p className="text-[11px] text-subtle uppercase tracking-[0.08em] mb-1">Remediation progress</p>
          <p className="text-2xl font-semibold text-white font-mono">
            {totalFindings > 0 ? `${fixedCount}/${totalFindings}` : '—'}
          </p>
          {totalFindings > 0 && (
            <div className="h-1.5 bg-white/[0.04] rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(fixedCount / totalFindings) * 100}%` }} />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Latest assessment */}
        <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[11px] font-medium text-subtle uppercase tracking-[0.12em]">Latest assessment</h3>
            <button onClick={() => onNavigate('assessments')} className="text-[11px] text-accent-light hover:underline">View all</button>
          </div>
          {latest ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[12px] font-medium px-2 py-0.5 rounded border ${RATING_COLORS[latest.risk_rating] || ''}`}>{latest.risk_rating}</span>
                <span className="text-2xl font-bold text-white font-mono">{Math.round(latest.overall_score * 100)}%</span>
              </div>
              <p className="text-[11px] text-subtle font-mono">{latest.assessment_date}</p>
              <div className="flex gap-1 mt-3">
                {Object.entries(latest.domain_scores).map(([d, data]) => {
                  if (data.excluded) return null;
                  const pct = Math.round(data.score * 100);
                  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : pct >= 40 ? 'bg-orange-500' : 'bg-red-500';
                  return <div key={d} className="flex-1" title={`${d}: ${pct}%`}><div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} /></div></div>;
                })}
              </div>
            </div>
          ) : <p className="text-zinc-600 text-sm text-center py-4">No assessments yet</p>}
        </div>

        {/* Engagements */}
        <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[11px] font-medium text-subtle uppercase tracking-[0.12em]">Engagements</h3>
            <button onClick={() => onNavigate('engagements')} className="text-[11px] text-accent-light hover:underline">View all</button>
          </div>
          {engagements.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-4">No engagements</p>
          ) : (
            <div className="space-y-2">
              {engagements.slice(0, 4).map(e => (
                <div key={e.id} className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className="text-[13px] text-zinc-300">{e.title}</p>
                    {e.due_date && <p className="text-[11px] text-subtle font-mono">Due {e.due_date}</p>}
                  </div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                    e.status === 'delivered' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                    e.status === 'in-progress' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                    'text-blue-400 bg-blue-500/10 border-blue-500/20'
                  }`}>{e.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top priority fixes */}
      {latestRemediation.filter(r => r.status === 'open').length > 0 && (
        <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-5 mt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[11px] font-medium text-subtle uppercase tracking-[0.12em]">Top priority fixes</h3>
            <button onClick={() => onNavigate('remediation')} className="text-[11px] text-accent-light hover:underline">View all</button>
          </div>
          <div className="space-y-2">
            {latestRemediation.filter(r => r.status === 'open').slice(0, 5).map(r => {
              const finding = latest.flagged_findings.find(f => f.id === r.question_id);
              return (
                <div key={r.id} className="flex items-start gap-2 py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-red-400 mt-0.5 text-[10px]">●</span>
                  <div>
                    <p className="text-[13px] text-zinc-300">{finding?.question || r.question_id}</p>
                    {finding?.fix_hint && <p className="text-[11px] text-subtle mt-0.5">{finding.fix_hint}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
