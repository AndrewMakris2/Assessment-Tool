import { useEffect, useState } from 'react';
import { authFetch } from '../../utils/api';

const RATING_COLORS = { Critical: 'text-red-400', High: 'text-orange-400', Moderate: 'text-amber-400', Low: 'text-emerald-400' };

export default function Dashboard({ onNavigate, token }) {
  const [data, setData] = useState(null);
  const [engagements, setEngagements] = useState([]);

  useEffect(() => {
    authFetch('/admin/analytics', token).then(r => r.json()).then(setData);
    authFetch('/admin/engagements', token).then(r => r.json()).then(setEngagements);
  }, []);

  if (!data) return <div className="text-subtle text-sm py-20 text-center">Loading...</div>;

  const upcoming = engagements.filter(e => e.status !== 'delivered').slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-[-0.02em]">Dashboard</h1>
        <p className="text-sm text-muted mt-1">Overview of your assessment practice</p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-8">
        <StatCard label="Clients" value={data.total_clients} onClick={() => onNavigate('clients')} />
        <StatCard label="Assessments" value={data.total_assessments} onClick={() => onNavigate('assessments')} />
        <StatCard label="Active engagements" value={data.active_engagements} onClick={() => onNavigate('engagements')} />
        <StatCard label="Avg score" value={data.total_assessments > 0
          ? `${Math.round((Object.values(data.industry_scores).reduce((s, i) => s + i.avg_score * i.count, 0) / Math.max(data.total_assessments, 1)) * 100)}%`
          : '—'} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-medium text-subtle uppercase tracking-[0.12em]">Recent assessments</h3>
            <button onClick={() => onNavigate('assessments')} className="text-[11px] text-accent-light hover:underline">View all</button>
          </div>
          {data.recent_assessments.length === 0 ? (
            <p className="text-zinc-600 text-sm py-4 text-center">No assessments yet</p>
          ) : (
            <div className="space-y-2">
              {data.recent_assessments.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div><p className="text-[13px] text-zinc-300">{a.org_name}</p><p className="text-[11px] text-subtle font-mono">{a.assessment_date}</p></div>
                  <div className="text-right"><span className={`text-[12px] font-medium ${RATING_COLORS[a.risk_rating] || 'text-zinc-400'}`}>{a.risk_rating}</span><p className="text-[11px] text-subtle font-mono">{Math.round(a.overall_score * 100)}%</p></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-medium text-subtle uppercase tracking-[0.12em]">Upcoming engagements</h3>
            <button onClick={() => onNavigate('engagements')} className="text-[11px] text-accent-light hover:underline">View all</button>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-zinc-600 text-sm py-4 text-center">No active engagements</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div><p className="text-[13px] text-zinc-300">{e.title}</p><p className="text-[11px] text-subtle">{e.org_name}</p></div>
                  <div className="text-right"><StatusBadge status={e.status} />{e.due_date && <p className="text-[11px] text-subtle font-mono mt-0.5">{e.due_date}</p>}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {data.total_assessments > 0 && (
        <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-5 mt-4">
          <h3 className="text-[11px] font-medium text-subtle uppercase tracking-[0.12em] mb-4">Risk rating distribution</h3>
          <div className="flex gap-3">
            {['Critical', 'High', 'Moderate', 'Low'].map((r) => {
              const count = data.rating_distribution[r] || 0;
              const pct = Math.round((count / data.total_assessments) * 100);
              return (
                <div key={r} className="flex-1 text-center">
                  <div className="h-16 bg-white/[0.02] rounded-lg flex items-end justify-center pb-1 mb-2">
                    <div className={`w-8 rounded-t ${r === 'Critical' ? 'bg-red-500' : r === 'High' ? 'bg-orange-500' : r === 'Moderate' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ height: `${Math.max(pct, 4)}%` }} />
                  </div>
                  <p className="text-[12px] text-zinc-400 font-medium">{r}</p>
                  <p className="text-[11px] text-subtle font-mono">{count}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, onClick }) {
  return (
    <button onClick={onClick} className="border border-white/[0.06] rounded-xl bg-surface-1 p-4 text-left hover:border-white/[0.1] transition-colors">
      <p className="text-[11px] text-subtle uppercase tracking-[0.08em] mb-1">{label}</p>
      <p className="text-2xl font-semibold text-white font-mono tracking-tight">{value}</p>
    </button>
  );
}

function StatusBadge({ status }) {
  const styles = { scheduled: 'text-blue-400 bg-blue-500/10 border-blue-500/20', 'in-progress': 'text-amber-400 bg-amber-500/10 border-amber-500/20', delivered: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${styles[status] || styles.scheduled}`}>{status}</span>;
}
