"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  order: "asc" | "desc";
  filterYear: string;
  filterArtist: string;
  filterVenueId: string;
  years: string[];
  artists: { name: string }[];
  venues: { id: string; label: string }[];
};

export function MyListFilters({
  order,
  filterYear,
  filterArtist,
  filterVenueId,
  years,
  artists,
  venues,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value == null || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    const q = next.toString();
    router.push(q ? `/my/list?${q}` : "/my/list");
  }

  return (
    <div className="rounded-card border border-live-100 bg-live-50/30 p-3">
      <p className="mb-2 text-xs font-bold text-gray-600">絞り込み</p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-sm">
          <span className="text-gray-600">日付</span>
          <select
            value={order}
            onChange={(e) => updateParam("order", e.target.value)}
            className="rounded-button border border-live-200 bg-white px-2 py-1.5 text-sm text-gray-900"
          >
            <option value="desc">新しい順</option>
            <option value="asc">古い順</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <span className="text-gray-600">年</span>
          <select
            value={filterYear}
            onChange={(e) => updateParam("year", e.target.value)}
            className="rounded-button border border-live-200 bg-white px-2 py-1.5 text-sm text-gray-900 min-w-[4.5rem]"
          >
            <option value="">すべて</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <span className="text-gray-600">アーティスト</span>
          <select
            value={filterArtist}
            onChange={(e) => updateParam("artist", e.target.value)}
            className="rounded-button border border-live-200 bg-white px-2 py-1.5 text-sm text-gray-900 max-w-[180px]"
          >
            <option value="">すべて</option>
            {artists.map(({ name }) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <span className="text-gray-600">会場</span>
          <select
            value={filterVenueId}
            onChange={(e) => updateParam("venue", e.target.value)}
            className="rounded-button border border-live-200 bg-white px-2 py-1.5 text-sm text-gray-900 max-w-[200px]"
          >
            <option value="">すべて</option>
            {venues.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
