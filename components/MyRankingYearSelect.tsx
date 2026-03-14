"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  period: string;
  year: number;
  currentYear: number;
};

export function MyRankingYearSelect({ period, year, currentYear }: Props) {
  const router = useRouter();
  const yearButtons = [currentYear, currentYear - 1, currentYear - 2];
  const olderYears = Array.from(
    { length: Math.max(0, currentYear - 2 - 2000) },
    (_, i) => currentYear - 3 - i
  );

  return (
    <div className="mt-4">
      <p className="text-sm font-bold text-gray-700">年を選択</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {yearButtons.map((y) => {
          const active = y === year;
          return (
            <Link
              key={y}
              href={`/my/ranking?period=year&year=${y}`}
              className={`rounded-button border px-3 py-1.5 text-sm font-bold transition-colors ${active ? "border-live-500 bg-live-50 text-live-800" : "border-gray-200 bg-white text-gray-700 hover:bg-live-50"}`}
            >
              {y}年
            </Link>
          );
        })}
        {olderYears.length > 0 && (
          <select
            aria-label="それ以前の年"
            value={yearButtons.includes(year) ? "" : year}
            onChange={(e) => {
              const v = e.target.value;
              if (v) router.push(`/my/ranking?period=year&year=${v}`);
            }}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
          >
            <option value="">それ以前</option>
            {olderYears.map((y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
