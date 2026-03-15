import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

/** 予定を更新（一部フィールドのみでも可。done のトグル用） */
export async function PATCH(req: Request, { params }: Params) {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id が必要です" }, { status: 400 });

  let body: { event_date?: string; title?: string; location?: string; done?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createClient();
  const updates: { event_date?: string; title?: string; location?: string | null; done?: boolean } = {};

  if (body.event_date !== undefined) {
    const s = typeof body.event_date === "string" ? body.event_date.trim() : "";
    if (!s) return NextResponse.json({ error: "日付を入力してください" }, { status: 400 });
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return NextResponse.json({ error: "日付が不正です" }, { status: 400 });
    updates.event_date = s;
  }
  if (body.title !== undefined) {
    const t = typeof body.title === "string" ? body.title.trim() : "";
    if (!t) return NextResponse.json({ error: "イベント名を入力してください" }, { status: 400 });
    if (t.length > 200) return NextResponse.json({ error: "イベント名は200文字以内で入力してください" }, { status: 400 });
    updates.title = t;
  }
  if (body.location !== undefined) {
    updates.location = typeof body.location === "string" ? (body.location.trim() || null) : null;
    if (updates.location && updates.location.length > 100) return NextResponse.json({ error: "場所は100文字以内で入力してください" }, { status: 400 });
  }
  if (typeof body.done === "boolean") updates.done = body.done;

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "更新する項目がありません" }, { status: 400 });

  const { data, error } = await supabase
    .from("user_schedules")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, event_date, title, location, done, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "予定が見つかりません" }, { status: 404 });
  return NextResponse.json(data);
}

/** 予定を削除 */
export async function DELETE(_req: Request, { params }: Params) {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id が必要です" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.from("user_schedules").delete().eq("id", id).eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
