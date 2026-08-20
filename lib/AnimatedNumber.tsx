"use client";

import { useEffect, useRef, useState } from "react";

// 金額などの数字が変わるとき、旧値から新値へアニメーションしながらカウントする。
// 増加時は一瞬光らせて「反映された」感を出す。
export function AnimatedNumber({
  value,
  prefix = "",
  className,
}: {
  value: number;
  prefix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const [flash, setFlash] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = to;
    if (from === to) return;

    const increased = to > from;
    if (increased) setFlash(true);

    const duration = 450;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const flashTimer = increased ? setTimeout(() => setFlash(false), 550) : null;

    return () => {
      cancelAnimationFrame(raf);
      if (flashTimer) clearTimeout(flashTimer);
    };
  }, [value]);

  return (
    <span className={`${className ?? ""} ${flash ? "animate-number-flash" : ""}`}>
      {prefix}
      {display.toLocaleString()}
    </span>
  );
}
