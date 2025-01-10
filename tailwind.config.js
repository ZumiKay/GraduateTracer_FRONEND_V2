/** @type {import('tailwindcss').Config} */
import { nextui } from "@nextui-org/react";
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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
          "0%": {
            width: "0",
          },
          "100%": {
            width: "100%",
            backgroundColor: "#A294F9",
          },
        },
      },
      animation: {
        borderExpand: "borderExpand 0.5s forwards",
      },
    },
  },
  plugins: [nextui()],
  darkMode: "class",
};
