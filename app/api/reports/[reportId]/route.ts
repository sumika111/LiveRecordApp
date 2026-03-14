import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** 自分が送った通報を取り消す（reporter 本人のみ削除可・RLS で制御） */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });

  const { reportId } = await params;
  if (!reportId) return NextResponse.json({ error: "reportId が必要です" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.from("reports").delete().eq("id", reportId).eq("reporter_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
