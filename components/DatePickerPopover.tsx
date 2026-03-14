"use client";

import { useState, useRef, useEffect } from "react";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 2000 + 2 }, (_, i) => CURRENT_YEAR + 1 - i);

type Props = {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  id?: string;
  className?: string;
};

function toValue(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function DatePickerPopover({ value, onChange, id, className }: Props) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    if (value && value.length >= 4) return parseInt(value.slice(0, 4), 10);
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (value && value.length >= 7) return parseInt(value.slice(5, 7), 10);
    return new Date().getMonth() + 1;
  });
  const [pickedDay, setPickedDay] = useState<number | null>(() => {
    if (value && value.length >= 10) return parseInt(value.slice(8, 10), 10);
    return null;
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const displayText = value ? value.replace(/-/g, "/") : "";

  useEffect(() => {
    if (!open) return;
    if (value && value.length >= 10) {
      const [y, m, d] = value.split("-").map(Number);
      setViewYear(y);
      setViewMonth(m);
      setPickedDay(d);
    } else {
      const t = new Date();
      setViewYear(t.getFullYear());
      setViewMonth(t.getMonth() + 1);
      setPickedDay(t.getDate());
    }
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const lastDay = new Date(viewYear, viewMonth, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
  const leadingBlanks = firstWeekday;
  const totalCells = leadingBlanks + lastDay;
  const rows = Math.ceil(totalCells / 7);

  const handleOk = () => {
    const d = pickedDay ?? 1;
    const clamped = Math.min(d, new Date(viewYear, viewMonth, 0).getDate());
    onChange(toValue(viewYear, viewMonth, clamped));
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewYear(viewYear - 1);
      setViewMonth(12);
    } else {
      setViewMonth(viewMonth - 1);
    }
    setPickedDay(null);
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewYear(viewYear + 1);
      setViewMonth(1);
    } else {
      setViewMonth(viewMonth + 1);
    }
    setPickedDay(null);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => setOpen(true)}
        className={`flex w-full items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-900 ${className ?? ""}`}
        aria-label="日付を選択"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="text-gray-500" aria-hidden>
          📅
        </span>
        <span className={displayText ? "" : "text-gray-400"}>
          {displayText || "日付を選択"}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="日付選択"
          className="absolute left-0 top-full z-50 mt-1 w-[min(320px,90vw)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          {/* ヘッダー: 日付選択 〇月〇日(曜) */}
          <div className="bg-live-600 px-3 py-2 text-white">
            <p className="text-xs font-medium opacity-90">日付選択</p>
            <p className="text-sm font-bold">
              {viewYear}年{viewMonth}月
              {pickedDay != null
                ? ` ${pickedDay}日(${WEEKDAYS[new Date(viewYear, viewMonth - 1, pickedDay).getDay()]})`
                : ""}
            </p>
          </div>

          {/* 〇年〇月 プルダウン + 前月・翌月 */}
          <div className="flex flex-wrap items-center gap-1 border-b border-gray-100 p-2">
            <select
              aria-label="年"
              value={viewYear}
              onChange={(e) => {
                setViewYear(parseInt(e.target.value, 10));
                setPickedDay(null);
              }}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </select>
            <select
              aria-label="月"
              value={viewMonth}
              onChange={(e) => {
                setViewMonth(parseInt(e.target.value, 10));
                setPickedDay(null);
              }}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}月
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={prevMonth}
              aria-label="前月"
              className="ml-1 rounded p-1 text-gray-600 hover:bg-gray-100"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="翌月"
              className="rounded p-1 text-gray-600 hover:bg-gray-100"
            >
              ›
            </button>
          </div>

          {/* カレンダーグリッド */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="py-1.5 text-center text-xs font-medium text-gray-500"
              >
                {w}
              </div>
            ))}
            {Array.from({ length: rows * 7 }, (_, i) => {
              const dayOfMonth = i - leadingBlanks + 1; // 1日 = leadingBlanks のセル
              const isInMonth = dayOfMonth >= 1 && dayOfMonth <= lastDay;
              const day = dayOfMonth;
              const isSelected = isInMonth && pickedDay === day;
              const isToday =
                isInMonth &&
                viewYear === new Date().getFullYear() &&
                viewMonth === new Date().getMonth() + 1 &&
                day === new Date().getDate();
              return (
                <div
                  key={i}
                  className={`min-h-[2.25rem] border-r border-b border-gray-50 last:border-r-0 ${
                    !isInMonth ? "bg-gray-50/50" : ""
                  }`}
                >
                  {isInMonth ? (
                    <button
                      type="button"
                      onClick={() => setPickedDay(day)}
                      className={`h-full w-full text-sm transition-colors ${
                        isSelected
                          ? "bg-live-500 text-white"
                          : isToday
                            ? "bg-live-100 text-live-800"
                            : "text-gray-700 hover:bg-live-50"
                      }`}
                    >
                      {day}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* キャンセル / OK */}
          <div className="flex justify-end gap-2 p-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleOk}
              className="rounded bg-live-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-live-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
