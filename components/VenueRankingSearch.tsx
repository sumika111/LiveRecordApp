"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export type VenueVisitEntry = {
  rank: number;
  venueId: string;
  venueLabel: string;
  count: number;
};

type Props = {
  initialVenues: VenueVisitEntry[];
  currentVenueId: string | null;
  basePath: string;
  queryString: string;
  periodLabel: string;
  emptyMessage?: string;
};

export function VenueRankingSearch({
  initialVenues,
  currentVenueId,
  basePath,
  queryString,
  periodLabel,
  emptyMessage = "まだデータがありません。",
}: Props) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<VenueVisitEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const yearMatch = queryString.match(/year=(\d+)/);
  const year = yearMatch ? yearMatch[1] : undefined;

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      setOpen(false);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setLoading(true);
      const url = year
        ? `/api/venues/ranking?q=${encodeURIComponent(query.trim())}&year=${year}`
        : `/api/venues/ranking?q=${encodeURIComponent(query.trim())}`;
      fetch(url)
        .then((res) => res.json())
        .then((data: { venues?: VenueVisitEntry[] }) => {
          setSearchResults(data.venues ?? []);
          setOpen(true);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, year]);

  const list = searchResults !== null ? searchResults : initialVenues;
  const showSearchDropdown = open && query.trim().length > 0;

  const buildHref = (venueId: string) => {
    const params = new URLSearchParams(queryString || undefined);
    params.set("venue", venueId);
    return `${basePath}?${params.toString()}`;
  };

  return (
    <>
      <div className="relative">
        <label htmlFor="venue-ranking-search" className="sr-only">
          会場名で検索
        </label>
        <input
          id="venue-ranking-search"
          type="text"
          placeholder="会場名で検索してユーザーランキングを表示"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="w-full rounded-button border-2 border-live-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-live-400 focus:outline-none"
          autoComplete="off"
        />
        {showSearchDropdown && (list.length > 0 || loading) && (
          <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-button border border-live-200 bg-white shadow-card">
            {loading ? (
              <li className="px-4 py-3 text-sm text-gray-500">検索中...</li>
            ) : list.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-500">該当する会場がありません。</li>
            ) : (
              list.map((e) => {
                const href = buildHref(e.venueId);
                const isSelected = currentVenueId === e.venueId;
                return (
                  <li key={e.venueId}>
                    <Link
                      href={href}
                      className={`block px-4 py-2.5 text-left text-sm font-bold hover:bg-live-50 ${
                        isSelected ? "bg-live-100 text-live-900" : "text-gray-900"
                      }`}
                    >
                      {e.venueLabel}
                      <span className="ml-1 text-xs font-normal text-gray-500">
                        {e.count}回
                      </span>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      {!showSearchDropdown && (
        <>
          {initialVenues.length === 0 ? (
            <p className="mt-4 text-gray-500">{emptyMessage}</p>
          ) : (
            <ol className="mt-4 space-y-2">
              {initialVenues.map((e) => {
                const href = buildHref(e.venueId);
                const isSelected = currentVenueId === e.venueId;
                return (
                  <li key={`${e.rank}-${e.venueId}`}>
                    <Link
                      href={href}
                      className={`flex items-center justify-between rounded-button border px-4 py-2 transition-colors ${
                        isSelected
                          ? "border-live-500 bg-live-100 text-live-900"
                          : "border-live-100 bg-surface-muted/50 hover:bg-live-50/50"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={
                            e.rank <= 3
                              ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-live-100 text-sm font-bold text-live-800"
                              : "text-sm font-medium text-gray-500"
                          }
                        >
                          {e.rank}
                        </span>
                        <span className="font-bold text-gray-900">{e.venueLabel}</span>
                      </span>
                      <span className="text-sm font-bold text-live-600">
                        {e.count}
                        <span className="ml-0.5 text-gray-500">回（合計）</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}
    </>
  );
}
