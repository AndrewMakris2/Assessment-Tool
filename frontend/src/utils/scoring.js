import { QUESTIONS } from '../data/questions';

export function calculateScores(answers) {
  const domainMap = {};
  for (const q of QUESTIONS) {
    if (!domainMap[q.domain]) domainMap[q.domain] = [];
    domainMap[q.domain].push(q);
  }

  const domainScores = {};
  const flaggedFindings = [];

  for (const [domain, questions] of Object.entries(domainMap)) {
    let weightedSum = 0;
    let weightTotal = 0;

    for (const q of questions) {
      const label = answers[q.id];
      if (!label) continue;
      const ans = q.answers.find((a) => a.label === label);
      if (!ans || ans.score === null) continue;

      weightedSum += ans.score * q.weight;
      weightTotal += q.weight;

      if (q.flag_if && label === q.flag_if) {
        flaggedFindings.push({ id: q.id, domain, question: q.question, answer: label });
      }
    }

    if (weightTotal === 0) {
      domainScores[domain] = { score: null, rating: 'N/A', excluded: true };
    } else {
      const score = weightedSum / weightTotal;
      domainScores[domain] = { score: Math.round(score * 10000) / 10000, rating: getRating(score), excluded: false };
    }
  }

  const scored = Object.values(domainScores).filter((d) => !d.excluded);
  const overallScore = scored.length ? Math.round((scored.reduce((s, d) => s + d.score, 0) / scored.length) * 10000) / 10000 : 0;

  return { domain_scores: domainScores, overall_score: overallScore, risk_rating: getRating(overallScore), flagged_findings: flaggedFindings };
}

export function getRating(score) {
  if (score < 0.4) return 'Critical';
  if (score < 0.6) return 'High';
  if (score < 0.8) return 'Moderate';
  return 'Low';
}

export const RATING_COLORS = {
  Critical: 'bg-red-500',
  High: 'bg-orange-500',
  Moderate: 'bg-amber-500',
  Low: 'bg-emerald-500',
  'N/A': 'bg-zinc-600',
};

export const RATING_TEXT_COLORS = {
  Critical: 'text-red-400',
  High: 'text-orange-400',
  Moderate: 'text-amber-400',
  Low: 'text-emerald-400',
  'N/A': 'text-zinc-500',
};
