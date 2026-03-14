import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

/** 管理者のみ: 通報一覧（通報されたコメント本文・報告者・被報告者を含む） */
export async function GET() {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });
  if (!(await isAdmin(user))) return NextResponse.json({ error: "管理者のみ利用できます" }, { status: 403 });

  const admin = createAdminClient();
  const { data: reports, error } = await admin
    .from("reports")
    .select("id, comment_id, reported_user_id, reporter_id, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!reports?.length) return NextResponse.json([]);

  const commentIds = [...new Set((reports as { comment_id: string | null }[]).map((r) => r.comment_id).filter(Boolean))];
  let commentMap = new Map<string, { body: string }>();
  if (commentIds.length > 0) {
    const { data: comments } = await admin
      .from("attendance_comments")
      .select("id, body")
      .in("id", commentIds);
    commentMap = new Map((comments ?? []).map((c: { id: string; body: string }) => [c.id, { body: c.body }]));
  }

  const userIds = [...new Set(reports.flatMap((r: { reporter_id: string; reported_user_id: string }) => [r.reporter_id, r.reported_user_id]))];
  const { data: profiles } = await admin.from("profiles").select("id, display_name").in("id", userIds);
  const profileMap = new Map((profiles ?? []).map((p: { id: string; display_name: string | null }) => [p.id, p.display_name ?? "—"]));

  const list = (reports ?? []).map((r: { id: string; comment_id: string | null; reported_user_id: string; reporter_id: string; reason: string | null; created_at: string }) => {
    const commentBody = r.comment_id
      ? (commentMap.get(r.comment_id)?.body ?? "（コメント削除済み）")
      : "（ユーザーを通報）";
    return {
      id: r.id,
      comment_id: r.comment_id,
      comment_body: commentBody,
      reported_user_id: r.reported_user_id,
      reported_user_display_name: profileMap.get(r.reported_user_id) ?? "—",
      reporter_id: r.reporter_id,
      reporter_display_name: profileMap.get(r.reporter_id) ?? "—",
      reason: r.reason ?? null,
      created_at: r.created_at,
    };
  });

  return NextResponse.json(list);
}
