import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        netflix: {
          red: "#E50914",
          black: "#141414",
          darkGray: "#181818",
          gray: "#2F2F2F",
          lightGray: "#B3B3B3",
        },
      },
    },
  },
  plugins: [],
};
export default config;
