import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import {
  getUserStats,
  getUserStatsByYear,
  getUserRecordYears,
  getArtistRanking,
} from "@/lib/getUserStats";
import { ShareCard } from "@/components/ShareCard";

export default async function ProfileSharePage() {
  const user = await getOptionalUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const [profileRes, statsAll, years, artistRankingAll] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    getUserStats(supabase, user.id),
    getUserRecordYears(supabase, user.id),
    getArtistRanking(supabase, user.id),
  ]);

  const statsByYear: Record<number, { totalEvents: number; totalVenues: number }> = {};
  const artistRankingByYear: Record<number, { name: string; count: number }[]> = {};
  for (const y of years) {
    const [s, a] = await Promise.all([
      getUserStatsByYear(supabase, user.id, y),
      getArtistRanking(supabase, user.id, y),
    ]);
    statsByYear[y] = s;
    artistRankingByYear[y] = a;
  }

  const displayName = profileRes.data?.display_name ?? null;

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight text-live-900">
        シェア用カード
      </h1>
      <div className="mt-6">
        <ShareCard
          displayName={displayName}
          statsAll={{
            totalEvents: statsAll.totalEvents,
            totalVenues: statsAll.totalVenues,
          }}
          statsByYear={statsByYear}
          years={years}
          artistRankingAll={artistRankingAll}
          artistRankingByYear={artistRankingByYear}
        />
      </div>
    </>
  );
}
