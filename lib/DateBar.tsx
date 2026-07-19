"use client";

import { useBusinessDate } from "@/lib/BusinessDateContext";

export function DateBar() {
  const { date, setDate, isToday, goToday, shiftDay } = useBusinessDate();

  return (
    <div className="flex items-center justify-between gap-2 mb-3 bg-elevated border border-line rounded-xl px-2 py-2">
      <button onClick={() => shiftDay(-1)} className="text-gray-300 px-2 py-1 text-lg leading-none">
        ◀
      </button>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-bg2 border border-line rounded-md px-2 py-1.5 text-sm"
        />
        {isToday ? (
          <span className="text-xs text-gold font-bold">本日</span>
        ) : (
          <button
            onClick={goToday}
            className="text-xs text-gold border border-dashed border-gold rounded-md px-2 py-1"
          >
            今日に戻る
          </button>
        )}
      </div>
      <button onClick={() => shiftDay(1)} className="text-gray-300 px-2 py-1 text-lg leading-none">
        ▶
      </button>
    </div>
  );
}
