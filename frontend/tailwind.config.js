/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1B2A4A",
        gold: "#C9A84C",
        surface: {
          0: "#09090b",
          1: "#0f0f12",
          2: "#16161a",
          3: "#1c1c21",
          4: "#24242b",
        },
        accent: {
          DEFAULT: "#7c3aed",
          light: "#a78bfa",
          muted: "#7c3aed20",
          border: "#7c3aed30",
          glow: "#7c3aed40",
        },
        muted: "#a1a1aa",
        subtle: "#71717a",
      },
      fontFamily: {
        sans: ['Space Grotesk', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(124, 58, 237, 0.02) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(124, 58, 237, 0.02) 1px, transparent 1px)`,
        'noise': `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
      },
      backgroundSize: {
        'grid': '64px 64px',
      },
    },
  },
  plugins: [],
}
