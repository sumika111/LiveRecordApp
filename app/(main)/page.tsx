import { getOptionalUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { HomeHero } from "@/components/HomeHero";
import { HomeAuthenticated } from "@/components/HomeAuthenticated";

type Row = {
  id: string;
  events: {
    id: string;
    event_date: string;
    title: string;
    artist_name: string | null;
    venues: { name: string; prefecture: string; city: string | null } | null;
    event_artists: Array<{ artist_name: string }> | null;
  } | null;
};

const HOME_RECENT_LIMIT = 5;

export default async function Home() {
  const user = await getOptionalUser();

  if (!user) {
    return <HomeHero />;
  }

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("attendances")
    .select("id, events(id, event_date, title, artist_name, venues(name, prefecture, city), event_artists(artist_name))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = (rows ?? []) as unknown as Row[];
  const totalEvents = list.length;
  const venueKeys = new Set<string>();
  const prefectureSet = new Set<string>();
  list.forEach((row) => {
    const v = row.events?.venues;
    if (v) {
      venueKeys.add(`${(v as { name: string }).name}|${(v as { prefecture: string }).prefecture}`);
      prefectureSet.add((v as { prefecture: string }).prefecture);
    }
  });
  const totalVenues = venueKeys.size;
  const totalPrefectures = prefectureSet.size;
  const recentList = list
    .sort((a, b) => (b.events?.event_date ?? "").localeCompare(a.events?.event_date ?? ""))
    .slice(0, HOME_RECENT_LIMIT);

  return (
    <HomeAuthenticated
      totalEvents={totalEvents}
      totalVenues={totalVenues}
      totalPrefectures={totalPrefectures}
      recentList={recentList}
      totalCount={list.length}
    />
  );
}
