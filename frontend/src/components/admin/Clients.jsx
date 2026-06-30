import { useEffect, useState } from 'react';
import { API, authFetch, authHeaders } from '../../utils/api';

const INDUSTRIES = ['Healthcare', 'Finance', 'Legal', 'Manufacturing', 'Retail', 'Other'];
const SIZES = ['1-25', '26-100', '101-500', '500+'];

export default function Clients({ onNavigate, token }) {
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());

  function emptyForm() { return { org_name: '', industry: '', employee_count: '', contact_name: '', contact_email: '', phone: '', address: '', notes: '' }; }

  useEffect(() => { loadClients(); }, []);

  function loadClients() {
    authFetch('/admin/clients', token).then(r => r.json()).then(setClients);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editing) {
      await authFetch(`/admin/clients/${editing}`, token, { method: 'PUT', body: JSON.stringify(form) });
    } else {
      await authFetch('/admin/clients', token, { method: 'POST', body: JSON.stringify(form) });
    }
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm());
    loadClients();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this client and all their data?')) return;
    await authFetch(`/admin/clients/${id}`, token, { method: 'DELETE' });
    loadClients();
  }

  function startEdit(c) {
    setForm({ org_name: c.org_name, industry: c.industry, employee_count: c.employee_count, contact_name: c.contact_name, contact_email: c.contact_email, phone: c.phone || '', address: c.address || '', notes: c.notes || '' });
    setEditing(c.id);
    setShowForm(true);
  }

  const inputClass = "w-full px-3 py-2 bg-surface-0 border border-white/[0.08] rounded-lg text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-accent/50 transition-colors";

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-[-0.02em]">Clients</h1>
          <p className="text-sm text-muted mt-1">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm()); }} className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
          Add client
        </button>
      </div>

      {showForm && (
        <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-6 mb-6">
          <h3 className="text-sm font-medium text-white mb-4">{editing ? 'Edit client' : 'New client'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <input className={inputClass} placeholder="Organization name" value={form.org_name} onChange={e => setForm({...form, org_name: e.target.value})} required />
            <select className={inputClass} value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} required>
              <option value="">Industry</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <select className={inputClass} value={form.employee_count} onChange={e => setForm({...form, employee_count: e.target.value})} required>
              <option value="">Employees</option>
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input className={inputClass} placeholder="Contact name" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} required />
            <input className={inputClass} placeholder="Contact email" type="email" value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})} required />
            <input className={inputClass} placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            <input className={`${inputClass} col-span-2`} placeholder="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
            <textarea className={`${inputClass} col-span-2`} rows={2} placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 text-sm text-muted border border-white/[0.08] rounded-lg hover:text-white transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors">{editing ? 'Save' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      {clients.length === 0 ? (
        <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-12 text-center">
          <p className="text-zinc-500 text-sm mb-3">No clients yet</p>
          <button onClick={() => setShowForm(true)} className="text-accent-light text-sm hover:underline">Add your first client</button>
        </div>
      ) : (
        <div className="border border-white/[0.06] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-2">
                <th className="text-left px-5 py-3 text-[11px] font-medium text-subtle uppercase tracking-[0.08em]">Organization</th>
                <th className="text-left px-5 py-3 text-[11px] font-medium text-subtle uppercase tracking-[0.08em]">Industry</th>
                <th className="text-left px-5 py-3 text-[11px] font-medium text-subtle uppercase tracking-[0.08em]">Contact</th>
                <th className="text-left px-5 py-3 text-[11px] font-medium text-subtle uppercase tracking-[0.08em]">Size</th>
                <th className="text-right px-5 py-3 text-[11px] font-medium text-subtle uppercase tracking-[0.08em]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-t border-white/[0.04] hover:bg-white/[0.01] transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-[13px] text-zinc-200 font-medium">{c.org_name}</p>
                    {c.notes && <p className="text-[11px] text-subtle mt-0.5 truncate max-w-[200px]">{c.notes}</p>}
                  </td>
                  <td className="px-5 py-3 text-[13px] text-zinc-400">{c.industry}</td>
                  <td className="px-5 py-3">
                    <p className="text-[13px] text-zinc-300">{c.contact_name}</p>
                    <p className="text-[11px] text-subtle">{c.contact_email}</p>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-zinc-400 font-mono">{c.employee_count}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <InviteButton clientId={c.id} email={c.contact_email} name={c.contact_name} token={token} />
                      <button onClick={() => startEdit(c)} className="text-[11px] text-subtle hover:text-white transition-colors">Edit</button>
                      <button onClick={() => handleDelete(c.id)} className="text-[11px] text-subtle hover:text-red-400 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InviteButton({ clientId, email, name, token }) {
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);

  async function generateInvite() {
    const res = await authFetch('/admin/invites', token, {
      method: 'POST', body: JSON.stringify({ client_id: clientId, email, name }),
    });
    const data = await res.json();
    const url = `${window.location.origin}?invite=${data.token}`;
    setLink(url);
    navigator.clipboard.writeText(url).then(() => setCopied(true));
    setTimeout(() => setCopied(false), 3000);
  }

  if (link) {
    return <span className="text-[11px] text-emerald-400">{copied ? 'Link copied!' : 'Invite sent'}</span>;
  }

  return (
    <button onClick={generateInvite} className="text-[11px] text-accent-light hover:text-white transition-colors">
      Invite
    </button>
  );
}
