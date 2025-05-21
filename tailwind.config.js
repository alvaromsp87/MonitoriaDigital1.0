module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores do sistema (light mode)
        fundo: {
          light: "#ffffff",
          dark: "#1a1b1e"
        },
        titulo: {
          light: "#094067",
          dark: "#ffffff"
        },
        paragrafo: {
          light: "#5f6c7b",
          dark: "#a6a7ab"
        },
        botao: {
          light: "#3da9fc",
          dark: "#4dabf7",
          hover: {
            light: "#2b96e8",
            dark: "#339af0"
          }
        },
        textoBotao: {
          light: "#ffffff",
          dark: "#1a1b1e"
        },
        destaque: {
          light: "#3da9fc",
          dark: "#4dabf7"
        },
        secundario: {
          light: "#90b4ce",
          dark: "#495057"
        },
        terciario: {
          light: "#ef4565",
          dark: "#ff6b6b"
        },
        card: {
          light: "#ffffff",
          dark: "#25262b",
          hover: {
            light: "#f8f9fa",
            dark: "#2c2d32"
          }
        },
        border: {
          light: "#e9ecef",
          dark: "#373A40"
        }
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      boxShadow: {
        'soft': '0 2px 4px 0 rgba(0,0,0,0.05)',
        'soft-lg': '0 4px 6px -1px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
};