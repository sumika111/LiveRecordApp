import { createClient } from "@/lib/supabase/server";
import { getVenueVisitCountRankingSearch } from "@/lib/ranking";
import { NextRequest } from "next/server";

/** 会場名で検索し、延べ回数順の会場一覧を返す。q=検索文字列、year=指定時はその年に限定。 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : undefined;

  if (q.length === 0) {
    return Response.json({ venues: [] });
  }

  const supabase = await createClient();
  const venues = await getVenueVisitCountRankingSearch(supabase, q, Number.isNaN(year) ? undefined : year);
  return Response.json({ venues });
}
