import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { getTimeline } from "@/lib/timeline";
import { formatEventArtists } from "@/lib/eventArtists";
import { LikeButton } from "@/components/LikeButton";

export default async function TimelinePage() {
  const user = await getOptionalUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const items = await getTimeline(supabase, user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight text-live-900">タイムライン</h1>
      <p className="text-sm text-gray-600">
        自分と友達の記録が新しい順に並びます。友達を追加するとその人の記録も表示されます。
      </p>

      {items.length === 0 ? (
        <div className="card rounded-card p-6 text-center text-gray-500">
          <p>まだ記録がありません。</p>
          <p className="mt-2 text-sm">
            <Link href="/record" className="font-bold text-live-600 hover:underline">
              記録する
            </Link>
            か、
            <Link href="/friends" className="font-bold text-live-600 hover:underline">
              友達を追加
            </Link>
            してみましょう。
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-live-600">
                    {item.display_name} さんが記録しました
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleString("ja-JP", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <LikeButton
                  attendanceId={item.id}
                  initialLiked={item.liked}
                  initialCount={item.like_count}
                />
              </div>
              <Link href={`/my/record/${item.id}`} className="mt-2 block">
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
              </Link>
              {item.photo_url && (
                <Link href={`/my/record/${item.id}`} className="mt-3 block">
                  <div className="relative h-40 w-full max-w-xs overflow-hidden rounded-lg bg-surface-muted">
                    <Image
                      src={item.photo_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="320px"
                      unoptimized
                    />
                  </div>
                </Link>
              )}
              {item.memo?.trim() && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{item.memo}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3 pt-4">
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
