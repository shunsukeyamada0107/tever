import "./globals.css";

export const metadata = {
  title: "BAR TEVER",
  description: "夜の会計・売上管理アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
