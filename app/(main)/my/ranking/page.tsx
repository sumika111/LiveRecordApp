import Link from "next/link";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { MyRankingYearSelect } from "@/components/MyRankingYearSelect";

type Row = {
  id: string;
  events: {
    id: string;
    event_date: string;
    title: string;
    artist_name: string | null;
    memo: string | null;
    venues: { name: string; prefecture: string; city: string | null } | null;
    event_artists: Array<{ artist_name: string }> | null;
  } | null;
};

type Params = {
  searchParams: Promise<{ period?: string; year?: string }>;
};

export default async function MyRankingPage({ searchParams }: Params) {
  const user = await getOptionalUser();
  if (!user) redirect("/login");

  const { period = "all", year: yearStr } = await searchParams;
  const now = new Date();
  const currentYear = now.getFullYear();
  const year = yearStr ? parseInt(yearStr, 10) : currentYear;

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("attendances")
    .select("id, events(id, event_date, title, artist_name, memo, venues(name, prefecture, city), event_artists(artist_name))")
    .eq("user_id", user.id);

  const allList = (rows ?? []) as unknown as Row[];

  const filterByPeriod = (rows: Row[]) => {
    if (period === "all") return rows;
    return rows.filter((row) => {
      const d = row.events?.event_date;
      if (!d) return false;
      const y = parseInt(d.split("-")[0], 10);
      return y === year;
    });
  };
  const filteredList = filterByPeriod(allList);

  const artistCounts = filteredList.reduce<Map<string, number>>((acc, row) => {
    const e = row.events;
    if (!e) return acc;
    const artists: string[] =
      e.event_artists && e.event_artists.length > 0
        ? e.event_artists.map((a) => a.artist_name.trim()).filter(Boolean)
        : e.artist_name?.trim()
          ? [e.artist_name.trim()]
          : [];
    artists.forEach((name) => {
      acc.set(name, (acc.get(name) ?? 0) + 1);
    });
    return acc;
  }, new Map());
  const artistList = Array.from(artistCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const venueCounts = filteredList.reduce<Map<string, { label: string; count: number }>>((acc, row) => {
    const v = row.events?.venues;
    if (!v) return acc;
    const name = (v as { name: string }).name;
    const prefecture = (v as { prefecture: string }).prefecture;
    const city = (v as { city: string | null }).city;
    const key = `${name}|${prefecture}`;
    const label = city ? `${name}（${prefecture} ${city}）` : `${name}（${prefecture}）`;
    const cur = acc.get(key);
    if (cur) {
      cur.count += 1;
    } else {
      acc.set(key, { label, count: 1 });
    }
    return acc;
  }, new Map());
  const venueList = Array.from(venueCounts.values())
    .sort((a, b) => b.count - a.count);

  const eventCount = filteredList.length;
  const venueKeys = new Set<string>();
  filteredList.forEach((row) => {
    const v = row.events?.venues;
    if (v) venueKeys.add(`${(v as { name: string }).name}|${(v as { prefecture: string }).prefecture}`);
  });
  const venueCount = venueKeys.size;

  const periodLabel = period === "year" ? `${year}年` : "全体";

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight text-live-900">
        自分だけのランキング
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        公演数・会場数・アーティスト別・会場別の回数を期間で絞って表示。全体 or 年別で切り替えられます。
      </p>

      <div className="mt-6 flex gap-1 rounded-button border border-live-200 bg-surface-muted p-1">
        <Link
          href="/my/ranking"
          className={`rounded-button px-4 py-2 text-sm font-bold transition-colors ${period === "all" ? "bg-surface-card text-live-900 shadow-card" : "text-gray-600 hover:text-live-800"}`}
        >
          全体
        </Link>
        <Link
          href={`/my/ranking?period=year&year=${currentYear}`}
          className={`rounded-button px-4 py-2 text-sm font-bold transition-colors ${period === "year" ? "bg-surface-card text-live-900 shadow-card" : "text-gray-600 hover:text-live-800"}`}
        >
          年別
        </Link>
      </div>

      {period === "year" && (
        <MyRankingYearSelect period={period} year={year} currentYear={currentYear} />
      )}

      <p className="mt-4 text-sm font-bold text-live-900">表示中: {periodLabel}</p>
      <div className="mt-2 flex gap-4 text-sm">
        <span className="text-gray-600">
          公演数: <span className="font-bold text-live-600">{eventCount}</span>件
        </span>
        <span className="text-gray-600">
          会場数: <span className="font-bold text-live-600">{venueCount}</span>会場
        </span>
      </div>

      <p className="mt-6 text-sm font-bold text-gray-700">アーティスト別の回数</p>
      {artistList.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">この期間のデータはありません。</p>
      ) : (
        <ol className="mt-4 space-y-2">
          {artistList.map(({ name, count }, i) => {
            const rank = i + 1;
            const isTop3 = rank <= 3;
            const isTop10 = rank <= 10;
            return (
              <li
                key={name}
                className="flex items-center justify-between rounded-button border border-live-100 bg-surface-muted/50 px-4 py-2 transition-colors hover:bg-live-50/50"
              >
                <span className="flex items-center gap-3">
                  <span
                    className={
                      isTop3
                        ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-live-100 text-sm font-bold text-live-800"
                        : isTop10
                          ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600"
                          : "flex h-5 w-5 shrink-0 items-center justify-center text-xs font-bold text-gray-400"
                    }
                  >
                    {rank}
                  </span>
                  <span className="font-bold text-gray-900">{name}</span>
                </span>
                <span className="text-sm font-bold text-live-600">
                  {count}
                  <span className="ml-0.5 text-gray-500">回</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <p className="mt-8 text-sm font-bold text-gray-700">会場別の回数（何回行ったか）</p>
      {venueList.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">この期間のデータはありません。</p>
      ) : (
        <ol className="mt-4 space-y-2">
          {venueList.map(({ label, count }, i) => {
            const rank = i + 1;
            const isTop3 = rank <= 3;
            const isTop10 = rank <= 10;
            return (
              <li
                key={label}
                className="flex items-center justify-between rounded-button border border-live-100 bg-surface-muted/50 px-4 py-2 transition-colors hover:bg-live-50/50"
              >
                <span className="flex items-center gap-3">
                  <span
                    className={
                      isTop3
                        ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-live-100 text-sm font-bold text-live-800"
                        : isTop10
                          ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600"
                          : "flex h-5 w-5 shrink-0 items-center justify-center text-xs font-bold text-gray-400"
                    }
                  >
                    {rank}
                  </span>
                  <span className="font-bold text-gray-900">{label}</span>
                </span>
                <span className="text-sm font-bold text-live-600">
                  {count}
                  <span className="ml-0.5 text-gray-500">回</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <Link
        href="/my"
        className="mt-8 inline-block text-sm font-bold text-live-600 hover:underline"
      >
        ← マイ記録へ戻る
      </Link>
    </>
  );
}
