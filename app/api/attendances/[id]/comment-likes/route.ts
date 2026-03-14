import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** 指定した参加記録のコメントに対するいいね数・自分がいいねしたコメントID一覧 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: attendanceId } = await params;
  if (!attendanceId) return NextResponse.json({ error: "attendance id が必要です" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: commentIds } = await supabase
    .from("attendance_comments")
    .select("id")
    .eq("attendance_id", attendanceId);
  const ids = (commentIds ?? []).map((r: { id: string }) => r.id);
  if (ids.length === 0) {
    return NextResponse.json({ counts: {}, likedIds: [] });
  }

  const { data: likeRows } = await supabase
    .from("comment_likes")
    .select("comment_id")
    .in("comment_id", ids);

  const counts: Record<string, number> = {};
  ids.forEach((id) => { counts[id] = 0; });
  (likeRows ?? []).forEach((r: { comment_id: string }) => {
    counts[r.comment_id] = (counts[r.comment_id] ?? 0) + 1;
  });

  let likedIds: string[] = [];
  if (user) {
    const { data: myLikes } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("user_id", user.id)
      .in("comment_id", ids);
    likedIds = (myLikes ?? []).map((r: { comment_id: string }) => r.comment_id);
  }

  return NextResponse.json({ counts, likedIds });
}
