"use client";

import { useState } from "react";

export type ChartPoint = { day: number; date: string; total: number };

function yen(n: number) {
  return `¥${Math.round(n).toLocaleString()}`;
}

export function MonthlySalesChart({
  series,
  onSelectDate,
}: {
  series: ChartPoint[];
  onSelectDate: (date: string) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  if (series.length === 0) return null;

  const width = 720;
  const height = 220;
  const padLeft = 44;
  const padRight = 8;
  const padTop = 12;
  const padBottom = 22;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const max = Math.max(1, ...series.map((p) => p.total));
  const n = series.length;

  const x = (i: number) => padLeft + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => padTop + innerH - (v / max) * innerH;

  const linePath = series.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.total)}`).join(" ");

  // 混雑しないよう、日付ラベルは間引いて表示する
  const labelStep = n > 15 ? 5 : n > 8 ? 2 : 1;

  function selectIndex(i: number) {
    setSelected(i);
    onSelectDate(series[i].date);
  }

  const sel = selected != null ? series[selected] : null;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="月間売上の推移グラフ">
        {/* recessive gridlines */}
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={padLeft}
            x2={width - padRight}
            y1={padTop + innerH * (1 - f)}
            y2={padTop + innerH * (1 - f)}
            stroke="#2C3157"
            strokeWidth={1}
          />
        ))}
        {[0, 0.5, 1].map((f) => (
          <text key={f} x={padLeft - 6} y={padTop + innerH * (1 - f) + 3} textAnchor="end" fontSize={9} fill="#8A8FA8">
            {yen(max * f)}
          </text>
        ))}

        <path d={linePath} fill="none" stroke="#DCA84E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {series.map((p, i) => (
          <g key={p.date}>
            {/* 当たり判定を広げるための透明な円 */}
            <circle cx={x(i)} cy={y(p.total)} r={12} fill="transparent" onClick={() => selectIndex(i)} style={{ cursor: "pointer" }} />
            <circle
              cx={x(i)}
              cy={y(p.total)}
              r={selected === i ? 6 : 4}
              fill={selected === i ? "#DCA84E" : "#1E2342"}
              stroke="#DCA84E"
              strokeWidth={2}
            />
          </g>
        ))}

        {selected != null && (
          <line
            x1={x(selected)}
            x2={x(selected)}
            y1={padTop}
            y2={padTop + innerH}
            stroke="#DCA84E"
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.5}
          />
        )}

        {series.map((p, i) =>
          i % labelStep === 0 || i === n - 1 ? (
            <text key={p.date} x={x(i)} y={height - 4} textAnchor="middle" fontSize={9} fill="#8A8FA8">
              {p.day}
            </text>
          ) : null
        )}
      </svg>

      {sel && (
        <div className="mt-2 rounded-lg bg-bg2 border border-line px-3 py-2 text-sm flex justify-between items-center">
          <span className="text-gray-300">{sel.date}</span>
          <span className="font-mono text-gold font-bold">{yen(sel.total)}</span>
        </div>
      )}
    </div>
  );
}
