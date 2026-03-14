import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

/**
 * アーティスト名の候補を返す（アーティスト名のみ。公演名は含めない）。
 * - q: 検索文字列（部分一致）
 * - year: 指定時は「その年に events が存在する」アーティストのみ（ランキング年別の検索用）
 * events の artist_name のみを参照（artists マスタは公演名が混入しているため使わない）。
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : null;

  if (q.length === 0) {
    return Response.json({ suggestions: [] });
  }

  const supabase = await createClient();
  const pattern = `%${q}%`;

  if (year != null && !Number.isNaN(year)) {
    // 年指定: その年の events に存在するアーティスト名のみ（ランキング検索用）
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    const { data: rows } = await supabase
      .from("events")
      .select("artist_name, event_date")
      .gte("event_date", start)
      .lte("event_date", end)
      .ilike("artist_name", pattern)
      .limit(100);

    type Row = { artist_name: string | null };
    const list = (rows ?? []) as Row[];
    const set = new Set<string>();
    for (const r of list) {
      const a = r.artist_name?.trim();
      if (a) set.add(a);
    }
    const suggestions = Array.from(set).slice(0, 20);
    return Response.json({ suggestions });
  }

  // 通常: events の artist_name + event_artists の artist_name から候補を出す
  const { data: eventRows } = await supabase
    .from("events")
    .select("artist_name")
    .ilike("artist_name", pattern)
    .limit(100);

  type EventRow = { artist_name: string | null };
  const eventList = (eventRows ?? []) as EventRow[];
  const set = new Set<string>();
  for (const r of eventList) {
    const a = r.artist_name?.trim();
    if (a) set.add(a);
  }

  const { data: eaRows } = await supabase
    .from("event_artists")
    .select("artist_name")
    .ilike("artist_name", pattern)
    .limit(100);
  if (eaRows) {
    eaRows.forEach((r: { artist_name: string }) => {
      const a = r.artist_name?.trim();
      if (a) set.add(a);
    });
  }

  const suggestions = Array.from(set).slice(0, 20);
  return Response.json({ suggestions });
}
