import { EXPENSE_CATEGORIES } from "@/lib/types";

// レシートのOCRテキストから「経費っぽい行」を除外するためのキーワード
const IGNORE_LINE_KEYWORDS = [
  "領収書",
  "レシート",
  "合計",
  "小計",
  "お釣り",
  "おつり",
  "御釣り",
  "預り",
  "お預り",
  "消費税",
  "内税",
  "外税",
  "現金",
  "カード",
  "クレジット",
  "ポイント",
  "登録番号",
  "電話",
  "tel",
  "TEL",
  "様",
  "ありがとう",
  "領収",
  "発行",
  "店舗",
  "レジ",
  "担当",
];

// 品名からカテゴリを推測するためのキーワード辞書
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  仕入れ: [
    "酒",
    "ビール",
    "ワイン",
    "ウイスキー",
    "ウィスキー",
    "ウォッカ",
    "焼酎",
    "ジン",
    "ラム",
    "リキュール",
    "日本酒",
    "梅酒",
    "缶",
    "瓶",
  ],
  ドリンク: ["ジュース", "コーラ", "水", "ミネラル", "ソーダ", "茶", "コーヒー", "牛乳", "炭酸"],
  消耗品: [
    "氷",
    "ライム",
    "レモン",
    "紙",
    "ナプキン",
    "ストロー",
    "洗剤",
    "スポンジ",
    "電球",
    "手袋",
    "割り箸",
    "おしぼり",
    "ラップ",
    "袋",
  ],
  雑費: ["駐車", "タクシー", "切手", "文具", "電池", "コピー"],
};

export type ReceiptCandidate = {
  name: string;
  amount: number;
  category: string;
};

function guessCategory(name: string): string {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => name.includes(k))) return category;
  }
  return "その他";
}

// OCRで得たテキストから「品名 + 金額」らしき行を抽出する
export function parseReceiptText(text: string): ReceiptCandidate[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const candidates: ReceiptCandidate[] = [];
  const amountRe = /([0-9][0-9,]{1,7})\s*円?\s*$/;

  for (const line of lines) {
    if (IGNORE_LINE_KEYWORDS.some((kw) => line.includes(kw))) continue;

    const m = line.match(amountRe);
    if (!m) continue;

    const amount = Number(m[1].replace(/,/g, ""));
    if (!amount || amount <= 0 || amount > 1000000) continue;

    const name = line.slice(0, m.index).replace(/[¥￥*\s]+$/, "").trim();
    if (!name || name.length > 30) continue;
    // 数字だけの品名（電話番号や日付の断片など）は除外
    if (/^[0-9\-/:. ]+$/.test(name)) continue;

    candidates.push({ name, amount, category: guessCategory(name) });
  }

  return candidates;
}

export { EXPENSE_CATEGORIES };
