import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toPublicDisplayName } from "@/lib/displayName";

/** 通知一覧用: いいねされた記録・コメントされた記録をまとめて返す（いいねとコメントは別配列） */
export async function GET() {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ likes: [], comments: [], read_at: null, likeCount: 0, commentCount: 0 });

  const admin = createAdminClient();
  const [{ data: profile }, { data: myAttendances }] = await Promise.all([
    admin.from("profiles").select("notification_read_at").eq("id", user.id).single(),
    admin.from("attendances").select("id, events(title)").eq("user_id", user.id),
  ]);
  const myList = (myAttendances ?? []) as { id: string; events: { title: string } | null }[];
  const attendanceIds = myList.map((r) => r.id);
  const titleByAttendance = new Map(myList.map((r) => [r.id, r.events?.title ?? "—"]));
  const readAt = (profile as { notification_read_at: string | null } | null)?.notification_read_at ?? "1970-01-01T00:00:00Z";

  if (attendanceIds.length === 0) {
    const readAtVal = (profile as { notification_read_at: string | null } | null)?.notification_read_at ?? null;
    return NextResponse.json({ likes: [], comments: [], read_at: readAtVal, likeCount: 0, commentCount: 0 });
  }

  const [likesRes, commentsRes] = await Promise.all([
    admin.from("likes").select("attendance_id, user_id, created_at").in("attendance_id", attendanceIds),
    admin.from("attendance_comments").select("attendance_id, user_id, created_at").in("attendance_id", attendanceIds),
  ]);

  const likeRows = (likesRes.data ?? []) as { attendance_id: string; user_id: string; created_at: string }[];
  const commentRows = (commentsRes.data ?? []) as { attendance_id: string; user_id: string; created_at: string }[];

  const likesFromOthers = likeRows.filter((r) => r.user_id !== user.id);
  const commentsFromOthers = commentRows.filter((r) => r.user_id !== user.id);
  const likeCount = likesFromOthers.filter((r) => r.created_at > readAt).length;
  const commentCount = commentsFromOthers.filter((r) => r.created_at > readAt).length;

  const userIds = new Set<string>();
  likesFromOthers.forEach((r) => userIds.add(r.user_id));
  commentsFromOthers.forEach((r) => userIds.add(r.user_id));
  const { data: profiles } = await admin.from("profiles").select("id, display_name").in("id", [...userIds]);
  const nameMap = new Map((profiles ?? []).map((p: { id: string; display_name: string | null }) => [p.id, toPublicDisplayName(p.display_name)]));

  type Agg = { attendance_id: string; count: number; userIds: Set<string>; lastAt: string };
  const likeAgg = new Map<string, Agg>();
  likesFromOthers.forEach((r) => {
    const cur = likeAgg.get(r.attendance_id);
    if (!cur) {
      likeAgg.set(r.attendance_id, { attendance_id: r.attendance_id, count: 1, userIds: new Set([r.user_id]), lastAt: r.created_at });
    } else {
      cur.count += 1;
      cur.userIds.add(r.user_id);
      if (r.created_at > cur.lastAt) cur.lastAt = r.created_at;
    }
  });

  // コメントは (attendance_id, user_id) ごとに1カード（誰々がコメントしましたを1人ずつ）
  const commentByUser = new Map<string, { attendance_id: string; user_id: string; lastAt: string }>();
  commentsFromOthers.forEach((r) => {
    const key = `${r.attendance_id}:${r.user_id}`;
    const cur = commentByUser.get(key);
    if (!cur || r.created_at > cur.lastAt) {
      commentByUser.set(key, { attendance_id: r.attendance_id, user_id: r.user_id, lastAt: r.created_at });
    }
  });

  const likes = Array.from(likeAgg.values())
    .sort((a, b) => (b.lastAt > a.lastAt ? 1 : -1))
    .map((a) => ({
      attendance_id: a.attendance_id,
      title: titleByAttendance.get(a.attendance_id) ?? "—",
      count: a.count,
      lastAt: a.lastAt,
      users: [...a.userIds].map((id) => ({ id, display_name: nameMap.get(id) ?? "匿名" })),
    }));

  const comments = Array.from(commentByUser.values())
    .sort((a, b) => (b.lastAt > a.lastAt ? 1 : -1))
    .map((a) => ({
      attendance_id: a.attendance_id,
      title: titleByAttendance.get(a.attendance_id) ?? "—",
      user_id: a.user_id,
      display_name: nameMap.get(a.user_id) ?? "匿名",
      lastAt: a.lastAt,
    }));

  const readAtVal = (profile as { notification_read_at: string | null } | null)?.notification_read_at ?? null;
  return NextResponse.json({ likes, comments, read_at: readAtVal, likeCount, commentCount });
}
