import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toPublicDisplayName } from "@/lib/displayName";

export type CommentRow = {
  id: string;
  attendance_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
};

export type CommentWithAuthor = CommentRow & {
  display_name: string;
  avatar_url: string | null;
};

/** 指定した参加記録のコメント一覧（返信含む）。親削除時は子もDBで削除されるので一覧には出てこない */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: attendanceId } = await params;
  if (!attendanceId) {
    return NextResponse.json({ error: "attendance id が必要です" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: comments, error } = await supabase
    .from("attendance_comments")
    .select("id, attendance_id, user_id, parent_id, body, created_at, updated_at")
    .eq("attendance_id", attendanceId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (comments ?? []) as CommentRow[];
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);
    const nameMap = new Map(
      (profiles ?? []).map((p: { id: string; display_name: string | null }) => [
        p.id,
        toPublicDisplayName(p.display_name),
      ])
    );
    const avatarMap = new Map(
      (profiles ?? []).map((p: { id: string; avatar_url: string | null }) => [p.id, p.avatar_url ?? null])
    );
    const result: CommentWithAuthor[] = rows.map((r) => ({
      ...r,
      display_name: nameMap.get(r.user_id) ?? "匿名",
      avatar_url: avatarMap.get(r.user_id) ?? null,
    }));
    return NextResponse.json(result);
  }

  return NextResponse.json(rows);
}

/** コメントまたは返信を投稿 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });

  const { id: attendanceId } = await params;
  if (!attendanceId) {
    return NextResponse.json({ error: "attendance id が必要です" }, { status: 400 });
  }

  let body: { body?: string; parent_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "body を入力してください" }, { status: 400 });
  }

  const parentId = body.parent_id && typeof body.parent_id === "string" ? body.parent_id : null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance_comments")
    .insert({
      attendance_id: attendanceId,
      user_id: user.id,
      parent_id: parentId,
      body: text,
    })
    .select("id, attendance_id, user_id, parent_id, body, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  const withAuthor: CommentWithAuthor = {
    ...(data as CommentRow),
    display_name: toPublicDisplayName(profile?.display_name ?? null),
    avatar_url: (profile as { avatar_url?: string | null } | null)?.avatar_url ?? null,
  };
  return NextResponse.json(withAuthor);
}
