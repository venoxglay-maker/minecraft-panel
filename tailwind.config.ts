import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        panel: {
          bg: '#0f0f0f',
          card: '#1a1a1a',
          border: '#2d2d2d',
          muted: '#6b6b6b',
          accent: '#8b6914',
          'accent-hover': '#a67c1a',
          green: '#22c55e',
          red: '#ef4444',
          orange: '#f97316',
          purple: '#a855f7',
          blue: '#3b82f6',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
