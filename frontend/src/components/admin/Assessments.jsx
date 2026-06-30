import { useEffect, useState } from 'react';
import { authFetch } from '../../utils/api';

const RATING_COLORS = { Critical: 'text-red-400 bg-red-500/10 border-red-500/20', High: 'text-orange-400 bg-orange-500/10 border-orange-500/20', Moderate: 'text-amber-400 bg-amber-500/10 border-amber-500/20', Low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };

export default function Assessments({ token }) {
  const [assessments, setAssessments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    authFetch('/admin/assessments', token).then(r => r.json()).then(setAssessments);
  }, []);

  const filtered = assessments.filter(a => {
    if (filter !== 'all' && a.risk_rating !== filter) return false;
    if (search && !a.org_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-[-0.02em]">Assessment History</h1>
        <p className="text-sm text-muted mt-1">{assessments.length} assessment{assessments.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          className="flex-1 px-3 py-2 bg-surface-0 border border-white/[0.08] rounded-lg text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-accent/50"
          placeholder="Search by organization..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-1">
          {['all', 'Critical', 'High', 'Moderate', 'Low'].map(f => (
            <button
              key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 text-[12px] rounded-lg font-medium border transition-all ${filter === f ? 'bg-accent/15 text-accent-light border-accent/30' : 'text-zinc-500 border-white/[0.06] hover:text-zinc-400'}`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-12 text-center">
          <p className="text-zinc-500 text-sm">{assessments.length === 0 ? 'No assessments saved yet. Complete an assessment and save it to see it here.' : 'No matching assessments'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <div key={a.id} className="border border-white/[0.06] rounded-xl bg-surface-1 p-5 hover:border-white/[0.1] transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-medium text-white">{a.org_name}</h3>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${RATING_COLORS[a.risk_rating] || ''}`}>{a.risk_rating}</span>
                  </div>
                  <p className="text-[11px] text-subtle font-mono">
                    {a.assessment_date} &middot; {a.assessor_name || 'No assessor'} &middot; {Object.keys(a.answers).length} questions answered
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white font-mono">{Math.round(a.overall_score * 100)}%</p>
                  <p className="text-[11px] text-subtle">{a.flagged_findings.length} findings</p>
                </div>
              </div>

              {/* Domain scores mini bar */}
              <div className="flex gap-1 mt-3">
                {Object.entries(a.domain_scores).map(([domain, data]) => {
                  if (data.excluded) return null;
                  const pct = Math.round(data.score * 100);
                  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : pct >= 40 ? 'bg-orange-500' : 'bg-red-500';
                  return (
                    <div key={domain} className="flex-1" title={`${domain}: ${pct}%`}>
                      <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
