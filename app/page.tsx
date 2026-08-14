const LP_STYLES = `
  :root {
    --bg: #eef3fb;
    --bg-soft: #e5edf8;
    --surface: #ffffff;
    --line: #d7e2f0;
    --line-soft: #e3eaf5;
    --blue: #2657a6;
    --blue-bright: #3568c0;
    --blue-deep: #163c7a;
    --blue-soft: rgba(38, 87, 166, 0.09);
    --blue-dim: #8ea4c8;
    --sky: #6fb3e0;
    --paper: #ffffff;
    --paper-ink: #182642;
    --paper-ink-soft: #56698c;
    --text: #16233a;
    --text-dim: #4c5c7a;
    --text-mute: #7d8bab;
    --stamp: #2657a6;

    --font-display: "Hiragino Mincho ProN", "YuMincho", "Noto Serif JP", serif;
    --font-body: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif;
    --font-mono: "SF Mono", Menlo, "Courier New", monospace;

    color-scheme: light;
  }

  .lp * { box-sizing: border-box; }

  .lp {
    position: relative;
    min-height: 100vh;
    margin: 0;
    color: var(--text);
    font-family: var(--font-body);
    line-height: 1.75;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
    background:
      radial-gradient(ellipse 70% 45% at 50% -6%, rgba(38, 87, 166, 0.1) 0%, rgba(38, 87, 166, 0) 60%),
      var(--bg);
  }

  .lp a { color: inherit; }

  .lp img, .lp svg { display: block; }

  .lp h1, .lp h2, .lp h3 { font-family: var(--font-display); text-wrap: balance; margin: 0; font-weight: 600; }

  .lp p { margin: 0; }

  .lp .wrap {
    max-width: 1040px;
    margin: 0 auto;
    padding: 0 24px;
  }

  .lp .eyebrow {
    font-family: var(--font-body);
    font-size: 12px;
    letter-spacing: 0.16em;
    color: var(--blue);
    font-weight: 700;
    text-transform: uppercase;
  }

  .lp .tabular { font-variant-numeric: tabular-nums; }

  /* ---------- nav ---------- */
  .lp .nav {
    position: sticky;
    top: 0;
    z-index: 40;
    background: rgba(255, 255, 255, 0.86);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--line-soft);
  }
  .lp .nav-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    max-width: 1040px;
    margin: 0 auto;
  }
  .lp .brand {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }
  .lp .brand-icon {
    height: 30px;
    width: auto;
    display: block;
  }
  .lp .brand-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .lp .brand-mark {
    font-family: var(--font-display);
    font-size: 20px;
    color: var(--text);
    letter-spacing: 0.02em;
  }
  .lp .brand-mark em { color: var(--blue); font-style: normal; }
  .lp .brand-sub {
    font-size: 9.5px;
    letter-spacing: 0.22em;
    color: var(--text-mute);
    font-weight: 600;
  }
  .lp .nav-links {
    display: flex;
    align-items: center;
    gap: 24px;
  }
  .lp .nav-links a {
    font-size: 13.5px;
    color: var(--text-dim);
    text-decoration: none;
  }
  .lp .nav-links a:hover { color: var(--blue); }
  .lp .nav-cta {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .lp .login-link {
    font-size: 13px;
    color: var(--text-mute);
    text-decoration: none;
  }
  .lp .login-link:hover { color: var(--blue); }
  .lp .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 600;
    padding: 10px 20px;
    border-radius: 3px;
    text-decoration: none;
    transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    cursor: pointer;
    border: 1px solid transparent;
  }
  .lp .btn-primary {
    background: linear-gradient(180deg, var(--blue-bright), var(--blue));
    color: #ffffff;
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.25) inset, 0 8px 20px -10px rgba(38, 87, 166, 0.55);
  }
  .lp .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 1px 0 rgba(255, 255, 255, 0.3) inset, 0 12px 24px -10px rgba(38, 87, 166, 0.65); }
  .lp .btn-ghost {
    border-color: var(--line);
    color: var(--text-dim);
    background: transparent;
  }
  .lp .btn-ghost:hover { border-color: var(--blue); color: var(--blue-deep); }
  .lp .nav .btn { padding: 9px 18px; font-size: 13px; }

  /* ---------- hero ---------- */
  .lp .hero {
    padding: 88px 24px 64px;
  }
  .lp .hero-inner {
    max-width: 1040px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1.05fr 0.85fr;
    gap: 56px;
    align-items: center;
  }
  .lp .hero h1 {
    font-size: 44px;
    line-height: 1.32;
    margin-top: 18px;
    color: var(--text);
  }
  .lp .hero h1 .accent { color: var(--blue); }
  .lp .hero-sub {
    margin-top: 22px;
    font-size: 15.5px;
    color: var(--text-dim);
    max-width: 46ch;
  }
  .lp .hero-cta {
    margin-top: 32px;
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  .lp .hero-note {
    margin-top: 16px;
    font-size: 12px;
    color: var(--text-mute);
  }

  /* receipt visual */
  .lp .receipt-stage {
    position: relative;
    display: flex;
    justify-content: center;
  }
  .lp .receipt-glow {
    position: absolute;
    inset: -40px;
    background: radial-gradient(circle at 50% 30%, rgba(38, 87, 166, 0.16), transparent 65%);
    filter: blur(6px);
    animation: lampGlow 7s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes lampGlow {
    0%, 100% { opacity: 0.75; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.04); }
  }
  .lp .receipt {
    position: relative;
    width: 300px;
    background: var(--paper);
    color: var(--paper-ink);
    font-family: var(--font-mono);
    padding: 30px 22px 24px;
    transform: rotate(-2.2deg);
    box-shadow: 0 30px 60px -20px rgba(22, 35, 58, 0.28), 0 4px 0 rgba(22, 35, 58, 0.06), 0 0 0 1px rgba(22, 35, 58, 0.04);
    clip-path: polygon(
      0% 0%, 12.5% 2.4%, 25% 0%, 37.5% 2.4%, 50% 0%, 62.5% 2.4%, 75% 0%, 87.5% 2.4%, 100% 0%,
      100% 100%, 87.5% 97.6%, 75% 100%, 62.5% 97.6%, 50% 100%, 37.5% 97.6%, 25% 100%, 12.5% 97.6%, 0% 100%
    );
  }
  .lp .receipt::after {
    content: "";
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(0deg, rgba(22,35,58,0.025) 0px, rgba(22,35,58,0.025) 1px, transparent 1px, transparent 3px);
    mix-blend-mode: multiply;
    pointer-events: none;
  }
  .lp .receipt-head { text-align: center; }
  .lp .receipt-shop { font-size: 14px; font-weight: 700; letter-spacing: 0.08em; }
  .lp .receipt-meta { font-size: 10.5px; color: var(--paper-ink-soft); margin-top: 4px; }
  .lp .receipt-rule { border-top: 1px dashed rgba(22, 38, 66, 0.22); margin: 12px 0; }
  .lp .receipt-row { display: flex; justify-content: space-between; font-size: 11.5px; margin: 5px 0; gap: 8px; }
  .lp .receipt-row .name { color: var(--paper-ink); }
  .lp .receipt-row .amt { color: var(--paper-ink); white-space: nowrap; }
  .lp .receipt-guest { font-size: 11px; color: var(--paper-ink-soft); display: flex; justify-content: space-between; }
  .lp .receipt-total .row { display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; }
  .lp .receipt-total .grand { font-size: 15px; font-weight: 700; margin-top: 6px; color: var(--blue-deep); }
  .lp .receipt-foot { font-size: 10.5px; color: var(--paper-ink-soft); margin-top: 12px; display: flex; justify-content: space-between; }
  .lp .receipt-stamp {
    position: absolute;
    right: 18px;
    top: 24px;
    width: 42px;
    height: 42px;
    border: 1.5px solid var(--stamp);
    color: var(--stamp);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 700;
    font-family: var(--font-body);
    transform: rotate(-14deg);
    opacity: 0.85;
  }

  /* ---------- ledger divider ---------- */
  .lp .divider {
    max-width: 1040px;
    margin: 0 auto;
    padding: 0 24px;
  }
  .lp .divider-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--line) 12%, var(--line) 88%, transparent);
    position: relative;
  }
  .lp .divider-line::before {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    width: 5px;
    height: 5px;
    background: var(--blue-dim);
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }

  /* ---------- section shell ---------- */
  .lp section { padding: 76px 0; }
  .lp .section-head { max-width: 620px; }
  .lp .section-head h2 { font-size: 30px; color: var(--text); }
  .lp .section-head p { margin-top: 14px; color: var(--text-dim); font-size: 15px; }

  .lp .reveal { opacity: 0; transform: translateY(18px); transition: opacity 0.7s ease, transform 0.7s ease; }
  .lp .reveal.in { opacity: 1; transform: translateY(0); }

  /* ---------- problem ---------- */
  .lp .problem-grid {
    margin-top: 36px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: var(--line);
    border: 1px solid var(--line);
  }
  .lp .problem-item {
    background: var(--surface);
    padding: 26px 24px;
  }
  .lp .problem-item .num {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--blue-dim);
    letter-spacing: 0.08em;
  }
  .lp .problem-item p {
    margin-top: 10px;
    font-size: 14.5px;
    color: var(--text);
  }

  /* ---------- features ---------- */
  .lp .feature-list {
    margin-top: 40px;
    display: flex;
    flex-direction: column;
  }
  .lp .feature-row {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 40px;
    padding: 34px 0;
    border-top: 1px solid var(--line);
  }
  .lp .feature-row:last-child { border-bottom: 1px solid var(--line); }
  .lp .feature-head { display: flex; gap: 14px; align-items: flex-start; }
  .lp .feature-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--blue-soft);
    color: var(--blue);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .lp .feature-head-text .tag {
    font-family: var(--font-mono);
    font-size: 10.5px;
    color: var(--text-mute);
    letter-spacing: 0.05em;
  }
  .lp .feature-head-text h3 {
    font-size: 20px;
    color: var(--text);
    margin-top: 4px;
  }
  .lp .feature-list-items {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 28px;
  }
  .lp .feature-list-items li {
    font-size: 14px;
    color: var(--text-dim);
    padding-left: 16px;
    position: relative;
  }
  .lp .feature-list-items li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 9px;
    width: 5px;
    height: 1px;
    background: var(--blue-dim);
  }

  /* ---------- multi-store ---------- */
  .lp .multi {
    background: var(--surface);
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }
  .lp .multi-inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    align-items: center;
  }
  .lp .multi-copy p { color: var(--text-dim); font-size: 15px; margin-top: 16px; }
  .lp .multi-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border: 1px solid var(--line);
    background: var(--bg);
  }
  .lp .multi-stat {
    padding: 20px 16px;
    border-right: 1px solid var(--line);
    text-align: center;
  }
  .lp .multi-stat:last-child { border-right: none; }
  .lp .multi-stat .label { font-size: 11px; color: var(--text-mute); }
  .lp .multi-stat .value {
    font-family: var(--font-mono);
    font-size: 22px;
    color: var(--blue);
    margin-top: 8px;
  }

  /* ---------- flow ---------- */
  .lp .flow-list {
    margin-top: 40px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
  }
  .lp .flow-step { position: relative; padding-top: 6px; }
  .lp .flow-step .step-no {
    font-family: var(--font-mono);
    font-size: 34px;
    color: transparent;
    -webkit-text-stroke: 1px var(--blue-dim);
    line-height: 1;
  }
  .lp .flow-step h3 { font-size: 17px; color: var(--text); margin-top: 12px; }
  .lp .flow-step p { font-size: 13.5px; color: var(--text-dim); margin-top: 8px; }

  .lp .audience-row {
    margin-top: 44px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .lp .audience-pill {
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--text-dim);
    font-size: 13px;
    padding: 8px 16px;
    border-radius: 999px;
  }

  /* ---------- contact ---------- */
  .lp .contact {
    background:
      radial-gradient(ellipse 60% 60% at 50% 0%, rgba(38, 87, 166, 0.08), transparent 65%),
      var(--bg);
    border-top: 1px solid var(--line);
  }
  .lp .contact-inner { text-align: center; max-width: 640px; margin: 0 auto; }
  .lp .contact h2 { font-size: 32px; }
  .lp .contact p.lede { margin-top: 16px; color: var(--text-dim); font-size: 15px; }
  .lp .contact-methods {
    margin-top: 36px;
    display: flex;
    justify-content: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  .lp .contact-form {
    margin-top: 48px;
    text-align: left;
    border: 1px solid var(--line);
    background: var(--surface);
    padding: 28px;
  }
  .lp .contact-form .form-note {
    font-size: 11.5px;
    color: var(--text-mute);
    margin-bottom: 18px;
  }
  .lp .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .lp .form-field { display: flex; flex-direction: column; gap: 6px; }
  .lp .form-field.full { grid-column: 1 / -1; }
  .lp .form-field label { font-size: 12px; color: var(--text-mute); }
  .lp .form-field input, .lp .form-field textarea {
    background: var(--bg);
    border: 1px solid var(--line);
    color: var(--text);
    font-family: var(--font-body);
    font-size: 14px;
    padding: 10px 12px;
    border-radius: 2px;
  }
  .lp .form-field textarea { resize: vertical; min-height: 88px; }
  .lp .form-field input:focus, .lp .form-field textarea:focus {
    outline: 2px solid var(--blue-dim);
    outline-offset: 1px;
  }
  .lp .contact-form .btn { margin-top: 18px; width: 100%; }

  .lp footer {
    padding: 40px 24px 48px;
    border-top: 1px solid var(--line);
    background: var(--surface);
  }
  .lp .footer-inner {
    max-width: 1040px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 20px;
  }
  .lp .footer-tag { font-size: 12px; color: var(--text-mute); margin-top: 6px; }
  .lp .footer-links { display: flex; gap: 20px; }
  .lp .footer-links a { font-size: 12.5px; color: var(--text-mute); text-decoration: none; }
  .lp .footer-links a:hover { color: var(--blue); }
  .lp .footer-copy { font-size: 11.5px; color: var(--text-mute); font-family: var(--font-mono); margin-top: 20px; }

  @media (max-width: 860px) {
    .lp .hero-inner { grid-template-columns: 1fr; }
    .lp .receipt-stage { order: -1; }
    .lp .hero h1 { font-size: 32px; }
    .lp .problem-grid { grid-template-columns: 1fr; }
    .lp .feature-row { grid-template-columns: 1fr; gap: 18px; }
    .lp .feature-list-items { grid-template-columns: 1fr; }
    .lp .multi-inner { grid-template-columns: 1fr; }
    .lp .flow-list { grid-template-columns: 1fr; }
    .lp .form-grid { grid-template-columns: 1fr; }
    .lp .nav-links { display: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .lp .reveal { transition: none; opacity: 1; transform: none; }
    .lp .receipt-glow { animation: none; }
  }
`;

