import { useEffect, useState } from 'react';
import { QUESTIONS } from '../../data/questions';
import { authFetch } from '../../utils/api';

export default function Analytics({ token }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    authFetch('/admin/analytics', token).then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="text-subtle text-sm py-20 text-center">Loading...</div>;

  const questionMap = {};
  QUESTIONS.forEach(q => { questionMap[q.id] = q.question; });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-[-0.02em]">Analytics</h1>
        <p className="text-sm text-muted mt-1">Aggregate insights across all assessments</p>
      </div>

      {data.total_assessments === 0 ? (
        <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-12 text-center">
          <p className="text-zinc-500 text-sm">Complete and save assessments to see analytics</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard label="Total clients" value={data.total_clients} />
            <StatCard label="Total assessments" value={data.total_assessments} />
            <StatCard label="Active engagements" value={data.active_engagements} />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Industry avg scores */}
            <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-5">
              <h3 className="text-[11px] font-medium text-subtle uppercase tracking-[0.12em] mb-4">Average score by industry</h3>
              {Object.keys(data.industry_scores).length === 0 ? (
                <p className="text-zinc-600 text-sm">No data</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(data.industry_scores).map(([industry, info]) => {
                    const pct = Math.round(info.avg_score * 100);
                    const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : pct >= 40 ? 'bg-orange-500' : 'bg-red-500';
                    return (
                      <div key={industry}>
                        <div className="flex justify-between mb-1">
                          <span className="text-[13px] text-zinc-300">{industry}</span>
                          <span className="text-[12px] text-zinc-400 font-mono">{pct}% ({info.count})</span>
                        </div>
                        <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Rating distribution */}
            <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-5">
              <h3 className="text-[11px] font-medium text-subtle uppercase tracking-[0.12em] mb-4">Risk rating distribution</h3>
              <div className="space-y-2">
                {['Critical', 'High', 'Moderate', 'Low'].map(r => {
                  const count = data.rating_distribution[r] || 0;
                  const pct = Math.round((count / data.total_assessments) * 100);
                  const colors = { Critical: 'bg-red-500', High: 'bg-orange-500', Moderate: 'bg-amber-500', Low: 'bg-emerald-500' };
                  return (
                    <div key={r}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[13px] text-zinc-300">{r}</span>
                        <span className="text-[12px] text-zinc-400 font-mono">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${colors[r]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top failures */}
          <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-5">
            <h3 className="text-[11px] font-medium text-subtle uppercase tracking-[0.12em] mb-4">Most common failures</h3>
            {data.top_failures.length === 0 ? (
              <p className="text-zinc-600 text-sm">No findings yet</p>
            ) : (
              <div className="space-y-2">
                {data.top_failures.map(({ id, count }, i) => {
                  const maxCount = data.top_failures[0].count;
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <div key={id} className="flex items-center gap-3">
                      <span className="text-[11px] text-subtle font-mono w-10 flex-shrink-0">{id}</span>
                      <div className="flex-1">
                        <div className="h-5 bg-white/[0.02] rounded overflow-hidden relative">
                          <div className="h-full bg-red-500/20 rounded" style={{ width: `${pct}%` }} />
                          <span className="absolute inset-y-0 left-2 flex items-center text-[11px] text-zinc-400 truncate pr-8">
                            {questionMap[id] || id}
                          </span>
                        </div>
                      </div>
                      <span className="text-[12px] text-zinc-400 font-mono w-6 text-right flex-shrink-0">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-4">
      <p className="text-[11px] text-subtle uppercase tracking-[0.08em] mb-1">{label}</p>
      <p className="text-2xl font-semibold text-white font-mono tracking-tight">{value}</p>
    </div>
  );
}
