import flowbitePlugin from "flowbite/plugin";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,svelte,ts}",
    "./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}",
    "./node_modules/flowbite-svelte-icons/**/*.{html,js,svelte,ts}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Theme primário personalizado (blue) - mantido
        primary: {
          50: "#ebf5ff",
          100: "#e1effe",
          200: "#c3ddfd",
          300: "#a4cafe",
          400: "#76a9fa",
          500: "#3f83f8",
          600: "#1c64f2",
          700: "#1a56db",
          800: "#1e429f",
          900: "#233876",
          950: "#19295A",
        },

        // Paleta Gray Personalizada
        gray: {
          50: "#f9fafb",
          100: "#f1f2f4",
          200: "#e1e5ea",
          300: "#b9c1cc",
          400: "#8894a9",
          500: "#535d72",
          600: "#424a5c",
          700: "#31384a",
          800: "#252937",
          900: "#1c1e29",
          950: "#1b1e28",
        },

        // Paleta Red Personalizada (Error)
        red: {
          50: "#fdf2f2",
          100: "#fde8e8",
          200: "#fbd5d5",
          300: "#f8b4b4",
          400: "#ff737c",
          500: "#ff4563",
          600: "#db324e",
          700: "#b72247",
          800: "#93163b",
          900: "#7a0d31",
          950: "#5f0827",
        },

        // Paleta Yellow Personalizada (Warning)
        yellow: {
          50: "#fdfdea",
          100: "#fdf6b2",
          200: "#fee688",
          300: "#fdc96a",
          400: "#fdaf39",
          500: "#d98c29",
          600: "#b66c1c",
          700: "#924f12",
          800: "#633112",
          900: "#633112",
          950: "#4a240d",
        },

        // Paleta Green Personalizada (Success)
        green: {
          50: "#e7fef4",
          100: "#cafce6",
          200: "#96fad7",
          300: "#60f2cc",
          400: "#1cd8b9",
          500: "#00b8aa",
          600: "#00a6a8",
          700: "#008898",
          800: "#00627a",
          900: "#004865",
          950: "#003550",
        },

        // Paleta Orange Personalizada
        orange: {
          50: "#fff8f1",
          100: "#feecdc",
          200: "#fcd9bd",
          300: "#fdba8c",
          400: "#ff8a4c",
          500: "#ff5a1f",
          600: "#d03801",
          700: "#b43403",
          800: "#8a2c0d",
          900: "#771d1d",
          950: "#5c1516",
        },

        // Paleta Teal Personalizada
        teal: {
          50: "#edfafa",
          100: "#d5f5f6",
          200: "#afecef",
          300: "#7edce2",
          400: "#16bdca",
          500: "#0694a2",
          600: "#047481",
          700: "#036672",
          800: "#05505c",
          900: "#014451",
          950: "#01363e",
        },

        // Paleta Indigo Personalizada
        indigo: {
          50: "#f0f5ff",
          100: "#e5edff",
          200: "#cddbfe",
          300: "#b4c6fc",
          400: "#8da2fb",
          500: "#6875f5",
          600: "#5850ec",
          700: "#5145cd",
          800: "#42389d",
          900: "#362f78",
          950: "#2a2560",
        },

        // Paleta Purple Personalizada
        purple: {
          50: "#f6f5ff",
          100: "#edebfe",
          200: "#dcd7fe",
          300: "#cabffd",
          400: "#ac94fa",
          500: "#9061f9",
          600: "#7e3af2",
          700: "#6c2bd9",
          800: "#5521b5",
          900: "#4a1d96",
          950: "#3b1679",
        },

        // Paleta Pink Personalizada
        pink: {
          50: "#fdf2f8",
          100: "#fce8f3",
          200: "#fad1e8",
          300: "#f8b4d9",
          400: "#f17eb8",
          500: "#e74694",
          600: "#d61f69",
          700: "#bf125d",
          800: "#99154b",
          900: "#751a3d",
          950: "#5c1530",
        },
      },
      fontFamily: {
        sans: [
          "Roboto",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Arial",
          '"Noto Sans"',
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
        roboto: ["Roboto", "sans-serif"],
      },
    },
  },
  plugins: [flowbitePlugin],
};
