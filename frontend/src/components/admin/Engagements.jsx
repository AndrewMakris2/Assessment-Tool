import { useEffect, useState } from 'react';
import { authFetch } from '../../utils/api';
const STATUSES = ['scheduled', 'in-progress', 'delivered'];
const STATUS_STYLES = {
  scheduled: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'in-progress': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  delivered: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

export default function Engagements({ token }) {
  const [engagements, setEngagements] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());

  function emptyForm() { return { client_id: '', title: '', status: 'scheduled', due_date: '', billing_notes: '', notes: '' }; }

  useEffect(() => {
    load();
    authFetch('/admin/clients', token).then(r => r.json()).then(setClients);
  }, []);

  function load() {
    authFetch('/admin/engagements', token).then(r => r.json()).then(setEngagements);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await authFetch('/admin/engagements', token, { method: 'POST', body: JSON.stringify(form) });
    setShowForm(false);
    setForm(emptyForm());
    load();
  }

  async function updateStatus(id, status) {
    await authFetch(`/admin/engagements/${id}`, token, { method: 'PUT', body: JSON.stringify({ status }) });
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this engagement?')) return;
    await authFetch(`/admin/engagements/${id}`, token, { method: 'DELETE' });
    load();
  }

  const inputClass = "w-full px-3 py-2 bg-surface-0 border border-white/[0.08] rounded-lg text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-accent/50 transition-colors";

  const grouped = { scheduled: [], 'in-progress': [], delivered: [] };
  engagements.forEach(e => { (grouped[e.status] || grouped.scheduled).push(e); });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-[-0.02em]">Engagements</h1>
          <p className="text-sm text-muted mt-1">{engagements.length} total &middot; {grouped['in-progress'].length} in progress</p>
        </div>
        <button onClick={() => { setShowForm(true); setForm(emptyForm()); }} className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
          Add engagement
        </button>
      </div>

      {showForm && (
        <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-6 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <select className={inputClass} value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} required>
              <option value="">Select client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.org_name}</option>)}
            </select>
            <input className={inputClass} placeholder="Engagement title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            <select className={inputClass} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input className={inputClass} type="date" placeholder="Due date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
            <input className={inputClass} placeholder="Billing notes" value={form.billing_notes} onChange={e => setForm({...form, billing_notes: e.target.value})} />
            <input className={inputClass} placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted border border-white/[0.08] rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors">Create</button>
            </div>
          </form>
        </div>
      )}

      {engagements.length === 0 ? (
        <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-12 text-center">
          <p className="text-zinc-500 text-sm">No engagements yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {STATUSES.map(status => {
            const items = grouped[status];
            if (items.length === 0) return null;
            return (
              <div key={status}>
                <h3 className="text-[11px] font-medium text-subtle uppercase tracking-[0.12em] mb-2 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${status === 'scheduled' ? 'bg-blue-400' : status === 'in-progress' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  {status} ({items.length})
                </h3>
                <div className="space-y-2">
                  {items.map(e => (
                    <div key={e.id} className="border border-white/[0.06] rounded-xl bg-surface-1 p-4 flex items-center justify-between hover:border-white/[0.1] transition-colors">
                      <div>
                        <p className="text-[14px] text-zinc-200 font-medium">{e.title}</p>
                        <p className="text-[11px] text-subtle mt-0.5">
                          {e.org_name}
                          {e.due_date && <> &middot; Due {e.due_date}</>}
                          {e.billing_notes && <> &middot; {e.billing_notes}</>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {STATUSES.filter(s => s !== status).map(s => (
                          <button key={s} onClick={() => updateStatus(e.id, s)} className="text-[10px] text-subtle hover:text-white border border-white/[0.06] px-2 py-1 rounded transition-colors">
                            → {s}
                          </button>
                        ))}
                        <button onClick={() => handleDelete(e.id)} className="text-[10px] text-subtle hover:text-red-400 transition-colors ml-1">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
