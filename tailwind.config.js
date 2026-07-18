/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#11142A",
        bg2: "#171B36",
        elevated: "#1E2342",
        line: "#2C3157",
        gold: "#DCA84E",
        rose: "#CE5468",
      },
    },
  },
  plugins: [],
};
