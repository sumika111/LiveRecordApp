import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";

type RankingPageParams = { searchParams: Promise<{ venue?: string; artist?: string }> };

/** ランキングは period の「全体」に統一。旧 /ranking はクエリを保持してリダイレクト */
export default async function RankingPage({ searchParams }: RankingPageParams) {
  const user = await getOptionalUser();
  if (!user) redirect("/login");

  const { venue: venueId, artist: artistParam } = await searchParams;
  const params = new URLSearchParams({ type: "all" });
  if (venueId) params.set("venue", venueId);
  if (artistParam?.trim()) params.set("artist", artistParam.trim());
  redirect(`/ranking/period?${params.toString()}`);
}
