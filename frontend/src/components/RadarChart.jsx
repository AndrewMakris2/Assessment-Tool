export default function RadarChart({ domainScores }) {
  const entries = Object.entries(domainScores).filter(([, d]) => !d.excluded);
  if (entries.length < 3) return null;

  const n = entries.length;
  const cx = 200, cy = 200, r = 140;
  const levels = [0.25, 0.5, 0.75, 1.0];

  function polar(angle, radius) {
    const a = angle - Math.PI / 2;
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
  }

  const step = (2 * Math.PI) / n;
  const grid = levels.map((l) => Array.from({ length: n }, (_, i) => polar(i * step, r * l).join(',')).join(' '));
  const data = entries.map(([, d], i) => polar(i * step, r * (d.score ?? 0)));
  const labels = entries.map(([name], i) => ({ name: SHORT[name] || name.split(' ')[0], ...xyObj(polar(i * step, r + 28)) }));

  return (
    <div className="flex justify-center">
      <svg viewBox="0 0 400 400" className="w-full max-w-sm" role="img" aria-label="Domain score radar">
        <defs>
          <linearGradient id="rf" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {grid.map((pts, i) => (
          <polygon key={i} points={pts} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
        {entries.map((_, i) => {
          const [x, y] = polar(i * step, r);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />;
        })}

        <polygon points={data.map((p) => p.join(',')).join(' ')} fill="url(#rf)" stroke="#7c3aed" strokeWidth="1.5" />

        {data.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#a78bfa" />
        ))}

        {labels.map(({ name, x, y }, i) => (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#71717a" fontSize="10" fontFamily="Space Grotesk, sans-serif">
            {name}
          </text>
        ))}

        {levels.map((l) => {
          const [x, y] = polar(0, r * l);
          return <text key={l} x={x + 8} y={y} fill="#3f3f46" fontSize="8" dominantBaseline="middle" fontFamily="JetBrains Mono, monospace">{Math.round(l * 100)}%</text>;
        })}
      </svg>
    </div>
  );
}

function xyObj([x, y]) { return { x, y }; }

const SHORT = {
  'Asset Management': 'Assets',
  'Access Control & IAM': 'Access',
  'Vulnerability Management': 'Vuln Mgmt',
  'Data Protection & Backup': 'Data',
  'Incident Response': 'Incident',
  'Vendor & Third-Party Risk': 'Vendor',
  'Compliance & Regulatory': 'Compliance',
  'Physical Security': 'Physical',
  'Security Awareness & Training': 'Training',
};
