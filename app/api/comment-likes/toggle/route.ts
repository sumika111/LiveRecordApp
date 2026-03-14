import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** コメントへのいいねをトグル */
export async function POST(req: Request) {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });

  let body: { comment_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const commentId = body.comment_id && typeof body.comment_id === "string" ? body.comment_id.trim() : null;
  if (!commentId) return NextResponse.json({ error: "comment_id が必要です" }, { status: 400 });

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("comment_id", commentId)
    .maybeSingle();

  if (existing) {
    await supabase.from("comment_likes").delete().eq("id", existing.id);
  } else {
    await supabase.from("comment_likes").insert({ user_id: user.id, comment_id: commentId });
  }

  const { count } = await supabase
    .from("comment_likes")
    .select("id", { count: "exact", head: true })
    .eq("comment_id", commentId);

  const { data: myLike } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("comment_id", commentId)
    .maybeSingle();

  return NextResponse.json({
    liked: !!myLike,
    count: count ?? 0,
  });
}
