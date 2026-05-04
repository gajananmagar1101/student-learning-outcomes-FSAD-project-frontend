/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'SF Pro Display',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        // Light mode colors
        light: {
          base:    '#ffffff',
          card:    '#f8fafc',
          card2:   '#f1f5f9',
          hover:   '#e2e8f0',
          border:  '#cbd5e1',
          accent:  { DEFAULT: '#6366f1', hover: '#4f46e5' },
          ink:     { primary: '#0f172a', secondary: '#475569', muted: '#64748b' },
        },
        // Dark mode colors (renamed from original)
        dark: {
          base:    '#0f172a',
          card:    '#1e293b',
          card2:   '#263348',
          hover:   '#2d3f57',
          border:  '#334155',
          accent:  { DEFAULT: '#6366f1', hover: '#4f46e5' },
          ink:     { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b' },
        },
        // Legacy colors for backward compatibility
        base:    '#0f172a',
        card:    '#1e293b',
        card2:   '#263348',
        hover:   '#2d3f57',
        border:  '#334155',
        accent:  { DEFAULT: '#6366f1', hover: '#4f46e5' },
        ink:     { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b' },
      },
      boxShadow: {
        card:  '0 4px 24px rgba(0,0,0,0.3)',
        glow:  '0 0 20px rgba(99,102,241,0.3)',
        'glow-sm': '0 0 10px rgba(99,102,241,0.2)',
      },
    },
  },
  plugins: [],
}
