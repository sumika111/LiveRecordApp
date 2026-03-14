import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

/** 管理者画面を開いたとき: admin_notification_read_at を現在時刻に更新 */
export async function PATCH() {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });
  if (!(await isAdmin(user))) return NextResponse.json({ error: "管理者のみ利用できます" }, { status: 403 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ admin_notification_read_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
