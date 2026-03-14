import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** 未読通知件数（いいね＋コメント。自分以外が自分の記録にしたもの） */
export async function GET() {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ count: 0, likeCount: 0, commentCount: 0 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("notification_read_at").eq("id", user.id).single();
  const readAt = profile?.notification_read_at ?? "1970-01-01T00:00:00Z";

  const { data: myAttendances } = await admin.from("attendances").select("id").eq("user_id", user.id);
  const attendanceIds = (myAttendances ?? []).map((r: { id: string }) => r.id);
  if (attendanceIds.length === 0) return NextResponse.json({ count: 0, likeCount: 0, commentCount: 0 });

  const [likesRes, commentsRes] = await Promise.all([
    admin.from("likes").select("id, user_id").in("attendance_id", attendanceIds).gt("created_at", readAt),
    admin.from("attendance_comments").select("id, user_id").in("attendance_id", attendanceIds).gt("created_at", readAt),
  ]);

  const likeRows = (likesRes.data ?? []) as { id: string; user_id: string }[];
  const commentRows = (commentsRes.data ?? []) as { id: string; user_id: string }[];
  const likesFromOthers = likeRows.filter((r) => r.user_id !== user.id);
  const commentsFromOthers = commentRows.filter((r) => r.user_id !== user.id);

  const likeCount = likesFromOthers.length;
  const commentCount = commentsFromOthers.length;
  const count = likeCount + commentCount;

  return NextResponse.json({
    count,
    read_at: profile?.notification_read_at ?? null,
    likeCount,
    commentCount,
  });
}
