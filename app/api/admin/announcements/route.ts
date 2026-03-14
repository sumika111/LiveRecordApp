import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

/** 管理者のみ: お知らせ一覧（全件） */
export async function GET() {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });
  if (!(await isAdmin(user))) return NextResponse.json({ error: "管理者のみ利用できます" }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("admin_announcements")
    .select("id, body, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(Array.isArray(data) ? data : []);
}

/** 管理者のみ: お知らせを追加 */
export async function POST(req: Request) {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });
  if (!(await isAdmin(user))) return NextResponse.json({ error: "管理者のみ利用できます" }, { status: 403 });

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
    .from("admin_announcements")
    .insert({ body: text })
    .select("id, body, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
