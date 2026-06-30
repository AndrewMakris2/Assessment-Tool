import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const STATUS_STYLES = {
  scheduled: { label: 'Scheduled', style: 'text-blue-400 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
  'in-progress': { label: 'In progress', style: 'text-amber-400 bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
  delivered: { label: 'Delivered', style: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
};

export default function ClientEngagements({ token }) {
  const [engagements, setEngagements] = useState([]);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/client/engagements`, { headers }).then(r => r.json()).then(setEngagements);
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-[-0.02em]">Engagements</h1>
        <p className="text-sm text-muted mt-1">Active and completed engagements with your assessor</p>
      </div>

      {engagements.length === 0 ? (
        <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-12 text-center">
          <p className="text-zinc-500 text-sm">No engagements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {engagements.map(e => {
            const s = STATUS_STYLES[e.status] || STATUS_STYLES.scheduled;
            const isOverdue = e.due_date && e.status !== 'delivered' && new Date(e.due_date) < new Date();
            return (
              <div key={e.id} className="border border-white/[0.06] rounded-xl bg-surface-1 p-5 hover:border-white/[0.1] transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${s.dot}`} />
                    <div>
                      <h3 className="text-[15px] font-medium text-white">{e.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${s.style}`}>{s.label}</span>
                        {e.due_date && (
                          <span className={`text-[11px] font-mono ${isOverdue ? 'text-red-400' : 'text-subtle'}`}>
                            {isOverdue ? 'Overdue — ' : 'Due '}{e.due_date}
                          </span>
                        )}
                      </div>
                      {e.notes && <p className="text-[12px] text-zinc-500 mt-2">{e.notes}</p>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
