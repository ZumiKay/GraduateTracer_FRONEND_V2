import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        card_respondant_width: "80%",
        card_respondant_height: "500px",
      },
      fontSize: {
        card_header_1: "3.5rem",
        card_header_2: "2.5rem",
        card_header_3: "2rem",
      },
      colors: {
        primary: "#254336",
        secondary: "#B7B597",
        lightsecondary: "#DAD3BE",
        darkprimary: "#181C14",
        success: "#6B8A7A",
        lightsucess: "#D3F1DF",
        danger: "#F08080",
        warning: "#A294F9",
      },
      keyframes: {
        borderExpand: {
          "0%": { width: "0" },
          "100%": { width: "100%", backgroundColor: "#A294F9" },
        },
      },
      animation: {
        borderExpand: "borderExpand 0.5s forwards",
      },
    },
  },
  plugins: [heroui()],
  darkMode: "class",
};
