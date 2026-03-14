"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export function ArtistSearchYear({
  year,
  selectedArtist,
}: {
  year: number;
  selectedArtist: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setLoading(true);
      fetch(
        `/api/artists/suggest?q=${encodeURIComponent(query.trim())}&year=${year}`
      )
        .then((res) => res.json())
        .then((data: { suggestions?: string[] }) => {
          setSuggestions(data.suggestions ?? []);
          setOpen(true);
        })
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, year]);

  function select(name: string) {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    router.push(
      `/ranking/period?type=year&year=${year}&artist=${encodeURIComponent(name)}`
    );
  }

  return (
    <div className="relative">
      <label htmlFor="artist-search-year" className="sr-only">
        アーティスト名で検索
      </label>
      <input
        id="artist-search-year"
        type="text"
        placeholder="アーティスト名で検索してユーザーランキングを表示"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-button border-2 border-live-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-live-400 focus:outline-none"
        autoComplete="off"
      />
      {open && (suggestions.length > 0 || loading) && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-button border border-live-200 bg-white shadow-card">
          {loading ? (
            <li className="px-4 py-3 text-sm text-gray-500">検索中...</li>
          ) : (
            suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => select(s)}
                  className="w-full px-4 py-2.5 text-left text-sm font-bold text-gray-900 hover:bg-live-50"
                >
                  {s}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
      {selectedArtist && (
        <p className="mt-1 text-sm text-live-700">
          表示中: 「{selectedArtist}」のユーザーランキング
        </p>
      )}
    </div>
  );
}
