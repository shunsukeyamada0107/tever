"use client";

import Link from "next/link";

// 文字サイズは4段階に統一する:
// Lv1(最重要)=text-2xl ページタイトルのみ / Lv2(重要)=text-lg セクション見出し
// Lv3(本文/手順)=text-base 手順本文・FAQの質問・重要な数字 / Lv4(補足)=text-sm それ以外すべて
//
// 強弱はセクションごとの色（トーン）で出す。1セクション=1色。中の手順カードも同じ色で統一し、
// 別の色のセクションに切り替わった瞬間に「章が変わった」とひと目でわかるようにする。

type Tone = "gold" | "good" | "blue" | "purple" | "rose";

const TONES: Record<Tone, { text: string; bg: string; border: string; badge: string }> = {
  gold: { text: "text-gold", bg: "bg-gold/8", border: "border-gold/35", badge: "bg-gold text-bg" },
  good: { text: "text-good", bg: "bg-good/8", border: "border-good/35", badge: "bg-good text-bg" },
  blue: { text: "text-[#6FB3E0]", bg: "bg-[#6FB3E0]/8", border: "border-[#6FB3E0]/35", badge: "bg-[#6FB3E0] text-bg" },
  purple: { text: "text-[#B78FE0]", bg: "bg-[#B78FE0]/8", border: "border-[#B78FE0]/35", badge: "bg-[#B78FE0] text-bg" },
  rose: { text: "text-rose", bg: "bg-rose/8", border: "border-rose/35", badge: "bg-rose text-bg" },
};

const SECTIONS: { id: string; label: string; tone: Tone }[] = [
  { id: "pos", label: "🧾 伝票・会計", tone: "gold" },
  { id: "expense", label: "💰 経費・出退勤", tone: "good" },
  { id: "report", label: "📊 集計", tone: "blue" },
  { id: "settings", label: "⚙️ 設定", tone: "purple" },
  { id: "faq", label: "🆘 困ったとき", tone: "rose" },
];

function ChapterBanner({ tone, icon, title, sub }: { tone: Tone; icon: React.ReactNode; title: string; sub: string }) {
  const t = TONES[tone];
  return (
    <div className={`rounded-2xl border-2 ${t.border} ${t.bg} p-4 flex items-center gap-3.5`}>
      <div className={`shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center ${t.badge}`}>{icon}</div>
      <div className="min-w-0">
        <h2 className={`font-extrabold text-lg ${t.text} text-wrap-balance`}>{title}</h2>
        <p className="text-sm text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  icon,
  tone,
  children,
}: {
  n: number;
  title: string;
  icon?: React.ReactNode;
  tone: Tone;
  children: React.ReactNode;
}) {
  const t = TONES[tone];
  return (
    <div className={`rounded-2xl border ${t.border} ${t.bg} p-4 space-y-3`}>
      <div className="flex items-center gap-3">
        <div className={`shrink-0 w-10 h-10 rounded-full ${t.badge} flex items-center justify-center font-extrabold text-lg`}>
          {n}
        </div>
        <div className={`font-extrabold text-base flex items-center gap-2 ${t.text}`}>
          {icon}
          {title}
        </div>
      </div>
      <div className="space-y-2.5 pl-1">{children}</div>
    </div>
  );
}

