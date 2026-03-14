import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** ニックネームでプロフィール検索（自分と既にフォロー中は除く） */
export async function GET(req: Request) {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) return NextResponse.json({ users: [] });

  const supabase = await createClient();
  const { data: followRows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);
  const followingIds = new Set((followRows ?? []).map((r: { following_id: string }) => r.following_id));

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .neq("id", user.id)
    .ilike("display_name", `%${q}%`)
    .limit(20);

  const users = (profiles ?? [])
    .filter((p: { id: string }) => !followingIds.has(p.id))
    .map((p: { id: string; display_name: string | null }) => ({
      id: p.id,
      display_name: p.display_name?.trim() && !p.display_name.includes("@") ? p.display_name.trim() : "匿名",
    }));

  return NextResponse.json({ users });
}
