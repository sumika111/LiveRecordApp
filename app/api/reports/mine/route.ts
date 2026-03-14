import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** 自分が送った通報一覧（取り消しボタン用・RLS で reporter 本人のみ取得可） */
export async function GET() {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("id, comment_id, reported_user_id")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reports: data ?? [] });
}
