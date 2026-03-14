"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type DayEvent = {
  attendanceId: string;
  title: string;
  artistName: string | null;
  venueLabel: string;
  memo: string | null;
};

type Props = {
  year: number;
  month: number;
  eventsByDate: Record<string, DayEvent[]>;
  prevHref: string;
  nextHref: string;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 2000 + 2 }, (_, i) => CURRENT_YEAR + 1 - i);

export function MyCalendar({ year, month, eventsByDate, prevHref, nextHref }: Props) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay();
  const leadingBlanks = startWeekday;
  const totalCells = leadingBlanks + daysInMonth;
  const rows = Math.ceil(totalCells / 7);

  const dateToKey = (y: number, m: number, d: number) =>
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] ?? [] : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={prevHref}
          className="rounded-button border-2 border-live-200 px-3 py-1.5 text-sm font-bold text-live-800 transition-colors hover:bg-live-50"
        >
          ← 前月
        </Link>
        <div className="flex items-center gap-1">
          <select
            aria-label="年"
            value={year}
            onChange={(e) => {
              const y = parseInt(e.target.value, 10);
              router.push(`/my/calendar?year=${y}&month=${month}`);
            }}
            className="rounded border-2 border-live-200 bg-white px-2 py-1.5 text-sm font-bold text-live-900"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            ))}
          </select>
          <select
            aria-label="月"
            value={month}
            onChange={(e) => {
              const m = parseInt(e.target.value, 10);
              router.push(`/my/calendar?year=${year}&month=${m}`);
            }}
            className="rounded border-2 border-live-200 bg-white px-2 py-1.5 text-sm font-bold text-live-900"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}月
              </option>
            ))}
          </select>
        </div>
        <Link
          href={nextHref}
          className="rounded-button border-2 border-live-200 px-3 py-1.5 text-sm font-bold text-live-800 transition-colors hover:bg-live-50"
        >
          翌月 →
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="py-2 text-center text-xs font-medium text-gray-600"
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: rows * 7 }, (_, i) => {
            const dayIndex = i - leadingBlanks;
            const isInMonth = dayIndex >= 1 && dayIndex <= daysInMonth;
            const day = dayIndex;
            const dateKey = isInMonth ? dateToKey(year, month, day) : "";
            const events = dateKey ? eventsByDate[dateKey] ?? [] : [];
            const hasEvents = events.length > 0;
            const isSelected = selectedDate === dateKey;

            return (
              <div
                key={i}
                className={`min-h-[3rem] border-b border-r border-gray-100 p-1 last:border-r-0 ${
                  !isInMonth ? "bg-gray-50/50" : ""
                } ${i % 7 === 6 ? "border-r-0" : ""}`}
              >
                {isInMonth ? (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(dateKey)}
                    className={`h-full w-full rounded-button text-left text-sm font-medium transition-colors ${
                      hasEvents
                        ? "bg-live-50 text-live-900 hover:bg-live-100"
                        : "text-gray-600 hover:bg-live-50/50"
                    } ${isSelected ? "ring-2 ring-live-400" : ""}`}
                  >
                    <span>{day}</span>
                    {hasEvents && (
                      <span className="ml-0.5 text-xs text-live-600">
                        ({events.length})
                      </span>
                    )}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="rounded-card border border-live-200 bg-surface-card p-4">
          <h3 className="text-sm font-bold text-live-900">
            {selectedDate} の公演
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">この日の記録はありません。</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {selectedEvents.map((ev) => (
                <li
                  key={ev.attendanceId}
                  className="flex items-start justify-between gap-2 rounded-button border border-live-100 bg-surface-muted/50 p-3 transition-colors hover:bg-live-50/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900">{ev.title}</p>
                    {ev.artistName && (
                      <p className="mt-0.5 text-sm text-live-700">{ev.artistName}</p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-600">{ev.venueLabel}</p>
                    {ev.memo && (
                      <p className="mt-1 text-xs text-gray-500">{ev.memo}</p>
                    )}
                  </div>
                  <Link
                    href={`/my/edit?id=${ev.attendanceId}`}
                    className="btn-secondary shrink-0 py-1 text-xs"
                  >
                    詳細
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
