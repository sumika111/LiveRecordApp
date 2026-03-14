import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** コメントを通報する（認証済みのみ） */
export async function POST(req: Request) {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });

  let body: { comment_id?: string; reported_user_id?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const commentId = body.comment_id && typeof body.comment_id === "string" ? body.comment_id.trim() : null;
  const reportedUserId = body.reported_user_id && typeof body.reported_user_id === "string" ? body.reported_user_id.trim() : null;

  const supabase = await createClient();
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : null;

  let targetReportedUserId: string;

  if (commentId) {
    const { data: comment, error: commentError } = await supabase
      .from("attendance_comments")
      .select("id, user_id")
      .eq("id", commentId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json({ error: "コメントが見つかりません" }, { status: 404 });
    }
    if (comment.user_id === user.id) {
      return NextResponse.json({ error: "自分のコメントは通報できません" }, { status: 400 });
    }
    targetReportedUserId = comment.user_id;
  } else if (reportedUserId) {
    if (reportedUserId === user.id) {
      return NextResponse.json({ error: "自分は通報できません" }, { status: 400 });
    }
    const { data: profile } = await supabase.from("profiles").select("id").eq("id", reportedUserId).maybeSingle();
    if (!profile) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }
    targetReportedUserId = reportedUserId;
  } else {
    return NextResponse.json({ error: "comment_id または reported_user_id が必要です" }, { status: 400 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("reports")
    .insert({
      reporter_id: user.id,
      comment_id: commentId || null,
      reported_user_id: targetReportedUserId,
      reason: reason || null,
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, report_id: inserted?.id ?? null });
}
