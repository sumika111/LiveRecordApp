import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });

  let body: { following_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const followingId = body.following_id;
  if (!followingId) return NextResponse.json({ error: "following_id が必要です" }, { status: 400 });

  const supabase = await createClient();
  await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", followingId);
  return NextResponse.json({ ok: true });
}
