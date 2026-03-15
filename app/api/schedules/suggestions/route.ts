import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** 自分の予定からイベント名・場所の候補を返す（入力補完用） */
export async function GET() {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_schedules")
    .select("title, location")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const titles = new Set<string>();
  const locations = new Set<string>();
  for (const row of data ?? []) {
    const t = (row as { title?: string }).title?.trim();
    if (t) titles.add(t);
    const loc = (row as { location?: string | null }).location?.trim();
    if (loc) locations.add(loc);
  }

  return NextResponse.json({
    titles: Array.from(titles).sort(),
    locations: Array.from(locations).sort(),
  });
}
