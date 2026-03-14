import Link from "next/link";
import { getOptionalUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { formatEventArtists } from "@/lib/eventArtists";

type Row = {
  id: string;
  events: {
    id: string;
    event_date: string;
    title: string;
    artist_name: string | null;
    venues: { name: string; prefecture: string; city: string | null } | null;
    event_artists: Array<{ artist_name: string }> | null;
  } | null;
};

const HOME_RECENT_LIMIT = 5;

export default async function Home() {
  const user = await getOptionalUser();

  if (!user) {
    return (
      <>
        <h1 className="text-2xl font-bold tracking-tight text-live-900">
          ライブ記録
        </h1>
        <p className="mt-2 text-gray-600">
          行ったライブを記録して、ランキングで自慢しよう。
        </p>
        <div className="mt-8">
          <p className="text-gray-600">
            ログインすると、行ったライブを公演単位で記録できます。
          </p>
          <Link href="/login" className="btn-primary mt-4 inline-block">
            ログイン / 新規登録
          </Link>
        </div>
      </>
    );
  }

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("attendances")
    .select("id, events(id, event_date, title, artist_name, venues(name, prefecture, city), event_artists(artist_name))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = (rows ?? []) as unknown as Row[];
  const totalEvents = list.length;
  const venueKeys = new Set<string>();
  const prefectureSet = new Set<string>();
  list.forEach((row) => {
    const v = row.events?.venues;
    if (v) {
      venueKeys.add(`${(v as { name: string }).name}|${(v as { prefecture: string }).prefecture}`);
      prefectureSet.add((v as { prefecture: string }).prefecture);
    }
  });
  const totalVenues = venueKeys.size;
  const totalPrefectures = prefectureSet.size;
  const recentList = list
    .sort((a, b) => (b.events?.event_date ?? "").localeCompare(a.events?.event_date ?? ""))
    .slice(0, HOME_RECENT_LIMIT);

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-live-900">
        ライブ記録
      </h1>
      <p className="mt-2 text-gray-600">
        行ったライブを記録して、ランキングで自慢しよう。
      </p>

      {/* サマリ */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="card rounded-card text-center">
          <p className="text-2xl font-bold text-live-600">{totalEvents}</p>
          <p className="mt-0.5 text-xs font-bold text-gray-600">公演</p>
        </div>
        <div className="card rounded-card text-center">
          <p className="text-2xl font-bold text-live-600">{totalVenues}</p>
          <p className="mt-0.5 text-xs font-bold text-gray-600">会場</p>
        </div>
        <div className="card rounded-card text-center">
          <p className="text-2xl font-bold text-live-600">{totalPrefectures}</p>
          <p className="mt-0.5 text-xs font-bold text-gray-600">都道府県</p>
        </div>
      </div>

      {/* 直近の記録 */}
      <h2 className="mt-8 text-lg font-bold text-live-900">直近の記録</h2>
      {recentList.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">
          まだ記録がありません。「記録する」から追加しましょう。
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {recentList.map((row) => {
            const e = row.events;
            if (!e) return null;
            const v = e.venues;
            const venueLabel = v
              ? `${v.name}（${v.prefecture}${v.city ? ` ${v.city}` : ""}）`
              : "—";
            return (
              <li key={row.id} className="card py-3">
                <Link href={`/my/edit?id=${row.id}`} className="block">
                  <p className="font-bold text-gray-900">{e.title}</p>
                  {(e.artist_name || (e.event_artists && e.event_artists.length > 0)) && (
                    <p className="mt-0.5 text-sm text-live-700">{formatEventArtists(e)}</p>
                  )}
                  <p className="mt-0.5 text-sm text-gray-600">
                    {e.event_date} ／ {venueLabel}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {list.length > HOME_RECENT_LIMIT && (
        <p className="mt-3">
          <Link href="/my" className="text-sm font-bold text-live-600 hover:underline">
            マイ記録で全件を見る →
          </Link>
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/record" className="btn-primary">
          記録する
        </Link>
        <Link href="/my" className="btn-secondary">
          マイ記録
        </Link>
        <Link href="/ranking" className="btn-secondary">
          ランキング
        </Link>
        <Link href="/profile" className="btn-secondary">
          ニックネーム設定
        </Link>
      </div>
    </>
  );
}