function Mock({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-line bg-elevated p-3 space-y-2">{children}</div>;
}

function InfoCard({ tone, icon, title, sub }: { tone: Tone; icon: React.ReactNode; title: string; sub: string }) {
  const t = TONES[tone];
  return (
    <div className={`rounded-xl border ${t.border} bg-elevated p-3`}>
      <div className={`w-10 h-10 rounded-full ${t.bg} ${t.text} flex items-center justify-center`}>{icon}</div>
      <div className="font-bold text-base mt-2">{title}</div>
      <div className="text-sm text-gray-500 mt-0.5">{sub}</div>
    </div>
  );
}

function InfoRow({ tone, icon, title, sub }: { tone: Tone; icon: React.ReactNode; title: string; sub: string }) {
  const t = TONES[tone];
  return (
    <div className={`rounded-xl border ${t.border} bg-elevated p-3 flex items-center gap-3`}>
      <span className={`w-10 h-10 rounded-full ${t.bg} ${t.text} flex items-center justify-center shrink-0`}>{icon}</span>
      <div>
        <div className="font-bold text-base">{title}</div>
        <div className="text-sm text-gray-500">{sub}</div>
      </div>
    </div>
  );
}

// ---- 挿絵（手描き風のシンプルなSVGイラスト） ----

function TicketArt() {
  return (
    <svg viewBox="0 0 140 100" className="w-36 h-auto mx-auto" aria-hidden="true">
      <path
        d="M14 14 h112 a4 4 0 0 1 4 4 v20 a8 8 0 0 0 0 16 v20 a4 4 0 0 1 -4 4 H14 a4 4 0 0 1 -4 -4 V74 a8 8 0 0 0 0 -16 V18 a4 4 0 0 1 4 -4 Z"
        fill="var(--elevated, #1e1a27)"
        stroke="var(--gold, #dca84e)"
        strokeWidth="2.5"
      />
      <circle cx="70" cy="14" r="3" fill="var(--gold, #dca84e)" opacity="0.6" />
      <line x1="26" y1="34" x2="90" y2="34" stroke="var(--gold, #dca84e)" strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />
      <line x1="26" y1="46" x2="70" y2="46" stroke="#8a7fa0" strokeWidth="3.5" strokeLinecap="round" opacity="0.65" />
      <line x1="26" y1="58" x2="80" y2="58" stroke="#8a7fa0" strokeWidth="3.5" strokeLinecap="round" opacity="0.65" />
      <text x="114" y="38" textAnchor="end" fontSize="12" fontWeight="800" fill="var(--gold, #dca84e)">¥800</text>
      <text x="114" y="50" textAnchor="end" fontSize="12" fontWeight="800" fill="#8a7fa0">¥900</text>
      <text x="114" y="62" textAnchor="end" fontSize="12" fontWeight="800" fill="#8a7fa0">¥1,200</text>
    </svg>
  );
}

function CocktailArt() {
  return (
    <svg viewBox="0 0 100 100" className="w-20 h-20 mx-auto" aria-hidden="true">
      <path
        d="M20 22 L50 56 L80 22 Z"
        fill="none"
        stroke="var(--gold, #dca84e)"
        strokeWidth="4.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <line x1="50" y1="56" x2="50" y2="80" stroke="var(--gold, #dca84e)" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="35" y1="80" x2="65" y2="80" stroke="var(--gold, #dca84e)" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="30" y1="28" x2="70" y2="28" stroke="#8a7fa0" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      <circle cx="65" cy="16" r="6" fill="#ce5468" />
      <line x1="65" y1="16" x2="59" y2="4" stroke="#7fcb8f" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ---- アイコン一式（app本体のナビと同じ線画スタイル） ----

function iconProps(size = 22) {
  return { viewBox: "0 0 24 24", width: size, height: size, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
}

function PlusCircleIcon({ size }: { size?: number }) {
  return (
    <svg {...iconProps(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function CupIcon({ size }: { size?: number }) {
  return (
    <svg {...iconProps(size)}>
      <path d="M6 3h12l-1.6 12.5a4.4 4.4 0 0 1-8.8 0L6 3Z" />
      <path d="M9 21h6M12 15.5V21" />
    </svg>
  );
}

function UndoIcon({ size }: { size?: number }) {
  return (
    <svg {...iconProps(size)}>
      <path d="M4 10h9a5 5 0 0 1 0 10h-2" />
      <path d="M8 5 4 10l4 5" />
    </svg>
  );
}

function PeopleIcon({ size }: { size?: number }) {
  return (
    <svg {...iconProps(size)}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="18" cy="9" r="2.3" />
      <path d="M15.3 14.3c2.5.5 4.2 2.5 4.2 5.7" />
    </svg>
  );
}

function TagIcon({ size }: { size?: number }) {
  return (
    <svg {...iconProps(size)}>
      <path d="M3 11.5 12.5 2H20a1 1 0 0 1 1 1v7.5L11.5 20.5a2 2 0 0 1-2.8 0L3 14.8a2 2 0 0 1 0-2.8Z" />
      <circle cx="15.5" cy="7.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CashIcon({ size }: { size?: number }) {
  return (
    <svg {...iconProps(size)}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 6v12M18 6v12" />
    </svg>
  );
}

function WalletIcon({ size }: { size?: number }) {
  return (
    <svg {...iconProps(size)}>
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M3 11h18" />
      <circle cx="16" cy="14.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ClockIcon({ size }: { size?: number }) {
  return (
    <svg {...iconProps(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

function ChartIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
      <rect x="4" y="13" width="4" height="7" rx="1" fill="currentColor" opacity="0.55" />
      <rect x="10" y="8" width="4" height="12" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="16" y="4" width="4" height="16" rx="1" fill="currentColor" />
    </svg>
  );
}

function GearIcon({ size = 22 }: { size?: number }) {
  const teeth = Array.from({ length: 8 });
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      {teeth.map((_, i) => (
        <rect key={i} x="11" y="1" width="2.4" height="5" rx="1" transform={`rotate(${i * 45} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="2" fill="var(--elevated, #1e1a27)" />
    </svg>
  );
}

function LifeRingIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.6">
      <circle cx="12" cy="12" r="9" />
      <text x="12" y="16.5" textAnchor="middle" fontSize="11" fontWeight="800" stroke="none" fill="currentColor">
        ?
      </text>
    </svg>
  );
}

function DocumentIcon({ size }: { size?: number }) {
  return (
    <svg {...iconProps(size)}>
      <path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" />
      <path d="M14 2v6h6M8 13h8M8 17h8" />
    </svg>
  );
}

function TrashIcon({ size }: { size?: number }) {
  return (
    <svg {...iconProps(size)}>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
    </svg>
  );
}

export default function GuidePage() {
  return (
    <div className="space-y-9 pb-8">
      <Link href="/dashboard/settings" className="text-sm text-gray-400 inline-block">
        ← 設定に戻る
      </Link>

      <div className="text-center space-y-2">
        <CocktailArt />
        <span className="inline-block text-sm font-bold text-gold bg-gold/10 border border-gold/30 rounded-full px-3 py-1 tracking-wide">
          📖 STAFF GUIDE
        </span>
        <h1 className="text-2xl font-extrabold">アプリの使い方ガイド</h1>
        <p className="text-sm text-gray-400">迷ったらこのページを見れば大丈夫です</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`shrink-0 text-sm font-bold rounded-full border-2 ${TONES[s.tone].border} ${TONES[s.tone].bg} ${TONES[s.tone].text} px-3 py-1.5`}
          >
            {s.label}
          </a>
        ))}
      </div>

      {/* ===== 1. 伝票・会計 ===== */}
      <section id="pos" className="space-y-4 scroll-mt-16">
        <ChapterBanner tone="gold" icon={<TagIconPos />} title="🧾 伝票を作る・会計する" sub="お店に入る一番最初の画面。夜の業務のほとんどはここで完結します。" />
        <TicketArt />

        <Step n={1} title="新しい伝票を作る" icon={<PlusCircleIcon size={20} />} tone="gold">
          <Mock>
            <div className="rounded-lg bg-gold text-bg text-center text-sm font-bold py-2.5">
              ＋ 新規伝票を作成
            </div>
          </Mock>
          <ol className="list-decimal list-inside text-base text-gray-200 space-y-2">
            <li>「＋ 新規伝票を作成」（または右下の丸いボタン）をタップ</li>
            <li>お客様の名前・卓番を入力（例：田中様・3卓）</li>
            <li>人数・担当スタッフを入れて「作成する」</li>
          </ol>
        </Step>

        <Step n={2} title="商品を追加する" icon={<CupIcon size={20} />} tone="gold">
          <Mock>
            <div className="text-sm font-bold text-gold">⭐ よく出る商品</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-line bg-bg2 px-2 py-1.5 text-sm">
                ハイボール<div className="text-gold font-bold">¥800</div>
              </div>
              <div className="rounded-lg border border-line bg-bg2 px-2 py-1.5 text-sm">
                ビール<div className="text-gold font-bold">¥900</div>
              </div>
            </div>
          </Mock>
          <ol className="list-decimal list-inside text-base text-gray-200 space-y-2">
            <li>まず上の「⭐よく出る商品」を見る（だいたいここで足りる）</li>
            <li>なければカテゴリタブを切り替えて探す</li>
            <li>商品をタップするだけで1点追加（連打でどんどん増える）</li>
            <li>メニューにない商品は「自由入力で追加」に品名・金額を打つ</li>
          </ol>
        </Step>

        <Step n={3} title="数を変える・間違えたら消す" icon={<UndoIcon size={20} />} tone="gold">
          <Mock>
            <div className="flex items-center justify-between text-sm">
              <span>ハイボール</span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded border border-line flex items-center justify-center">－</span>
                <b>2</b>
                <span className="w-6 h-6 rounded border border-line flex items-center justify-center">＋</span>
              </span>
            </div>
            <div className="rounded-lg border border-gold text-gold text-center text-sm font-bold py-2">
              ↺ 元に戻す
            </div>
          </Mock>
          <ol className="list-decimal list-inside text-base text-gray-200 space-y-2">
            <li>数量は－＋ボタンで増減。数字部分をタップすれば直接打ち込みもできる</li>
            <li>商品ごと消したいときは横の「✕」</li>
            <li>
              <b className="text-gray-50">押し間違えたら、画面下の「↺ 元に戻す」を8秒以内にタップ</b>
              すれば一発で取り消せる
            </li>
          </ol>
          <div className="rounded-lg bg-black/15 px-3 py-2 text-sm text-gray-200">
            💡 間違えても慌てなくてOK。まず「元に戻す」を探しましょう。
          </div>
        </Step>

        <Step n={4} title="担当スタッフを決める（歩合対象）" icon={<PeopleIcon size={20} />} tone="gold">
          <Mock>
            <div className="text-sm font-bold text-gold">担当スタッフ（この伝票の歩合対象）</div>
            <div className="flex gap-1.5">
              <span className="rounded-full bg-gold text-bg text-sm font-bold px-2.5 py-1">👤 みさき</span>
              <span className="rounded-full border border-line text-sm px-2.5 py-1">👤 ゆい</span>
            </div>
          </Mock>
          <ol className="list-decimal list-inside text-base text-gray-200 space-y-2">
            <li>伝票まるごと1人が担当するなら「担当スタッフ」で名前をタップ</li>
            <li>途中から別の人が接客した商品だけ、その商品下のプルダウンで個別に変更できる</li>
          </ol>
          <p className="text-sm text-gray-300">
            ここで選んだ担当に、売上に応じた歩合がつきます。空欄のままだとお店の売上（歩合なし）扱いになります。
          </p>
        </Step>

        <Step n={5} title="割引を入れる（必要なとき）" icon={<TagIcon size={20} />} tone="gold">
          <ol className="list-decimal list-inside text-base text-gray-200 space-y-2">
            <li>「30%OFF」「50%OFF」ボタン、または「値引き額」欄に金額を直接打つ</li>
            <li>間違えたら「割引解除」でいつでも取り消せる</li>
          </ol>
        </Step>

        <Step n={6} title="会計する" icon={<CashIcon size={20} />} tone="gold">
          <Mock>
            <div className="flex justify-between items-baseline text-sm text-gray-400">
              <span>合計</span>
              <span className="text-gold font-bold text-base">¥7,300</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-gold text-bg text-center text-sm font-bold py-2">
                💴 現金で会計
              </div>
              <div className="rounded-lg border border-gold text-gold text-center text-sm font-bold py-2">
                💳 電子決済で会計
              </div>
            </div>
          </Mock>
          <ol className="list-decimal list-inside text-base text-gray-200 space-y-2">
            <li>金額を確認して「現金で会計」または「電子決済で会計」をタップ</li>
            <li>確認ダイアログでOK → お客様控えのレシート画面が出る</li>
            <li>間違えたら会計済みの伝票を開いて「会計を取り消す」でやり直せる</li>
          </ol>
        </Step>
      </section>

      {/* ===== 2. 経費・出退勤 ===== */}
      <section id="expense" className="space-y-4 scroll-mt-16">
        <ChapterBanner
          tone="good"
          icon={<WalletIcon size={26} />}
          title="💰 経費・出退勤をつける"
          sub="下のタブの「経費」から。買い出しの記録と、時給スタッフの出勤・退勤もここでつけます。"
        />
        <div className="grid grid-cols-2 gap-2.5">
          <InfoCard tone="good" icon={<WalletIcon />} title="経費を記録" sub="品目・金額を入力。レシート撮影もできます" />
          <InfoCard tone="good" icon={<ClockIcon />} title="出勤・退勤" sub="時給スタッフは開始・終了時刻を記録" />
        </div>
        <div className="rounded-xl border border-good/35 bg-good/8 px-3.5 py-3 text-sm text-gray-200">
          💡 ここで記録した内容は、集計タブの「人件費」「粗利」に自動で反映されます。
        </div>
      </section>

      {/* ===== 3. 集計 ===== */}
      <section id="report" className="space-y-4 scroll-mt-16">
        <ChapterBanner
          tone="blue"
          icon={<ChartIcon size={26} />}
          title="📊 今日の売上・歩合を見る"
          sub="下のタブの「集計」で、今日と今月の数字をいつでも確認できます。"
        />
        <Mock>
          <div className="flex justify-between text-sm text-gray-400">
            <span>売上（税込）</span>
            <span className="text-gray-200">¥312,000</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>経費・人件費</span>
            <span className="text-gray-200">−¥70,400</span>
          </div>
          <div className="flex justify-between items-baseline text-sm font-bold border-t border-line pt-2">
            <span>粗利</span>
            <span className="text-gold text-base">¥241,600</span>
          </div>
        </Mock>
        <div className="rounded-2xl border border-[#6FB3E0]/35 bg-[#6FB3E0]/8 p-4">
          <ol className="list-decimal list-inside text-base text-gray-200 space-y-2">
            <li>自分の名前のところに、今日担当した売上と歩合が出ます</li>
            <li>伝票を1件ずつ見たいときは「伝票別」のリストから開ける</li>
            <li>店長への報告は「LINE報告テキスト」をコピーしてそのまま送るだけ</li>
          </ol>
        </div>
      </section>

      {/* ===== 4. 設定 ===== */}
      <section id="settings" className="space-y-4 scroll-mt-16">
        <ChapterBanner tone="purple" icon={<GearIcon size={26} />} title="⚙️ 設定" sub="メニューやスタッフの登録・変更は、このタブから行います。" />
        <div className="grid grid-cols-1 gap-2">
          <InfoRow tone="purple" icon={<CupIcon />} title="メニュー管理" sub="商品の追加・値段変更、カテゴリ分け" />
          <InfoRow tone="purple" icon={<PeopleIcon />} title="スタッフ管理" sub="スタッフの追加・時給の設定" />
          <InfoRow tone="purple" icon={<DocumentIcon />} title="伝票ログ" sub="伝票の作成・削除の履歴を確認" />
        </div>
        <div className="rounded-2xl border-2 border-dashed border-gold/40 bg-gold/10 p-4 text-sm text-gray-200">
          <b className="text-gold text-base block mb-1">🔒 オーナー専用のページもあります</b>
          暗証番号が必要です。基本給・給与明細などお給料に関わる情報が入っています。スタッフの方は触る必要はありません。
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="space-y-3 scroll-mt-16">
        <ChapterBanner tone="rose" icon={<LifeRingIcon size={26} />} title="🆘 困ったときは" sub="よくあるつまずきポイントをまとめました。" />
        {[
          {
            q: "商品を押し間違えた・数を間違えた",
            a: "画面下に出る「↺ 元に戻す」を押せば直前の操作が取り消せます（8秒くらいで消えるので早めに）。それ以降は＋－ボタンや✕で手動で直してください。",
            icon: <UndoIcon size={20} />,
          },
          {
            q: "会計する方法を間違えた（現金のはずがカードにした等）",
            a: "会計済みの伝票を開いて「会計を取り消す」を押せば、対応中の状態に戻せます。正しい方法で会計し直してください。",
            icon: <CashIcon size={20} />,
          },
          {
            q: "伝票を間違えて消してしまった",
            a: "伝票の削除は元に戻せません。設定タブの「伝票ログ」に削除した記録は残るので、内容を店長・オーナーに確認してください。",
            icon: <TrashIcon size={20} />,
          },
          {
            q: "メニューにない商品を出した",
            a: "「自由入力で追加」に品名と金額を打って追加してください。よく出るなら「メニュー管理」から正式に登録すると次から探せて楽になります。",
            icon: <CupIcon size={20} />,
          },
          {
            q: "担当を後から変えたい",
            a: "会計済みの伝票でも、担当スタッフはあとから変更できます。商品ごとに個別で担当を変えることもできます。",
            icon: <PeopleIcon size={20} />,
          },
        ].map((item) => (
          <details key={item.q} className="rounded-2xl border border-rose/35 bg-rose/6 px-4">
            <summary className="py-3.5 text-base font-bold cursor-pointer flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-rose/15 text-rose flex items-center justify-center shrink-0">
                {item.icon}
              </span>
              {item.q}
            </summary>
            <p className="text-sm text-gray-300 pb-4 leading-relaxed pl-12">{item.a}</p>
          </details>
        ))}
      </section>
    </div>
  );
}

function TagIconPos() {
  return (
    <svg viewBox="0 0 24 24" width={28} height={28} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 13h6V4H4v9zM14 20h6V4h-6v16zM4 20h6v-4H4v4z" />
    </svg>
  );
}
