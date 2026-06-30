import { useEffect, useState } from 'react';
import RadarChart from '../RadarChart';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const RATING_COLORS = { Critical: 'bg-red-500', High: 'bg-orange-500', Moderate: 'bg-amber-500', Low: 'bg-emerald-500', 'N/A': 'bg-zinc-600' };

export default function ClientAssessments({ token }) {
  const [assessments, setAssessments] = useState([]);
  const [selected, setSelected] = useState(null);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/client/assessments`, { headers }).then(r => r.json()).then(data => {
      setAssessments(data);
      if (data.length > 0) setSelected(data[0]);
    });
  }, []);

  async function handleDownloadPdf(a) {
    const body = {
      intake: { org_name: a.org_name, industry: '', employee_count: '', contact_name: '', contact_email: '', assessor_name: a.assessor_name || '', assessment_date: a.assessment_date },
      scoring: { domain_scores: a.domain_scores, overall_score: a.overall_score, risk_rating: a.risk_rating, flagged_findings: a.flagged_findings },
      notes: a.notes || {},
    };
    if (a.report) {
      body.report = a.report;
      const res = await fetch(`${API}/export-pdf`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: url, download: `Assessment_${a.assessment_date}.pdf` }).click();
      URL.revokeObjectURL(url);
    } else {
      const res = await fetch(`${API}/export-pdf-fallback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: url, download: `Assessment_${a.assessment_date}.pdf` }).click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-[-0.02em]">Assessments</h1>
        <p className="text-sm text-muted mt-1">{assessments.length} assessment{assessments.length !== 1 ? 's' : ''}</p>
      </div>

      {assessments.length === 0 ? (
        <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-12 text-center">
          <p className="text-zinc-500 text-sm">No assessments have been completed for your organization yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* Assessment list */}
          <div className="col-span-1 space-y-2">
            {assessments.map(a => (
              <button key={a.id} onClick={() => setSelected(a)}
                className={`w-full text-left border rounded-xl p-4 transition-all ${selected?.id === a.id ? 'border-accent/30 bg-accent/5' : 'border-white/[0.06] bg-surface-1 hover:border-white/[0.1]'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-subtle font-mono">{a.assessment_date}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white ${RATING_COLORS[a.risk_rating]}`}>{a.risk_rating}</span>
                </div>
                <p className="text-xl font-bold text-white font-mono">{Math.round(a.overall_score * 100)}%</p>
              </button>
            ))}
          </div>

          {/* Detail view */}
          {selected && (
            <div className="col-span-2 space-y-4">
              <div className="border border-white/[0.06] rounded-xl bg-surface-1 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selected.assessment_date}</h3>
                    <p className="text-[11px] text-subtle font-mono mt-0.5">Assessor: {selected.assessor_name || 'N/A'} &middot; {selected.flagged_findings.length} findings</p>
                  </div>
                  <button onClick={() => handleDownloadPdf(selected)} className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
                    Download PDF
                  </button>
                </div>

                <div className="text-center mb-4">
                  <span className={`inline-block px-4 py-1.5 rounded-full text-white font-bold ${RATING_COLORS[selected.risk_rating]}`}>{selected.risk_rating}</span>
                  <p className="text-3xl font-bold text-white mt-2 font-mono">{Math.round(selected.overall_score * 100)}%</p>
                </div>

                <RadarChart domainScores={selected.domain_scores} />
              </div>

              {/* Domain scores */}
              <div className="border border-white/[0.06] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-2">
                      <th className="text-left px-5 py-3 text-[11px] font-medium text-subtle uppercase tracking-[0.08em]">Domain</th>
                      <th className="text-center px-5 py-3 text-[11px] font-medium text-subtle uppercase tracking-[0.08em]">Score</th>
                      <th className="text-center px-5 py-3 text-[11px] font-medium text-subtle uppercase tracking-[0.08em]">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(selected.domain_scores).map(([domain, data]) => (
                      <tr key={domain} className="border-t border-white/[0.04]">
                        <td className="px-5 py-2.5 text-[13px] text-zinc-300">{domain}</td>
                        <td className="px-5 py-2.5 text-center text-[13px] text-zinc-400 font-mono">{data.excluded ? '—' : `${Math.round(data.score * 100)}%`}</td>
                        <td className="px-5 py-2.5 text-center"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full text-white ${RATING_COLORS[data.rating]}`}>{data.rating}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