const REVEAL_SCRIPT = `
  (function () {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var items = document.querySelectorAll(".reveal");
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    items.forEach(function (el) { io.observe(el); });
  })();

  var lpForm = document.getElementById("lp-contact-form");
  if (lpForm) {
    lpForm.addEventListener("submit", function (e) {
      e.preventDefault();
    });
  }
`;

export default function LandingPage() {
  return (
    <div className="lp">
      <style dangerouslySetInnerHTML={{ __html: LP_STYLES }} />

      <header className="nav">
        <div className="nav-inner">
          <a className="brand" href="#top">
            <img className="brand-icon" src="/logo-icon.png" alt="" />
            <span className="brand-text">
              <span className="brand-mark">
                Your <em>Manager</em>
              </span>
              <span className="brand-sub">BAR &amp; SNACK MANAGEMENT</span>
            </span>
          </a>
          <nav className="nav-links">
            <a href="#features">機能</a>
            <a href="#multi-store">複数店舗</a>
            <a href="#flow">導入の流れ</a>
          </nav>
          <div className="nav-cta">
            <a className="login-link" href="/login">
              ログイン
            </a>
            <a className="btn btn-primary" href="#contact">
              相談する
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-inner">
            <div className="reveal in">
              <p className="eyebrow">BAR / SNACK 向け 店舗管理アプリ</p>
              <h1>
                閉店後の<span className="accent">電卓</span>を、
                <br />
                閉じよう。
              </h1>
              <p className="hero-sub">
                伝票、歩合、経費、売上レポート。バー・スナックの「閉店後の1時間」を、 スマホひとつで終わらせる店舗管理アプリです。
              </p>
              <div className="hero-cta">
                <a className="btn btn-primary" href="#contact">
                  相談してみる
                </a>
                <a className="btn btn-ghost" href="#features">
                  機能を見る ↓
                </a>
              </div>
              <p className="hero-note">アカウントは店舗ごとの個別発行制です。まずは無料相談から。</p>
            </div>

            <div className="receipt-stage reveal in">
              <div className="receipt-glow"></div>
              <div className="receipt">
                <div className="receipt-head">
                  <div className="receipt-shop">SAMPLE BAR</div>
                  <div className="receipt-meta">2026.08.14&nbsp; 23:41</div>
                </div>
                <div className="receipt-rule"></div>
                <div className="receipt-guest">
                  <span>田中様</span>
                  <span>4名</span>
                </div>
                <div className="receipt-rule"></div>
                <div className="receipt-row">
                  <span className="name">生ビール ×2</span>
                  <span className="amt tabular">¥1,600</span>
                </div>
                <div className="receipt-row">
                  <span className="name">レモンサワー ×3</span>
                  <span className="amt tabular">¥2,100</span>
                </div>
                <div className="receipt-row">
                  <span className="name">ボトル(ウイスキー)</span>
                  <span className="amt tabular">¥12,000</span>
                </div>
                <div className="receipt-row">
                  <span className="name">チャージ ×4</span>
                  <span className="amt tabular">¥4,000</span>
                </div>
                <div className="receipt-rule"></div>
                <div className="receipt-total">
                  <div className="row">
                    <span>小計</span>
                    <span className="tabular">¥19,700</span>
                  </div>
                  <div className="row">
                    <span>消費税</span>
                    <span className="tabular">¥1,970</span>
                  </div>
                  <div className="row grand">
                    <span>合計</span>
                    <span className="tabular">¥21,700</span>
                  </div>
                </div>
                <div className="receipt-foot">
                  <span>担当：みさき</span>
                  <span>💳 カード</span>
                </div>
                <div className="receipt-stamp">PAID</div>
              </div>
            </div>
          </div>
        </section>

        <div className="divider">
          <div className="divider-line"></div>
        </div>

        <section className="problem">
          <div className="wrap">
            <div className="section-head reveal">
              <p className="eyebrow">こんな夜、ありませんか</p>
              <h2>
                数字が締まるまで、
                <br />
                帰れない。
              </h2>
            </div>
            <div className="problem-grid reveal">
              <div className="problem-item">
                <div className="num">01</div>
                <p>伝票は紙、集計はExcel、歩合は電卓。バラバラな管理で、算数が終わるまで帰れない。</p>
              </div>
              <div className="problem-item">
                <div className="num">02</div>
                <p>「今月、誰がどれだけ稼いだか」をスタッフに聞かれても、すぐには答えられない。</p>
              </div>
              <div className="problem-item">
                <div className="num">03</div>
                <p>複数店舗を経営していても、全店の数字が揃うのはいつも月末になってから。</p>
              </div>
            </div>
          </div>
        </section>

        <div className="divider">
          <div className="divider-line"></div>
        </div>

        <section id="features">
          <div className="wrap">
            <div className="section-head reveal">
              <p className="eyebrow">Features</p>
              <h2>
                ひとつのアプリで、
                <br />
                閉店までのすべてを。
              </h2>
              <p>お店の一日をそのまま、4つのタブに。伝票・経費・集計・設定 — 現場からオーナー業務まで、迷わず行き来できます。</p>
            </div>

            <div className="feature-list reveal">
              <div className="feature-row">
                <div className="feature-head">
                  <span className="feature-icon">
                    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2h12v20l-3-2-3 2-3-2-3 2Z" />
                      <path d="M9 8h6M9 12h6" />
                    </svg>
                  </span>
                  <div className="feature-head-text">
                    <div className="tag">01 / 伝票</div>
                    <h3>タップだけで、会計まで。</h3>
                  </div>
                </div>
                <ul className="feature-list-items">
                  <li>メニューはワンタップで追加。自由入力にも対応</li>
                  <li>担当スタッフを選ぶだけで、歩合を自動で記録</li>
                  <li>現金・カード・PayPayをボタン一つで会計（誤タップ防止の確認付き）</li>
                  <li>飲み放題コースの残り時間を自動で表示</li>
                  <li>伝票名はあとから編集OK。常連さんは名前検索でひと目</li>
                </ul>
              </div>

              <div className="feature-row">
                <div className="feature-head">
                  <span className="feature-icon">
                    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <circle cx="12" cy="12" r="3" />
                      <path d="M6 6v12M18 6v12" />
                    </svg>
                  </span>
                  <div className="feature-head-text">
                    <div className="tag">02 / 経費</div>
                    <h3>レシートは、撮るだけ記録。</h3>
                  </div>
                </div>
                <ul className="feature-list-items">
                  <li>経費をカテゴリ別に記録し、レシート写真をそのまま添付</li>
                  <li>時給スタッフの出退勤も、その場で入力して自動集計</li>
                </ul>
              </div>

              <div className="feature-row">
                <div className="feature-head">
                  <span className="feature-icon">
                    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3v18h18" />
                      <path d="M7 15l4-5 3 3 5-7" />
                    </svg>
                  </span>
                  <div className="feature-head-text">
                    <div className="tag">03 / 集計</div>
                    <h3>その日の数字は、その日のうちに。</h3>
                  </div>
                </div>
                <ul className="feature-list-items">
                  <li>売上・経費・人件費・粗利を日次／月次で自動集計</li>
                  <li>スタッフ別の歩合内訳もワンタップで確認</li>
                  <li>LINE報告文を自動生成。コピーしてそのまま送信</li>
                  <li>顧客検索で、来店履歴を全期間からいつでも呼び出し</li>
                  <li>リピーター分析・男女比率・平均滞在時間などの気づきも</li>
                </ul>
              </div>

              <div className="feature-row">
                <div className="feature-head">
                  <span className="feature-icon">
                    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z" />
                    </svg>
                  </span>
                  <div className="feature-head-text">
                    <div className="tag">04 / 設定</div>
                    <h3>店ごとのルールに、ちゃんと合わせる。</h3>
                  </div>
                </div>
                <ul className="feature-list-items">
                  <li>消費税率・営業日の切り替え時刻を店舗ごとに設定</li>
                  <li>歩合の計算方式を選択（一律％／ドリンクバック制）</li>
                  <li>メニュー・スタッフの管理、ブランドカラーのカスタマイズ</li>
                  <li>オーナー専用ページで、給与明細をPDF発行</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="multi" id="multi-store">
          <div className="wrap">
            <div className="multi-inner">
              <div className="multi-copy reveal">
                <p className="eyebrow">For Multi-store Owners</p>
                <h2>
                  複数店舗を
                  <br />
                  経営しているなら、なおさら。
                </h2>
                <p>
                  本部アカウントでログインすれば、全店舗の売上・組数・来店人数を
                  リアルタイムに横断確認できます。今、何組が入っているか。今月、
                  どの店が伸びているか。現場に電話をかけずに、数字で把握できます。
                </p>
              </div>
              <div className="multi-stats reveal">
                <div className="multi-stat">
                  <div className="label">対応中の組数</div>
                  <div className="value tabular">12</div>
                </div>
                <div className="multi-stat">
                  <div className="label">本日の売上（全店）</div>
                  <div className="value tabular">¥486K</div>
                </div>
                <div className="multi-stat">
                  <div className="label">更新間隔</div>
                  <div className="value tabular">15s</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="flow">
          <div className="wrap">
            <div className="section-head reveal">
              <p className="eyebrow">導入までの流れ</p>
              <h2>
                3ステップで、
                <br />
                使い始められます。
              </h2>
            </div>
            <div className="flow-list reveal">
              <div className="flow-step">
                <div className="step-no">01</div>
                <h3>お問い合わせ</h3>
                <p>LINEまたはメールで、今の伝票・集計の運用を教えてください。</p>
              </div>
              <div className="flow-step">
                <div className="step-no">02</div>
                <h3>アカウント発行</h3>
                <p>店舗情報・歩合の計算方式に合わせて、運営側でセットアップします。</p>
              </div>
              <div className="flow-step">
                <div className="step-no">03</div>
                <h3>利用開始</h3>
                <p>最短翌日から利用可能。使い方ガイドはアプリ内に用意しています。</p>
              </div>
            </div>

            <div className="audience-row reveal">
              <span className="audience-pill">バー</span>
              <span className="audience-pill">スナック</span>
              <span className="audience-pill">ガールズバー・キャバクラ等</span>
              <span className="audience-pill">歩合給のある夜のお店</span>
              <span className="audience-pill">複数店舗展開のグループ経営</span>
            </div>
          </div>
        </section>

        <section className="contact" id="contact">
          <div className="wrap contact-inner">
            <p className="eyebrow reveal">Contact</p>
            <h2 className="reveal">まずは、話を聞かせてください。</h2>
            <p className="lede reveal">
              今の運用（紙の伝票、Excelでの集計など）を教えていただければ、
              そのまま移行できるかも含めてご案内します。
            </p>
            <div className="contact-methods reveal">
              <a className="btn btn-primary" href="mailto:contact@example.com">
                メールで相談する
              </a>
              <a className="btn btn-ghost" href="#">
                LINEで相談する
              </a>
            </div>

            <form id="lp-contact-form" className="contact-form reveal">
              <p className="form-note">※ このフォームは下書き段階のため送信されません。実装時に送信先を接続します。</p>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="lp-store">店舗名</label>
                  <input id="lp-store" type="text" placeholder="例）BAR SAMPLE" />
                </div>
                <div className="form-field">
                  <label htmlFor="lp-name">お名前</label>
                  <input id="lp-name" type="text" placeholder="例）山田太郎" />
                </div>
                <div className="form-field full">
                  <label htmlFor="lp-email">メールアドレス</label>
                  <input id="lp-email" type="email" placeholder="example@mail.com" />
                </div>
                <div className="form-field full">
                  <label htmlFor="lp-message">ご相談内容</label>
                  <textarea id="lp-message" placeholder="現在の運用や、店舗数、気になる点などをご記入ください"></textarea>
                </div>
              </div>
              <button className="btn btn-primary" type="submit">
                この内容で相談する
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-inner">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img className="brand-icon" style={{ height: 24 }} src="/logo-icon.png" alt="" />
              <span className="brand-mark" style={{ fontSize: 16 }}>
                Your <em>Manager</em>
              </span>
            </div>
            <div className="footer-tag">夜のバー経営、まるごと管理。</div>
            <div className="footer-copy">© 2026 Your Manager</div>
          </div>
          <div className="footer-links">
            <a href="#features">機能</a>
            <a href="#flow">導入の流れ</a>
            <a href="#contact">お問い合わせ</a>
          </div>
        </div>
      </footer>

      <script dangerouslySetInnerHTML={{ __html: REVEAL_SCRIPT }} />
    </div>
  );
}
