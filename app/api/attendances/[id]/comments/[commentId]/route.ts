import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** 自分のコメントを編集。返信は別IDなのでこのIDの行だけ更新 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });

  const { commentId } = await params;
  if (!commentId) {
    return NextResponse.json({ error: "comment id が必要です" }, { status: 400 });
  }

  let body: { body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "body を入力してください" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance_comments")
    .update({ body: text })
    .eq("id", commentId)
    .eq("user_id", user.id)
    .select("id, body, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "コメントが見つからないか、編集権限がありません" }, { status: 404 });
  }
  return NextResponse.json(data);
}

/** 自分のコメントを削除。親を削除すると返信（子）はDBのCASCADEでまとめて削除される */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });

  const { commentId } = await params;
  if (!commentId) {
    return NextResponse.json({ error: "comment id が必要です" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("attendance_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
