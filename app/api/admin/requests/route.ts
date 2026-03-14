import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

/** 管理者のみ: ユーザーからの要望一覧 */
export async function GET() {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });
  if (!(await isAdmin(user))) return NextResponse.json({ error: "管理者のみ利用できます" }, { status: 403 });

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("admin_requests")
    .select("id, user_id, body, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!rows?.length) return NextResponse.json([]);

  const userIds = [...new Set((rows as { user_id: string }[]).map((r) => r.user_id))];
  const { data: profiles } = await admin.from("profiles").select("id, display_name").in("id", userIds);
  const profileMap = new Map((profiles ?? []).map((p: { id: string; display_name: string | null }) => [p.id, p.display_name ?? "—"]));

  const list = (rows as { id: string; user_id: string; body: string; created_at: string }[]).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    display_name: profileMap.get(r.user_id) ?? "—",
    body: r.body,
    created_at: r.created_at,
  }));

  return NextResponse.json(list);
}
