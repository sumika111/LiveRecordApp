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
  if (!followingId || followingId === user.id) {
    return NextResponse.json({ error: "following_id が不正です" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("follows").insert({
    follower_id: user.id,
    following_id: followingId,
  });
  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
