import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
      backgroundImage: {
        'grad-purple': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'grad-indigo': 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)',
      },
      boxShadow: {
        'glow-sm': '0 0 20px 4px rgba(99,102,241,0.2)',
        'glow-md': '0 0 60px 12px rgba(99,102,241,0.18)',
        'glow-lg': '0 0 100px 30px rgba(99,102,241,0.15)',
      },
    },
  },
  plugins: [],
}
export default config
