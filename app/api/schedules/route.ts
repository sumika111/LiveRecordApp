import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** 自分の予定一覧（日付昇順） */
export async function GET() {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_schedules")
    .select("id, event_date, title, location, done, created_at, updated_at")
    .eq("user_id", user.id)
    .order("event_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

/** 予定を追加 */
export async function POST(req: Request) {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });

  let body: { event_date?: string; title?: string; location?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "イベント名を入力してください" }, { status: 400 });
  if (title.length > 200) return NextResponse.json({ error: "イベント名は200文字以内で入力してください" }, { status: 400 });

  const eventDate = typeof body.event_date === "string" ? body.event_date.trim() : "";
  if (!eventDate) return NextResponse.json({ error: "日付を入力してください" }, { status: 400 });
  const dateObj = new Date(eventDate);
  if (Number.isNaN(dateObj.getTime())) return NextResponse.json({ error: "日付が不正です" }, { status: 400 });

  const location = typeof body.location === "string" ? body.location.trim() || null : null;
  if (location && location.length > 100) return NextResponse.json({ error: "場所は100文字以内で入力してください" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_schedules")
    .insert({
      user_id: user.id,
      event_date: eventDate,
      title,
      location,
    })
    .select("id, event_date, title, location, done, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
