import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** 管理者への要望を送信（認証済みユーザーのみ）。INSERT はサービスロールで実行（RLS がサーバー側 JWT を参照しない環境対策） */
export async function POST(req: Request) {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });

  let body: { body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) return NextResponse.json({ error: "内容を入力してください" }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: "2000文字以内で入力してください" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("admin_requests")
    .insert({ user_id: user.id, body: text })
    .select("id, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, created_at: data.created_at });
}
