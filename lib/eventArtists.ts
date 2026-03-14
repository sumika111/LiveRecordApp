/**
 * 公演のアーティスト表示用。
 * event_artists があれば複数名を「、」で結合、なければ events.artist_name にフォールバック。
 */
export function formatEventArtists(event: {
  artist_name?: string | null;
  event_artists?: Array<{ artist_name: string }> | null;
}): string {
  const ea = event.event_artists;
  if (ea && ea.length > 0) {
    return ea.map((a) => a.artist_name).join("、");
  }
  return event.artist_name?.trim() ?? "—";
}
