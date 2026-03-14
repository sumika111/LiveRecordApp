import type { SupabaseClient } from "@supabase/supabase-js";

export type TimelineItem = {
  id: string;
  user_id: string;
  created_at: string;
  memo: string | null;
  photo_url: string | null;
  display_name: string;
  event_date: string;
  title: string;
  artist_name: string | null;
  event_artists: Array<{ artist_name: string }> | null;
  venue_name: string;
  venue_prefecture: string;
  venue_city: string | null;
  like_count: number;
  liked: boolean;
};

/** 自分＋フォロー中のユーザーの記録を新しい順で取得 */
export async function getTimeline(
  supabase: SupabaseClient,
  currentUserId: string
): Promise<TimelineItem[]> {
  const { data: followRows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", currentUserId);
  const followingIds = (followRows ?? []).map((r: { following_id: string }) => r.following_id);
  const userIds = [currentUserId, ...followingIds];

  const { data: attRows } = await supabase
    .from("attendances")
    .select(
      "id, user_id, created_at, memo, photo_url, events(id, event_date, title, artist_name, venues(name, prefecture, city), event_artists(artist_name))"
    )
    .in("user_id", userIds)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!attRows || attRows.length === 0) return [];

  const attendanceIds = attRows.map((r: { id: string }) => r.id);
  const userIdsToFetch = [...new Set(attRows.map((r: { user_id: string }) => r.user_id))];

  const [profilesRes, likesRes, myLikesRes] = await Promise.all([
    supabase.from("profiles").select("id, display_name").in("id", userIdsToFetch),
    supabase.from("likes").select("attendance_id").in("attendance_id", attendanceIds),
    supabase
      .from("likes")
      .select("attendance_id")
      .eq("user_id", currentUserId)
      .in("attendance_id", attendanceIds),
  ]);

  const profileMap = new Map<string, string>(
    (profilesRes.data ?? []).map((p: { id: string; display_name: string | null }) => [
      p.id,
      p.display_name?.trim() && !p.display_name.includes("@") ? p.display_name.trim() : "匿名",
    ])
  );

  const likeCountMap = new Map<string, number>();
  (likesRes.data ?? []).forEach((r: { attendance_id: string }) => {
    likeCountMap.set(r.attendance_id, (likeCountMap.get(r.attendance_id) ?? 0) + 1);
  });
  const likedSet = new Set((myLikesRes.data ?? []).map((r: { attendance_id: string }) => r.attendance_id));

  return (attRows as unknown as Array<{
    id: string;
    user_id: string;
    created_at: string;
    memo: string | null;
    photo_url: string | null;
    events: {
      event_date: string;
      title: string;
      artist_name: string | null;
      venues: { name: string; prefecture: string; city: string | null } | null;
      event_artists: Array<{ artist_name: string }> | null;
    } | null;
  }>).map((row) => {
    const e = row.events;
    const v = e?.venues;
    return {
      id: row.id,
      user_id: row.user_id,
      created_at: row.created_at,
      memo: row.memo,
      photo_url: row.photo_url,
      display_name: profileMap.get(row.user_id) ?? "匿名",
      event_date: e?.event_date ?? "",
      title: e?.title ?? "—",
      artist_name: e?.artist_name ?? null,
      event_artists: e?.event_artists ?? null,
      venue_name: v?.name ?? "—",
      venue_prefecture: v?.prefecture ?? "",
      venue_city: v?.city ?? null,
      like_count: likeCountMap.get(row.id) ?? 0,
      liked: likedSet.has(row.id),
    };
  });
}
