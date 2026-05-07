/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "secondary-fixed-dim": "#a9c7ff",
        "surface-dim": "#dadada",
        "surface-container-highest": "#e2e2e2",
        "inverse-surface": "#2f3131",
        "inverse-on-surface": "#f1f1f1",
        "on-error-container": "#93000a",
        "tertiary-fixed": "#a1efff",
        "primary-container": "#0077ce",
        "primary-fixed-dim": "#a2c9ff",
        "secondary-fixed": "#d6e3ff",
        "error-container": "#ffdad6",
        "on-secondary-fixed": "#001b3d",
        "error": "#ba1a1a",
        "on-background": "#1a1c1c",
        "tertiary-fixed-dim": "#44d8f1",
        "tertiary": "#006673",
        "on-secondary-container": "#003670",
        "background": "#f9f9f9",
        "primary-fixed": "#d3e4ff",
        "surface-container": "#eeeeee",
        "primary": "#005ea4",
        "on-primary": "#ffffff",
        "on-primary-container": "#fdfcff",
        "surface-container-low": "#f3f3f3",
        "surface-container-high": "#e8e8e8",
        "surface": "#f9f9f9",
        "on-tertiary": "#ffffff",
        "on-tertiary-fixed": "#001f25",
        "on-tertiary-container": "#f8fdff",
        "on-primary-fixed": "#001c38",
        "on-surface": "#1a1c1c",
        "secondary": "#005db7",
        "surface-variant": "#e2e2e2",
        "outline-variant": "#c0c7d4",
        "on-surface-variant": "#404752",
        "tertiary-container": "#008091",
        "secondary-container": "#64a1ff",
        "surface-tint": "#0060a8",
        "inverse-primary": "#a2c9ff",
        "surface-bright": "#f9f9f9",
        "on-primary-fixed-variant": "#004881",
        "on-error": "#ffffff",
        "on-tertiary-fixed-variant": "#004e59",
        "surface-container-lowest": "#ffffff",
        "outline": "#707783",
        "on-secondary-fixed-variant": "#00468c",
        "on-secondary": "#ffffff"
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px"
      },
      fontFamily: {
        headline: ["Plus Jakarta Sans", "sans-serif"],
        body: ["Be Vietnam Pro", "sans-serif"],
        label: ["Be Vietnam Pro", "sans-serif"]
      },
      // Si quieres mantener las fuentes que ya usas, cambia los valores de fontFamily por:
      // headline: ["Bricolage Grotesque", "sans-serif"],
      // body: ["Nunito", "sans-serif"],
    }
  },
  plugins: []
}