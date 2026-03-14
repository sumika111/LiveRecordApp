import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

/** 管理者のみ: ユーザーを削除し、そのメールをBAN（再登録不可）にする */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminUser = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!adminUser) return NextResponse.json({ error: "未ログイン" }, { status: 401 });
  if (!(await isAdmin(adminUser))) return NextResponse.json({ error: "管理者のみ利用できます" }, { status: 403 });

  const { userId } = await params;
  if (!userId) return NextResponse.json({ error: "userId が必要です" }, { status: 400 });

  if (userId === adminUser.id) {
    return NextResponse.json({ error: "自分自身は削除できません" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: authUser, error: getUserError } = await admin.auth.admin.getUserById(userId);
  if (getUserError || !authUser?.user?.email) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  const email = authUser.user.email.trim().toLowerCase();

  const { error: insertError } = await admin.from("banned_emails").upsert({ email }, { onConflict: "email" });
  if (insertError) {
    return NextResponse.json({ error: `BAN登録に失敗: ${insertError.message}` }, { status: 500 });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return NextResponse.json({ error: `アカウント削除に失敗: ${deleteError.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email });
}
