/** @type {import('tailwindcss').Config} */
const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    colors: {
      current: "currentColor",
      trans: "#1f2937",
      white: "#FFFFFF",
      // black: "#090E34",
      black: "#0f172a",


      dark: "#1D2144",
      primary: "#4A6CF7",
      yellow: "#FBB040",
      grey: "#9ca3af",
      // off: "#e2e8f0",
      off: "#f3f8fc",
      "body-color": "#959CB1",
      // input: "#26325D",
      input: "#334155",
      save: "#4ade80",
      exit: "#ef4444",
      front: "#a5f3fc",
      b300: "#93c5fd",
      b600: "#2563eb",
      // tansparent: "#ffffff",
      primaryop: "#162458",
      green: "#4ade80",
      aaa: "#404040",

      header: "#193A69",
    },
    screens: {
      xs: "450px",

      sm: "575px",

      md: "768px",
      // => @media (min-width: 768px) { ... }

      lg: "992px",
      // => @media (min-width: 992px) { ... }

      xl: "1200px",
      // => @media (min-width: 1200px) { ... }

      "2xl": "1400px",
      // => @media (min-width: 1400px) { ... }
    },
    extend: {

      colors: {
        borderColor: {
          DEFAULT: "#b5bfcb", // light mode
          dark: "#D0D5DD",    // dark mode
        },
      },


      boxShadow: {
        signUp: "0px 5px 10px rgba(4, 10, 34, 0.2)",
        one: "0px 2px 3px rgba(7, 7, 77, 0.05)",
        sticky: "inset 0 -1px 0 0 rgba(0, 0, 0, 0.1)",
        darkshadow: "0 4px 8px rgba(0,0,0,0.8)",
      },
      scrollbar: (theme) => ({
        DEFAULT: {
          "scrollbar-thumb-bg": theme("colors.gray.500"),
          "scrollbar-thumb-hover-bg": theme("colors.gray.600"),
          "scrollbar-width": "thin",
        },
      }),
      keyframes: {
        'pulse-2s': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        'pulse-1s': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
      animation: {
        'pulse-2s': 'pulse-2s 1s ease-in-out 2',
        'pulse-1s': 'pulse-1s 1s ease-in-out 1',
      },
    },
  },
  plugins: [addVariablesForColors, "tailwindcss-scrollbar"],
};
function addVariablesForColors({ addBase, theme }: any) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ":root": newVars,
  });
}
