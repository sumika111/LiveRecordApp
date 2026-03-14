import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

type Params = { params: Promise<{ id: string }> };

/** 管理者のみ: お知らせを更新 */
export async function PATCH(req: Request, { params }: Params) {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });
  if (!(await isAdmin(user))) return NextResponse.json({ error: "管理者のみ利用できます" }, { status: 403 });

  const { id } = await params;
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
    .update({ body: text })
    .eq("id", id)
    .select("id, body, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

/** 管理者のみ: お知らせを削除 */
export async function DELETE(_req: Request, { params }: Params) {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });
  if (!(await isAdmin(user))) return NextResponse.json({ error: "管理者のみ利用できます" }, { status: 403 });

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("admin_announcements").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
