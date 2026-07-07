/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#080b13',
          900: '#0c101c',
          850: '#101526',
          800: '#141a2e',
          700: '#1b2238',
          600: '#252d47',
          border: '#232a42',
        },
        signal: {
          red: '#e0293f',
          redDim: '#7a1a26',
          green: '#2fd97a',
          amber: '#f2b544',
          blue: '#3d8bff',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(224,41,63,0.25), 0 0 40px -8px rgba(224,41,63,0.45)',
        card: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.95)', opacity: '0.6' },
          '70%': { transform: 'scale(1.15)', opacity: '0' },
          '100%': { transform: 'scale(1.15)', opacity: '0' },
        },
      },
      animation: {
        scanline: 'scanline 2.4s linear infinite',
        pulseRing: 'pulseRing 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
};
