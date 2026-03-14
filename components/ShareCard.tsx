"use client";

import { useRef, useCallback, useState } from "react";
import { toPng } from "html-to-image";
import Link from "next/link";

export type ShareStats = { totalEvents: number; totalVenues: number };

export type ArtistRankEntry = { name: string; count: number };

const RANKING_TOP_N = 8;

type Props = {
  displayName: string | null;
  statsAll: ShareStats;
  /** 年別の統計。キーは年（例: 2024） */
  statsByYear: Record<number, ShareStats>;
  /** 記録がある年一覧（降順） */
  years: number[];
  /** 全体のアーティスト別ランキング */
  artistRankingAll: ArtistRankEntry[];
  /** 年別のアーティスト別ランキング。キーは年 */
  artistRankingByYear: Record<number, ArtistRankEntry[]>;
};

export function ShareCard({
  displayName,
  statsAll,
  statsByYear,
  years,
  artistRankingAll,
  artistRankingByYear,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState<"all" | "year">("all");
  const [selectedYear, setSelectedYear] = useState<number | null>(
    years.length > 0 ? years[0] : null
  );

  const currentStats: ShareStats =
    period === "all"
      ? statsAll
      : selectedYear != null && statsByYear[selectedYear]
        ? statsByYear[selectedYear]
        : statsAll;

  const currentArtistRanking: ArtistRankEntry[] =
    period === "all"
      ? artistRankingAll
      : selectedYear != null && artistRankingByYear[selectedYear]
        ? artistRankingByYear[selectedYear]
        : artistRankingAll;

  const periodLabel =
    period === "all" ? "全体" : selectedYear != null ? `${selectedYear}年` : "全体";

  const handleDownload = useCallback(() => {
    if (!cardRef.current) return;
    toPng(cardRef.current, {
      cacheBust: true,
      backgroundColor: "#faf8f5",
      pixelRatio: 2,
    })
      .then((dataUrl) => {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `live-record-${period === "all" ? "all" : selectedYear}.png`;
        a.click();
      })
      .catch((err) => console.error("Download failed", err));
  }, [period, selectedYear]);

  const name = displayName?.trim() || "匿名";
  const topArtists = currentArtistRanking.slice(0, RANKING_TOP_N);

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        自分だけのランキング（全体 or 年別）を選んで、カードを画像で保存できます。
      </p>

      {/* 全体 / 年別 選択 */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="share-period"
              checked={period === "all"}
              onChange={() => setPeriod("all")}
              className="text-live-600"
            />
            <span className="text-sm font-medium">全体</span>
          </label>
          <label
            className={`flex items-center gap-2 ${years.length === 0 ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
          >
            <input
              type="radio"
              name="share-period"
              checked={period === "year"}
              onChange={() => years.length > 0 && setPeriod("year")}
              disabled={years.length === 0}
              className="text-live-600"
            />
            <span className="text-sm font-medium">年別</span>
          </label>
        </div>
        {period === "year" && years.length > 0 && (
          <select
            value={selectedYear ?? ""}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            ))}
          </select>
        )}
      </div>

      <div
        ref={cardRef}
        className="w-full max-w-md rounded-2xl border-2 border-live-200 bg-surface p-6 shadow-card"
      >
        <p className="text-xs font-bold uppercase tracking-wider text-live-600">
          ライブ記録
        </p>
        <p className="mt-2 text-xl font-bold text-live-900">
          {name}さんの記録 {periodLabel}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-live-600">
              {currentStats.totalEvents}
            </p>
            <p className="text-xs text-gray-600">公演数</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-live-600">
              {currentStats.totalVenues}
            </p>
            <p className="text-xs text-gray-600">会場数</p>
          </div>
        </div>

        <p className="mt-5 text-sm font-bold text-gray-700">
          アーティスト別の回数
        </p>
        {topArtists.length === 0 ? (
          <p className="mt-2 text-xs text-gray-500">この期間のデータはありません</p>
        ) : (
          <ol className="mt-2 space-y-1.5">
            {topArtists.map(({ name: artistName, count }, i) => (
              <li
                key={`${artistName}-${i}`}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={
                      i < 3
                        ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-live-100 text-xs font-bold text-live-800"
                        : "flex h-4 w-4 shrink-0 items-center justify-center text-xs font-bold text-gray-400"
                    }
                  >
                    {i + 1}
                  </span>
                  <span className="truncate font-medium text-gray-900">
                    {artistName}
                  </span>
                </span>
                <span className="shrink-0 font-bold text-live-600">
                  {count}
                  <span className="ml-0.5 text-gray-500">回</span>
                </span>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-4 text-center text-xs text-gray-500">
          #ライブ記録
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleDownload}
          className="btn-primary"
        >
          画像をダウンロード
        </button>
        <Link href="/profile" className="btn-secondary">
          設定に戻る
        </Link>
      </div>
    </div>
  );
}
