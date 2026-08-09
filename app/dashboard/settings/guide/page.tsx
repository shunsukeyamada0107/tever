"use client";

import Link from "next/link";

const SECTIONS = [
  { id: "pos", label: "🧾 伝票・会計" },
  { id: "expense", label: "💰 経費・出退勤" },
  { id: "report", label: "📊 集計" },
  { id: "settings", label: "⚙️ 設定" },
  { id: "faq", label: "🆘 困ったとき" },
];

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-6 h-6 rounded-full bg-gold text-bg text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="font-bold text-sm">{title}</div>
        {children}
      </div>
    </div>
  );
}

function Mock({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-line bg-elevated p-3 space-y-2">{children}</div>;
}

// ---- 挿絵（手描き風のシンプルなSVGイラスト） ----

function TicketArt() {
  return (
    <svg viewBox="0 0 140 100" className="w-32 h-auto mx-auto" aria-hidden="true">
      <path
        d="M14 14 h112 a4 4 0 0 1 4 4 v20 a8 8 0 0 0 0 16 v20 a4 4 0 0 1 -4 4 H14 a4 4 0 0 1 -4 -4 V74 a8 8 0 0 0 0 -16 V18 a4 4 0 0 1 4 -4 Z"
        fill="var(--elevated, #1e1a27)"
        stroke="var(--gold, #dca84e)"
        strokeWidth="2"
      />
      <circle cx="70" cy="14" r="3" fill="var(--gold, #dca84e)" opacity="0.6" />
      <line x1="26" y1="34" x2="90" y2="34" stroke="var(--gold, #dca84e)" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
      <line x1="26" y1="46" x2="70" y2="46" stroke="#8a7fa0" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <line x1="26" y1="58" x2="80" y2="58" stroke="#8a7fa0" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <text x="114" y="38" textAnchor="end" fontSize="11" fontWeight="700" fill="var(--gold, #dca84e)">¥800</text>
      <text x="114" y="50" textAnchor="end" fontSize="11" fontWeight="700" fill="#8a7fa0">¥900</text>
      <text x="114" y="62" textAnchor="end" fontSize="11" fontWeight="700" fill="#8a7fa0">¥1,200</text>
    </svg>
  );
}

function Badge({ tone, children }: { tone: "gold" | "good" | "blue" | "rose"; children: React.ReactNode }) {
  const toneMap = {
    gold: "bg-gold/12 text-gold",
    good: "bg-good/12 text-good",
    blue: "bg-[#6FB3E0]/12 text-[#6FB3E0]",
    rose: "bg-rose/12 text-rose",
  } as const;
  return (
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-1 ${toneMap[tone]}`}>
      {children}
    </div>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="12" width="28" height="20" rx="4" />
      <path d="M6 18h28" />
      <circle cx="26" cy="24" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="20" cy="20" r="14" />
      <path d="M20 12v9l6 4" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
      <rect x="7" y="22" width="6" height="11" rx="1.5" fill="currentColor" opacity="0.55" />
      <rect x="17" y="14" width="6" height="19" rx="1.5" fill="currentColor" opacity="0.8" />
      <rect x="27" y="7" width="6" height="26" rx="1.5" fill="currentColor" />
    </svg>
  );
}

function GearIcon() {
  const teeth = Array.from({ length: 8 });
  return (
    <svg viewBox="0 0 40 40" className="w-7 h-7" fill="currentColor">
      {teeth.map((_, i) => (
        <rect key={i} x="18" y="2" width="4" height="8" rx="1.5" transform={`rotate(${i * 45} 20 20)`} />
      ))}
      <circle cx="20" cy="20" r="9" />
      <circle cx="20" cy="20" r="3.5" fill="var(--elevated, #1e1a27)" />
    </svg>
  );
}

function LifeRingIcon() {
  return (
    <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="3">
      <circle cx="20" cy="20" r="15" />
      <text x="20" y="26" textAnchor="middle" fontSize="18" fontWeight="800" stroke="none" fill="currentColor">
        ?
      </text>
    </svg>
  );
}

export default function GuidePage() {
  return (
    <div className="space-y-8 pb-8">
      <Link href="/dashboard/settings" className="text-xs text-gray-400 inline-block">
        ← 設定に戻る
      </Link>

      <div className="text-center space-y-2">
        <span className="inline-block text-[11px] font-bold text-gold bg-gold/10 border border-gold/30 rounded-full px-3 py-1 tracking-wide">
          📖 STAFF GUIDE
        </span>
        <h1 className="text-xl font-bold">アプリの使い方ガイド</h1>
        <p className="text-sm text-gray-400">迷ったらこのページを見れば大丈夫です</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="shrink-0 text-xs font-bold rounded-full border border-line bg-elevated px-3 py-1.5 text-gray-300"
          >
            {s.label}
          </a>
        ))}
      </div>

      {/* ===== 1. 伝票・会計 ===== */}
      <section id="pos" className="space-y-5 scroll-mt-16">
        <div>
          <TicketArt />
          <h2 className="text-gold font-bold text-base text-center mt-2">🧾 伝票を作る・会計する</h2>
          <p className="text-xs text-gray-500 mt-1 text-center">
            お店に入る一番最初の画面。夜の業務のほとんどはここで完結します。
          </p>
        </div>

        <Step n={1} title="新しい伝票を作る">
          <Mock>
            <div className="rounded-lg bg-gold text-bg text-center text-xs font-bold py-2.5">
              ＋ 新規伝票を作成
            </div>
          </Mock>
          <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
            <li>「＋ 新規伝票を作成」（または右下の丸いボタン）をタップ</li>
            <li>お客様の名前・卓番を入力（例：田中様・3卓）</li>
            <li>人数・担当スタッフを入れて「作成する」</li>
          </ol>
        </Step>

        <Step n={2} title="商品を追加する">
          <Mock>
            <div className="text-[10px] font-bold text-gold">⭐ よく出る商品</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-line bg-bg2 px-2 py-1.5 text-[11px]">
                ハイボール<div className="text-gold font-bold">¥800</div>
              </div>
              <div className="rounded-lg border border-line bg-bg2 px-2 py-1.5 text-[11px]">
                ビール<div className="text-gold font-bold">¥900</div>
              </div>
            </div>
          </Mock>
          <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
            <li>まず上の「⭐よく出る商品」を見る（だいたいここで足りる）</li>
            <li>なければカテゴリタブを切り替えて探す</li>
            <li>商品をタップするだけで1点追加（連打でどんどん増える）</li>
            <li>メニューにない商品は「自由入力で追加」に品名・金額を打つ</li>
          </ol>
        </Step>

        <Step n={3} title="数を変える・間違えたら消す">
          <Mock>
            <div className="flex items-center justify-between text-xs">
              <span>ハイボール</span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded border border-line flex items-center justify-center">－</span>
                <b>2</b>
                <span className="w-5 h-5 rounded border border-line flex items-center justify-center">＋</span>
              </span>
            </div>
            <div className="rounded-lg border border-gold text-gold text-center text-xs font-bold py-2">
              ↺ 元に戻す
            </div>
          </Mock>
          <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
            <li>数量は－＋ボタンで増減。数字部分をタップすれば直接打ち込みもできる</li>
            <li>商品ごと消したいときは横の「✕」</li>
            <li>
              <b className="text-gray-100">押し間違えたら、画面下の「↺ 元に戻す」を8秒以内にタップ</b>
              すれば一発で取り消せる
            </li>
          </ol>
          <div className="rounded-lg bg-good/10 border border-good/30 px-3 py-2 text-xs text-gray-300">
            💡 間違えても慌てなくてOK。まず「元に戻す」を探しましょう。
          </div>
        </Step>

        <Step n={4} title="担当スタッフを決める（歩合対象）">
          <Mock>
            <div className="text-[10px] font-bold text-gold">担当スタッフ（この伝票の歩合対象）</div>
            <div className="flex gap-1.5">
              <span className="rounded-full bg-gold text-bg text-[11px] font-bold px-2.5 py-1">👤 みさき</span>
              <span className="rounded-full border border-line text-[11px] px-2.5 py-1">👤 ゆい</span>
            </div>
          </Mock>
          <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
            <li>伝票まるごと1人が担当するなら「担当スタッフ」で名前をタップ</li>
            <li>途中から別の人が接客した商品だけ、その商品下のプルダウンで個別に変更できる</li>
          </ol>
          <p className="text-xs text-gray-500">
            ここで選んだ担当に、売上に応じた歩合がつきます。空欄のままだとお店の売上（歩合なし）扱いになります。
          </p>
        </Step>

        <Step n={5} title="割引を入れる（必要なとき）">
          <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
            <li>「30%OFF」「50%OFF」ボタン、または「値引き額」欄に金額を直接打つ</li>
            <li>間違えたら「割引解除」でいつでも取り消せる</li>
          </ol>
        </Step>

        <Step n={6} title="会計する">
          <Mock>
            <div className="flex justify-between text-xs text-gray-400">
              <span>合計</span>
              <span className="text-gold font-bold">¥7,300</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-gold text-bg text-center text-[11px] font-bold py-2">
                💴 現金で会計
              </div>
              <div className="rounded-lg border border-gold text-gold text-center text-[11px] font-bold py-2">
                💳 電子決済で会計
              </div>
            </div>
          </Mock>
          <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
            <li>金額を確認して「現金で会計」または「電子決済で会計」をタップ</li>
            <li>確認ダイアログでOK → お客様控えのレシート画面が出る</li>
            <li>間違えたら会計済みの伝票を開いて「会計を取り消す」でやり直せる</li>
          </ol>
        </Step>
      </section>

      {/* ===== 2. 経費・出退勤 ===== */}
      <section id="expense" className="space-y-3 scroll-mt-16">
        <div>
          <Badge tone="good">
            <WalletIcon />
          </Badge>
          <h2 className="text-gold font-bold text-base text-center">💰 経費・出退勤をつける</h2>
          <p className="text-xs text-gray-500 mt-1 text-center">
            下のタブの「経費」から。買い出しの記録と、時給スタッフの出勤・退勤もここでつけます。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-line bg-elevated p-3">
            <div className="text-lg">🧾</div>
            <div className="font-bold text-sm mt-1">経費を記録</div>
            <div className="text-xs text-gray-500 mt-0.5">品目・金額を入力。レシート撮影もできます</div>
          </div>
          <div className="rounded-xl border border-line bg-elevated p-3">
            <div className="text-lg">⏱️</div>
            <div className="font-bold text-sm mt-1">出勤・退勤</div>
            <div className="text-xs text-gray-500 mt-0.5">時給スタッフは開始・終了時刻を記録</div>
          </div>
        </div>
        <div className="rounded-lg bg-good/10 border border-good/30 px-3 py-2 text-xs text-gray-300">
          💡 ここで記録した内容は、集計タブの「人件費」「粗利」に自動で反映されます。
        </div>
      </section>

      {/* ===== 3. 集計 ===== */}
      <section id="report" className="space-y-3 scroll-mt-16">
        <div>
          <Badge tone="blue">
            <ChartIcon />
          </Badge>
          <h2 className="text-gold font-bold text-base text-center">📊 今日の売上・歩合を見る</h2>
          <p className="text-xs text-gray-500 mt-1 text-center">
            下のタブの「集計」で、今日と今月の数字をいつでも確認できます。
          </p>
        </div>
        <Mock>
          <div className="flex justify-between text-xs text-gray-400">
            <span>売上（税込）</span>
            <span className="text-gray-200">¥312,000</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>経費・人件費</span>
            <span className="text-gray-200">−¥70,400</span>
          </div>
          <div className="flex justify-between text-xs font-bold border-t border-line pt-2">
            <span>粗利</span>
            <span className="text-gold">¥241,600</span>
          </div>
        </Mock>
        <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
          <li>自分の名前のところに、今日担当した売上と歩合が出ます</li>
          <li>伝票を1件ずつ見たいときは「伝票別」のリストから開ける</li>
          <li>店長への報告は「LINE報告テキスト」をコピーしてそのまま送るだけ</li>
        </ol>
      </section>

      {/* ===== 4. 設定 ===== */}
      <section id="settings" className="space-y-3 scroll-mt-16">
        <div>
          <Badge tone="gold">
            <GearIcon />
          </Badge>
          <h2 className="text-gold font-bold text-base text-center">⚙️ 設定</h2>
          <p className="text-xs text-gray-500 mt-1 text-center">メニューやスタッフの登録・変更は、このタブから行います。</p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <div className="rounded-xl border border-line bg-elevated p-3 flex items-center gap-3">
            <span className="text-lg">🍹</span>
            <div>
              <div className="font-bold text-sm">メニュー管理</div>
              <div className="text-xs text-gray-500">商品の追加・値段変更、カテゴリ分け</div>
            </div>
          </div>
          <div className="rounded-xl border border-line bg-elevated p-3 flex items-center gap-3">
            <span className="text-lg">🧑‍🤝‍🧑</span>
            <div>
              <div className="font-bold text-sm">スタッフ管理</div>
              <div className="text-xs text-gray-500">スタッフの追加・時給の設定</div>
            </div>
          </div>
          <div className="rounded-xl border border-line bg-elevated p-3 flex items-center gap-3">
            <span className="text-lg">🧾</span>
            <div>
              <div className="font-bold text-sm">伝票ログ</div>
              <div className="text-xs text-gray-500">伝票の作成・削除の履歴を確認</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-gold/40 bg-gold/10 p-3 text-xs text-gray-300">
          <b className="text-gold">🔒 オーナー専用</b>のページもあります（暗証番号が必要）。基本給・給与明細などお給料に関わる情報が入っています。スタッフの方は触る必要はありません。
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="space-y-2 scroll-mt-16">
        <Badge tone="rose">
          <LifeRingIcon />
        </Badge>
        <h2 className="text-gold font-bold text-base text-center">🆘 困ったときは</h2>
        {[
          {
            q: "商品を押し間違えた・数を間違えた",
            a: "画面下に出る「↺ 元に戻す」を押せば直前の操作が取り消せます（8秒くらいで消えるので早めに）。それ以降は＋－ボタンや✕で手動で直してください。",
          },
          {
            q: "会計する方法を間違えた（現金のはずがカードにした等）",
            a: "会計済みの伝票を開いて「会計を取り消す」を押せば、対応中の状態に戻せます。正しい方法で会計し直してください。",
          },
          {
            q: "伝票を間違えて消してしまった",
            a: "伝票の削除は元に戻せません。設定タブの「伝票ログ」に削除した記録は残るので、内容を店長・オーナーに確認してください。",
          },
          {
            q: "メニューにない商品を出した",
            a: "「自由入力で追加」に品名と金額を打って追加してください。よく出るなら「メニュー管理」から正式に登録すると次から探せて楽になります。",
          },
          {
            q: "担当を後から変えたい",
            a: "会計済みの伝票でも、担当スタッフはあとから変更できます。商品ごとに個別で担当を変えることもできます。",
          },
        ].map((item) => (
          <details key={item.q} className="rounded-xl border border-line bg-elevated px-3.5">
            <summary className="py-3 text-sm font-bold cursor-pointer">{item.q}</summary>
            <p className="text-xs text-gray-400 pb-3.5 leading-relaxed">{item.a}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
