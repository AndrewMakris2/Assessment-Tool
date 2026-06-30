import { useState } from 'react';

const SEVERITY_COLORS = {
  Critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  High: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Low: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
};
const EFFORT_LABELS = { Low: 'Quick win', Medium: 'Moderate effort', High: 'Long-term project' };

export default function DomainStep({
  domain, domainIndex, totalDomains, questions, answers, notes,
  onAnswer, onNote, onNext, onBack, totalAnswered, totalQuestions, industry,
}) {
  const allAnswered = questions.every((q) => answers[q.id]);
  const domainAnswered = questions.filter((q) => answers[q.id]).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-[11px] text-subtle font-mono uppercase tracking-wider">
            Domain {domainIndex + 1} of {totalDomains}
          </span>
          <span className="text-[11px] text-subtle font-mono">
            {totalAnswered}/{totalQuestions} total
          </span>
        </div>
        <div className="w-full bg-white/[0.04] rounded-full h-1 overflow-hidden">
          <div
            className="bg-accent h-1 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(totalAnswered / totalQuestions) * 100}%` }}
          />
        </div>
        <p className="text-[11px] text-subtle mt-1.5 font-mono">{domainAnswered}/{questions.length} in this domain</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white tracking-[-0.01em]">{domain}</h2>
      </div>

      <div className="space-y-3">
        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            selectedAnswer={answers[q.id]}
            note={notes[q.id] || ''}
            onAnswer={onAnswer}
            onNote={onNote}
            industry={industry}
          />
        ))}
      </div>

      <div className="flex justify-between mt-8 pt-6 border-t border-white/[0.06]">
        <button type="button" onClick={onBack} className="px-5 py-2 text-sm text-muted hover:text-white border border-white/[0.08] rounded-lg hover:border-white/[0.15] hover:bg-white/[0.03] transition-all duration-200">
          Back
        </button>
        <div className="relative group">
          <button
            type="button" onClick={onNext} disabled={!allAnswered}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${allAnswered ? 'bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20' : 'bg-white/[0.04] text-zinc-600 cursor-not-allowed'}`}
          >
            {domainIndex === totalDomains - 1 ? 'Review Results' : 'Next Domain'}
          </button>
          {!allAnswered && (
            <div role="tooltip" className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-surface-3 border border-white/[0.08] text-zinc-400 text-[11px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Answer all questions to continue
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionCard({ question, selectedAnswer, note, onAnswer, onNote, industry }) {
  const [showNote, setShowNote] = useState(!!note);
  const [naWarning, setNaWarning] = useState('');
  const q = question;
  const industryHint = industry && q.smb_context?.[industry];
  const sevColors = SEVERITY_COLORS[q.severity] || SEVERITY_COLORS.Medium;

  function handleAnswer(label) {
    if (label === 'N/A' && q.na_restricted?.includes(industry)) {
      setNaWarning(`N/A requires justification for ${industry} organizations. Please add a note explaining why this control does not apply.`);
      setShowNote(true);
    } else {
      setNaWarning('');
    }
    onAnswer(q.id, label);
  }

  return (
    <div className="border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.1] transition-colors duration-200" role="group" aria-labelledby={`q-${q.id}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <p id={`q-${q.id}`} className="text-[14px] text-zinc-200 leading-relaxed flex-1">
          <span className="text-accent-light font-mono text-[12px] mr-1.5">{q.id}</span>
          {q.question}
        </p>
        <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${sevColors}`}>{q.severity}</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border text-zinc-500 bg-white/[0.02] border-white/[0.06]">{EFFORT_LABELS[q.effort] || q.effort}</span>
        </div>
      </div>

      {industryHint && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-accent/[0.04] border border-accent/10">
          <p className="text-[11px] text-accent-light leading-relaxed">
            <span className="font-medium">{industry}:</span> {industryHint}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5" role="radiogroup" aria-labelledby={`q-${q.id}`}>
        {q.answers.map((a) => {
          const selected = selectedAnswer === a.label;
          return (
            <button
              key={a.label} type="button" role="radio" aria-checked={selected}
              aria-label={`${a.label} for ${q.id}`}
              onClick={() => handleAnswer(a.label)}
              className={`px-2.5 py-2 rounded-lg text-[12px] font-medium border transition-all duration-150 ${selected ? 'bg-accent/15 text-accent-light border-accent/30' : 'bg-transparent text-zinc-500 border-white/[0.06] hover:border-white/[0.12] hover:text-zinc-400'}`}
            >
              {a.label}
            </button>
          );
        })}
      </div>

      {naWarning && (
        <div className="mt-2 px-3 py-2 rounded-lg bg-amber-500/[0.06] border border-amber-500/15">
          <p className="text-[11px] text-amber-400">{naWarning}</p>
        </div>
      )}

      <div className="mt-3">
        {!showNote ? (
          <button type="button" onClick={() => setShowNote(true)} className="text-[11px] text-subtle hover:text-accent-light transition-colors">+ Add note</button>
        ) : (
          <textarea
            aria-label={`Notes for ${q.id}`}
            className="w-full mt-1 px-3 py-2 text-[13px] bg-surface-0 border border-white/[0.06] rounded-lg text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-accent/30 resize-none transition-colors"
            rows={2} placeholder="Add context or notes..." value={note}
            onChange={(e) => onNote(q.id, e.target.value)}
          />
        )}
      </div>
    </div>
  );
}
