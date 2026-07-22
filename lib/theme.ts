export type StoreTheme = "dark" | "light";

type ThemePreset = {
  bg2: string;
  elevated: string;
  line: string;
  pageBg: string;
  pageText: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
};

// 各値は "R G B" 形式（TailwindのCSS変数カラーにそのまま渡せる形）
export const THEME_PRESETS: Record<StoreTheme, ThemePreset> = {
  dark: {
    bg2: "23 27 54",
    elevated: "30 35 66",
    line: "44 49 87",
    pageBg: "17 20 42",
    pageText: "238 234 242",
    gray200: "229 231 235",
    gray300: "209 213 219",
    gray400: "156 163 175",
    gray500: "107 114 128",
  },
  light: {
    bg2: "255 255 255",
    elevated: "246 246 250",
    line: "224 224 232",
    pageBg: "255 255 255",
    pageText: "26 26 36",
    gray200: "55 65 81",
    gray300: "31 41 55",
    gray400: "75 85 99",
    gray500: "107 114 128",
  },
};
