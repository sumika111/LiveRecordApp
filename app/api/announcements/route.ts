import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** お知らせ一覧（公開）。直近24時間以内のものだけ返す */
export async function GET() {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("admin_announcements")
    .select("id, body, created_at, updated_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(Array.isArray(data) ? data : []);
}
