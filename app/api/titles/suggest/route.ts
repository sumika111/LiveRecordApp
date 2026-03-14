import { createClient } from "@/lib/supabase/server";
import { getOptionalUser } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

/**
 * ログイン中のユーザーが過去に記録した公演の「公演名」候補を返す（部分一致）。
 * 記録する画面で公演名を検索して再利用できるようにする。
 */
export async function GET(request: NextRequest) {
  const user = await getOptionalUser();
  if (!user) {
    return Response.json({ suggestions: [] });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length === 0) {
    return Response.json({ suggestions: [] });
  }

  const supabase = await createClient();
  const pattern = `%${q}%`;

  const { data: attRows } = await supabase
    .from("attendances")
    .select("event_id")
    .eq("user_id", user.id);

  const eventIds = (attRows ?? [])
    .map((r: { event_id: string }) => r.event_id)
    .filter(Boolean);
  if (eventIds.length === 0) {
    return Response.json({ suggestions: [] });
  }

  const { data: eventRows } = await supabase
    .from("events")
    .select("title")
    .in("id", eventIds)
    .ilike("title", pattern)
    .limit(100);

  const set = new Set<string>();
  (eventRows ?? []).forEach((r: { title: string | null }) => {
    const t = r.title?.trim();
    if (t) set.add(t);
  });
  const suggestions = Array.from(set).slice(0, 20);
  return Response.json({ suggestions });
}
