import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });

  let body: { attendance_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const attendanceId = body.attendance_id;
  if (!attendanceId || typeof attendanceId !== "string") {
    return NextResponse.json({ error: "attendance_id が必要です" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("attendance_id", attendanceId)
    .maybeSingle();

  if (existing) {
    await supabase.from("likes").delete().eq("id", existing.id);
  } else {
    await supabase.from("likes").insert({ user_id: user.id, attendance_id: attendanceId });
  }

  const { count } = await supabase
    .from("likes")
    .select("id", { count: "exact", head: true })
    .eq("attendance_id", attendanceId);

  const { data: myLike } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("attendance_id", attendanceId)
    .maybeSingle();

  return NextResponse.json({
    liked: !!myLike,
    count: count ?? 0,
  });
}
