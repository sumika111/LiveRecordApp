import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { formatEventArtists } from "@/lib/eventArtists";

type Row = {
  id: string;
  memo: string | null;
  photo_url: string | null;
  events: {
    id: string;
    event_date: string;
    title: string;
    artist_name: string | null;
    venues: { name: string; prefecture: string; city: string | null } | null;
    event_artists: Array<{ artist_name: string }> | null;
  } | null;
};

const RECENT_LIMIT = 10;

export default async function MyRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const user = await getOptionalUser();
  if (!user) redirect("/login");

  const { order } = await searchParams;
  const isAsc = order === "asc";

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("attendances")
    .select("id, memo, photo_url, events(id, event_date, title, artist_name, venues(name, prefecture, city), event_artists(artist_name))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const allList = (rows ?? []) as unknown as Row[];
  const sortedList = [...allList].sort((a, b) => {
    const dateA = a.events?.event_date ?? "";
    const dateB = b.events?.event_date ?? "";
    if (!dateA || !dateB) return 0;
    return isAsc ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
  });
  const recentList = sortedList.slice(0, RECENT_LIMIT);
  const totalCount = sortedList.length;
  const hasMore = totalCount > RECENT_LIMIT;
  const orderParam = isAsc ? "asc" : "desc";

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight text-live-900">マイ記録</h1>
      <p className="mt-1 text-sm text-gray-600">
        最近の記録と、カレンダー・ランキングへの入口です。
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/my/calendar"
          className="card flex flex-col border-2 border-live-200 bg-live-50/50 hover:border-live-300"
        >
          <span className="text-lg font-bold text-live-900">カレンダーで見る</span>
          <span className="mt-1 text-sm text-live-800">
            日付ごとに何のライブに行ったか確認
          </span>
        </Link>
        <Link
          href="/my/ranking"
          className="card flex flex-col border-2 border-live-200 bg-live-50/50 hover:border-live-300"
        >
          <span className="text-lg font-bold text-live-900">自分だけのランキング</span>
          <span className="mt-1 text-sm text-live-800">
            公演数・会場数・アーティスト別（月別・年別）
          </span>
        </Link>
        <Link
          href="/my/map"
          className="card flex flex-col border-2 border-live-200 bg-live-50/50 hover:border-live-300"
        >
          <span className="text-lg font-bold text-live-900">マップで見る</span>
          <span className="mt-1 text-sm text-live-800">
            会場を地図にピン表示、タップで行ったライブ一覧
          </span>
        </Link>
      </div>

      <h2 className="mt-8 text-lg font-bold text-live-900">
        最近の記録（{recentList.length}件）
      </h2>
      {totalCount === 0 ? (
        <p className="mt-4 text-gray-500">
          まだ記録がありません。「記録する」から追加してください。
        </p>
      ) : (
        <>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-gray-500">日付順:</span>
            <Link
              href="/my?order=desc"
              className={`rounded-button px-3 py-1 text-sm font-bold transition-colors ${!isAsc ? "bg-live-100 text-live-800" : "text-gray-600 hover:bg-live-50"}`}
            >
              新しい順
            </Link>
            <Link
              href="/my?order=asc"
              className={`rounded-button px-3 py-1 text-sm font-bold transition-colors ${isAsc ? "bg-live-100 text-live-800" : "text-gray-600 hover:bg-live-50"}`}
            >
              古い順
            </Link>
          </div>
          <ul className="mt-3 space-y-3">
            {recentList.map((row) => {
              const e = row.events;
              if (!e) return null;
              const v = e.venues;
              const venueLabel = v ? `${v.name}（${v.prefecture}${v.city ? ` ${v.city}` : ""}）` : "—";
              return (
                <li key={row.id} className="card">
                  <div className="flex items-start gap-3">
                    {row.photo_url ? (
                      <Link href={`/my/record/${row.id}`} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                        <Image
                          src={row.photo_url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="56px"
                          unoptimized
                        />
                      </Link>
                    ) : (
                      <div className="h-14 w-14 shrink-0 rounded-lg bg-surface-muted" aria-hidden />
                    )}
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                      <Link href={`/my/record/${row.id}`} className="min-w-0 flex-1 block">
                        <p className="font-bold text-gray-900">{e.title}</p>
                        {(e.artist_name || (e.event_artists && e.event_artists.length > 0)) && (
                          <p className="mt-0.5 text-sm text-live-700">{formatEventArtists(e)}</p>
                        )}
                        <p className="mt-0.5 text-sm text-gray-600">
                          {e.event_date} ／ {venueLabel}
                        </p>
                        {row.memo?.trim() && (
                          <p className="mt-1 text-sm text-gray-500 line-clamp-1">{row.memo}</p>
                        )}
                      </Link>
                      <Link
                        href={`/my/edit?id=${row.id}`}
                        className="btn-secondary shrink-0 py-1.5 text-sm"
                      >
                        編集
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {hasMore && (
            <p className="mt-4">
              <Link
                href={`/my/list?order=${orderParam}`}
                className="btn-secondary inline-block"
              >
                全件を見る（あと{totalCount - RECENT_LIMIT}件）
              </Link>
            </p>
          )}
        </>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/record" className="btn-primary">
          もう1件記録する
        </Link>
        {totalCount > 0 && (
          <Link href={`/my/list?order=desc`} className="btn-secondary">
            全件一覧
          </Link>
        )}
        <Link href="/" className="text-sm font-bold text-live-600 hover:underline">
          ← トップへ戻る
        </Link>
      </div>
    </>
  );
}
