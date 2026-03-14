import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { getTimeline, filterTimelineByArtist } from "@/lib/timeline";
import { formatEventArtists } from "@/lib/eventArtists";
import { LikeButton } from "@/components/LikeButton";
import { UserDisplay } from "@/components/UserDisplay";

type Props = { searchParams: Promise<{ artist?: string }> };

function TimelineList({
  items,
  currentUserId,
}: {
  items: Awaited<ReturnType<typeof getTimeline>>;
  currentUserId: string;
}) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="card relative">
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <UserDisplay
                  displayName={item.display_name}
                  avatarUrl={item.avatar_url}
                  size="sm"
                />
                <p className="mt-0.5 text-xs text-gray-500">
                  {new Date(item.created_at).toLocaleString("ja-JP", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="relative z-30 shrink-0">
                <LikeButton
                  attendanceId={item.id}
                  initialLiked={item.liked}
                  initialCount={item.like_count}
                />
              </div>
            </div>
            <div className="mt-2 block">
              <p className="font-bold text-gray-900">{item.title}</p>
              {(item.artist_name || (item.event_artists && item.event_artists.length > 0)) && (
                <p className="mt-0.5 text-sm text-live-700">
                  {formatEventArtists({
                    artist_name: item.artist_name,
                    event_artists: item.event_artists,
                  })}
                </p>
              )}
              <p className="mt-0.5 text-sm text-gray-600">
                {item.event_date} ／ {item.venue_name}
                {item.venue_prefecture && `（${item.venue_prefecture}${item.venue_city ? ` ${item.venue_city}` : ""}）`}
              </p>
            </div>
            {item.photo_url && (
              <div className="relative mt-3 h-40 w-full max-w-xs overflow-hidden rounded-lg bg-surface-muted">
                <Image
                  src={item.photo_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="320px"
                  unoptimized
                />
              </div>
            )}
            {item.memo?.trim() && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{item.memo}</p>
            )}
          </div>
          <Link
            href={`/my/record/${item.id}`}
            className="absolute inset-0 z-20"
            aria-label="詳細を見る"
          />
          <Link
            href={`/my/record/${item.id}`}
            className="relative z-30 mt-3 block border-t border-live-100 pt-3 text-sm font-bold text-live-600 hover:underline"
          >
            コメント{item.comment_count > 0 ? ` (${item.comment_count}件)` : ""}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function TimelinePage({ searchParams }: Props) {
  const user = await getOptionalUser();
  if (!user) redirect("/login");

  const { artist: artistParam } = await searchParams;
  const artistName = artistParam?.trim() ? decodeURIComponent(artistParam.trim()) : null;

  const supabase = await createClient();
  const allItems = await getTimeline(supabase, user.id);
  const items = artistName
    ? filterTimelineByArtist(allItems, artistName)
    : allItems;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {artistName ? (
            <>
              <h1 className="text-xl font-bold tracking-tight text-live-900">
                「{artistName}」のタイムライン・ランキング
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                アーティストで絞り込んでいます
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold tracking-tight text-live-900">タイムライン</h1>
              <p className="mt-1 text-sm text-gray-600">
                自分と友達の記録が新しい順に並びます。
              </p>
            </>
          )}
        </div>
        {artistName && (
          <Link
            href="/timeline"
            className="shrink-0 rounded-button border-2 border-live-500 bg-live-500 px-4 py-2 text-sm font-bold text-white hover:bg-live-600"
          >
            ← 全体のTLに戻る
          </Link>
        )}
      </div>

      {/* アーティスト名で絞り込み */}
      <section className="rounded-card border border-live-200 bg-surface-card p-4">
        <form action="/timeline" method="get" className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="timeline-artist-search" className="text-sm font-bold text-gray-700 sm:mr-2">
            アーティスト名で絞り込む
          </label>
          <input
            id="timeline-artist-search"
            type="text"
            name="artist"
            defaultValue={artistName ?? ""}
            placeholder="例: ONE OK ROCK"
            className="flex-1 rounded-button border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
          />
          <button type="submit" className="btn-primary shrink-0">
            絞り込む
          </button>
        </form>
        {artistName && (
          <p className="mt-2 text-xs text-gray-500">
            現在: 「{artistName}」で表示中。上で別のアーティストを入力して絞り込むか、「全体のTLに戻る」で解除できます。
            {" "}
            <Link
              href={`/ranking/period?type=year&year=${new Date().getFullYear()}&artist=${encodeURIComponent(artistName)}#artist-detail`}
              className="text-live-600 hover:underline"
            >
              「{artistName}」のランキングを見る →
            </Link>
          </p>
        )}
      </section>

      {items.length === 0 ? (
        <div className="card rounded-card p-6 text-center text-gray-500">
          {artistName ? (
            <p>「{artistName}」の記録はまだありません。</p>
          ) : (
            <p>まだ記録がありません。</p>
          )}
          <p className="mt-2 text-sm">
            <Link href="/record" className="font-bold text-live-600 hover:underline">
              記録する
            </Link>
            {!artistName && (
              <>
                {" "}か、
                <Link href="/friends" className="font-bold text-live-600 hover:underline">
                  友達を追加
                </Link>
              </>
            )}
            してみましょう。
          </p>
          {artistName && (
            <p className="mt-3">
              <Link href="/timeline" className="text-sm font-bold text-live-600 hover:underline">
                ← 全体のタイムラインを見る
              </Link>
            </p>
          )}
        </div>
      ) : (
        <TimelineList items={items} currentUserId={user.id} />
      )}

      <div className="flex flex-wrap gap-3 pt-4">
        {artistName && (
          <Link href="/timeline" className="rounded-button border-2 border-live-500 bg-live-500 px-4 py-2 text-sm font-bold text-white hover:bg-live-600">
            ← 全体のTLに戻る
          </Link>
        )}
        <Link href="/friends" className="btn-secondary">
          友達を追加
        </Link>
        <Link href="/record" className="btn-primary">
          記録する
        </Link>
      </div>
    </div>
  );
}
