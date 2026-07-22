const defaultColors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // bg は「ゴールドの上に乗せる文字色」専用（常に暗色）。ページの背景色はbody側のCSS変数で別管理
        bg: "#11142A",
        bg2: "rgb(var(--bg2-rgb) / <alpha-value>)",
        elevated: "rgb(var(--elevated-rgb) / <alpha-value>)",
        line: "rgb(var(--line-rgb) / <alpha-value>)",
        gold: "rgb(var(--gold-rgb) / <alpha-value>)",
        rose: "#CE5468",
        gray: {
          ...defaultColors.gray,
          200: "rgb(var(--gray-200-rgb) / <alpha-value>)",
          300: "rgb(var(--gray-300-rgb) / <alpha-value>)",
          400: "rgb(var(--gray-400-rgb) / <alpha-value>)",
          500: "rgb(var(--gray-500-rgb) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
};
