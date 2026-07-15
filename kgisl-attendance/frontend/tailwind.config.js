/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#000000', // Apple Dark Mode background (Pure Black)
          900: '#1C1C1E', // Apple elevated background (Sidebar/Cards)
          850: '#2C2C2E', // Apple lighter elevated (Hover states/Inputs)
          800: '#3A3A3C', // Lighter borders
          700: '#48484A', // Borders/Separators
          600: '#636366', // Muted text/icons
          border: '#3A3A3C', 
        },
        signal: {
          red: '#FF453A', // Apple Dark Mode Red
          redDim: '#331215',
          green: '#32D74B', // Apple Dark Mode Green
          amber: '#FF9F0A', // Apple Dark Mode Orange/Amber
          blue: '#0A84FF', // Apple Dark Mode Blue
        },
        theme: {
          bg: '#000000',
          sidebar: '#1C1C1E',
          card: '#1C1C1E',
          btn: '#2C2C2E',
          'btn-hover': '#3A3A3C',
          border: '#3A3A3C',
          text: '#F5F5F7',
          'text-muted': '#86868B',
          success: '#32D74B',
          warning: '#FF9F0A',
          error: '#FF453A',
        },
      },
      fontFamily: {
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', '"Inter"', 'sans-serif'],
        body: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', '"Inter"', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,69,58,0.25), 0 0 40px -8px rgba(255,69,58,0.45)',
        card: '0 4px 24px -6px rgba(0,0,0,0.5)',
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
        pulseRing: 'pulseRing 2s cubic-bezier(0.32, 0.72, 0, 1) infinite',
      },
    },
  },
  plugins: [],
};
