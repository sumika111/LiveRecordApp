import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { formatEventArtists } from "@/lib/eventArtists";
import { LikeButton } from "@/components/LikeButton";
import { UserDisplay } from "@/components/UserDisplay";
import { AttendanceComments } from "@/components/AttendanceComments";

type Params = { params: Promise<{ id: string }> };

export default async function MyRecordDetailPage({ params }: Params) {
  const user = await getOptionalUser();
  if (!user) redirect("/login");

  const { id: attendanceId } = await params;
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("attendances")
    .select("id, user_id, memo, photo_url, events(id, event_date, title, artist_name, venues(name, prefecture, city), event_artists(artist_name))")
    .eq("id", attendanceId)
    .single();

  if (!row || !row.events) notFound();

  const isMine = row.user_id === user.id;
  if (!isMine) {
    const { data: follow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", row.user_id)
      .maybeSingle();
    if (!follow) notFound();
  }

  const { data: profile } = !isMine
    ? await supabase.from("profiles").select("display_name, avatar_url, bio").eq("id", row.user_id).single()
    : { data: null };

  const { count: likeCount } = await supabase
    .from("likes")
    .select("id", { count: "exact", head: true })
    .eq("attendance_id", row.id);
  const { data: myLike } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("attendance_id", row.id)
    .maybeSingle();

  const e = row.events as unknown as {
    id: string;
    event_date: string;
    title: string;
    artist_name: string | null;
    venues: { name: string; prefecture: string; city: string | null } | null;
    event_artists: Array<{ artist_name: string }> | null;
  };
  const v = e.venues;
  const venueLabel = v ? `${v.name}（${v.prefecture}${v.city ? ` ${v.city}` : ""}）` : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold tracking-tight text-live-900">記録の詳細</h1>
        <LikeButton
          attendanceId={row.id}
          initialLiked={!!myLike}
          initialCount={likeCount ?? 0}
        />
      </div>
      {!isMine && profile && (
        <UserDisplay
          displayName={profile.display_name ?? ""}
          avatarUrl={profile.avatar_url ?? null}
          bio={profile.bio ?? null}
          size="sm"
        />
      )}

      {row.photo_url && (
        <div className="rounded-card overflow-hidden bg-surface-muted flex items-center justify-center p-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- 縦横比を保って全体表示するため */}
          <img
            src={row.photo_url}
            alt="思い出の写真"
            className="max-h-[70vh] max-w-full w-auto h-auto object-contain block"
          />
        </div>
      )}

      <div className="card space-y-3">
        <p className="font-bold text-gray-900 text-lg">{e.title}</p>
        {(e.artist_name || (e.event_artists && e.event_artists.length > 0)) && (
          <p className="text-sm text-live-700">{formatEventArtists(e)}</p>
        )}
        <p className="text-sm text-gray-600">
          {e.event_date} ／ {venueLabel}
        </p>
      </div>

      {(row.memo && row.memo.trim()) ? (
        <div className="card">
          <h2 className="text-sm font-bold text-gray-700 mb-1">楽しかったこと</h2>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{row.memo}</p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">楽しかったことはまだメモされていません。</p>
      )}

      <section className="border-t border-live-100 pt-4">
        <AttendanceComments
          attendanceId={row.id}
          currentUserId={user.id}
          defaultOpen
        />
      </section>

      <div className="flex flex-wrap gap-3 pt-2">
        {isMine ? (
          <>
            <Link href={`/my/edit?id=${row.id}`} className="btn-primary">
              編集する
            </Link>
            <Link href="/my" className="btn-secondary">
              ← マイ記録へ戻る
            </Link>
          </>
        ) : (
          <>
            <Link href="/timeline" className="btn-primary">
              タイムラインへ戻る
            </Link>
            <Link href="/friends" className="btn-secondary">
              友達一覧
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
