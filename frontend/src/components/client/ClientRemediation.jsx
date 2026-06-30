import { useEffect, useState } from 'react';
import { QUESTIONS } from '../../data/questions';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const questionMap = {};
QUESTIONS.forEach(q => { questionMap[q.id] = q; });

const SEV_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const SEV_STYLES = {
  Critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  High: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Low: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
};

export default function ClientRemediation({ token }) {
  const [assessments, setAssessments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [items, setItems] = useState([]);
  const [findings, setFindings] = useState([]);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/client/assessments`, { headers }).then(r => r.json()).then(data => {
      setAssessments(data);
      if (data.length > 0) {
        setSelectedId(data[0].id);
        setFindings(data[0].flagged_findings);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`${API}/client/remediation/${selectedId}`, { headers }).then(r => r.json()).then(setItems);
    const a = assessments.find(a => a.id === selectedId);
    if (a) setFindings(a.flagged_findings);
  }, [selectedId]);

  async function updateItem(itemId, status, note) {
    await fetch(`${API}/client/remediation/${itemId}`, {
      method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, client_note: note || '' }),
    });
    const updated = await fetch(`${API}/client/remediation/${selectedId}`, { headers }).then(r => r.json());
    setItems(updated);
  }

  const fixed = items.filter(i => i.status === 'fixed').length;
  const total = items.length;
  const pct = total > 0 ? Math.round((fixed / total) * 100) : 0;

  const enriched = items.map(item => {
    const finding = findings.find(f => f.id === item.question_id);
    const q = questionMap[item.question_id];
    return { ...item, finding, question: q };
  }).sort((a, b) => {
    if (a.status === 'fixed' && b.status !== 'fixed') return 1;
    if (a.status !== 'fixed' && b.status === 'fixed') return -1;
    const sevA = SEV_ORDER[a.finding?.severity || a.question?.severity || 'Medium'] ?? 99;
    const sevB = SEV_ORDER[b.finding?.severity || b.question?.severity || 'Medium'] ?? 99;
    return sevA - sevB;
  });

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-[-0.02em]">Remediation tracker</h1>
          <p className="text-sm text-muted mt-1">Track progress on fixing identified security gaps</p>
        </div>
        {assessments.length > 1 && (
          <select className="px-3 py-2 bg-surface-0 border border-white/[0.08] rounded-lg text-white text-sm" value={selectedId || ''} onChange={e => setSelectedId(e.target.value)}>
            {assessments.map(a => <option key={a.id} value={a.id}>{a.assessment_date} ({a.risk_rating})</option>)}
          </select>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-5 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[13px] text-zinc-300">Progress</span>
            <span className="text-[13px] text-white font-mono font-medium">{fixed}/{total} fixed ({pct}%)</span>
          </div>
          <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-600 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {total === 0 ? (
        <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-12 text-center">
          <p className="text-zinc-500 text-sm">No findings to remediate — great job!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {enriched.map(item => {
            const sev = item.finding?.severity || item.question?.severity || 'Medium';
            const isFixed = item.status === 'fixed';
            return (
              <div key={item.id} className={`border rounded-xl p-4 transition-all ${isFixed ? 'border-emerald-500/15 bg-emerald-500/[0.02]' : 'border-white/[0.06] bg-surface-1'}`}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => updateItem(item.id, isFixed ? 'open' : 'fixed', item.client_note)}
                    className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                      isFixed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/[0.15] hover:border-accent/50'
                    }`}
                  >
                    {isFixed && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] text-subtle font-mono">{item.question_id}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${SEV_STYLES[sev]}`}>{sev}</span>
                      {item.question?.effort && <span className="text-[10px] text-zinc-600 bg-white/[0.02] border border-white/[0.06] px-1.5 py-0.5 rounded">{item.question.effort === 'Low' ? 'Quick win' : item.question.effort === 'High' ? 'Long-term' : 'Moderate'}</span>}
                    </div>
                    <p className={`text-[13px] leading-relaxed ${isFixed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                      {item.finding?.question || item.question?.question || item.question_id}
                    </p>
                    {(item.finding?.fix_hint || item.question?.fix_hint) && !isFixed && (
                      <p className="text-[11px] text-subtle mt-1.5 leading-relaxed">{item.finding?.fix_hint || item.question?.fix_hint}</p>
                    )}

                    {/* Client note */}
                    <NoteInput
                      value={item.client_note}
                      onSave={(note) => updateItem(item.id, item.status, note)}
                    />
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

function NoteInput({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value || '');

  if (!editing && !value) {
    return <button onClick={() => setEditing(true)} className="text-[11px] text-subtle hover:text-accent-light transition-colors mt-1">+ Add note</button>;
  }

  if (!editing) {
    return (
      <div className="mt-1.5 flex items-start gap-2">
        <p className="text-[11px] text-zinc-500 italic flex-1">{value}</p>
        <button onClick={() => { setText(value); setEditing(true); }} className="text-[10px] text-subtle hover:text-white">Edit</button>
      </div>
    );
  }

  return (
    <div className="mt-2 flex gap-2">
      <input className="flex-1 px-2 py-1.5 bg-surface-0 border border-white/[0.08] rounded text-[12px] text-white placeholder-zinc-600 focus:outline-none focus:border-accent/40" placeholder="Add a note..." value={text} onChange={e => setText(e.target.value)} />
      <button onClick={() => { onSave(text); setEditing(false); }} className="text-[10px] text-accent-light hover:underline">Save</button>
      <button onClick={() => setEditing(false)} className="text-[10px] text-subtle hover:text-white">Cancel</button>
    </div>
  );
}
