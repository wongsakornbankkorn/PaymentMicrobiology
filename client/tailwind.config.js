/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          primary: "#0066cc",
          "primary-focus": "#0071e3",
          "primary-dark": "#2997ff",
          ink: "#1d1d1f",
          "ink-muted": "#333333",
          "ink-subtle": "#7a7a7a",
          "divider-soft": "#f0f0f0",
          hairline: "#e0e0e0",
          canvas: "#ffffff",
          parchment: "#f5f5f7",
          pearl: "#fafafc",
          "tile-dark": "#272729",
          "tile-dark-2": "#2a2a2c",
          "tile-dark-3": "#252527",
          black: "#000000",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#ef4444"
        }
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"Inter"',
          "system-ui",
          "sans-serif"
        ],
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"Inter"',
          "system-ui",
          "sans-serif"
        ]
      },
      borderRadius: {
        'xs': '5px',
        'sm': '8px',
        'md': '11px',
        'lg': '18px',
        'pill': '9999px'
      },
      boxShadow: {
        'apple-product': '3px 5px 30px rgba(0, 0, 0, 0.12)',
        'apple-card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)'
      },
      letterSpacing: {
        'apple-tight': '-0.022em',
        'apple-display': '-0.028em'
      }
    },
  },
  plugins: [],
};
