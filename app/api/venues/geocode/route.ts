import { createClient } from "@/lib/supabase/server";
import { getOptionalUser } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "LiveRecordApp/1.0 (personal live venue map)";

/** 住所文字列を組み立て（パターン: 日本 + スペース区切り） */
function buildAddressQuery(venue: {
  prefecture: string;
  city: string | null;
  address_detail: string | null;
}): string {
  const parts = ["日本", venue.prefecture, venue.city, venue.address_detail].filter(
    (p): p is string => Boolean(p && String(p).trim())
  );
  return parts.join(" ");
}

/** 住所の部品だけを取得（都道府県・市区町村・番地） */
function getAddressParts(venue: {
  prefecture: string;
  city: string | null;
  address_detail: string | null;
}): string[] {
  return [venue.prefecture, venue.city, venue.address_detail].filter(
    (p): p is string => Boolean(p && String(p).trim())
  );
}

/** Nominatim に問い合わせ、結果の先頭を返す。見つからなければ null */
async function searchNominatim(query: string): Promise<{ lat: string; lon: string } | null> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
    countrycodes: "jp",
  });
  const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) return null;
  const results = (await res.json()) as Array<{ lat: string; lon: string }>;
  const first = results?.[0];
  if (!first?.lat || !first?.lon) return null;
  return first;
}

/**
 * 会場の住所から緯度経度を取得し、venues を更新する。
 * 認証必須。Nominatim は 1リクエスト/秒の制限あり。
 */
export async function POST(request: NextRequest) {
  const user = await getOptionalUser();
  if (!user) {
    return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  let body: { venueId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "venueId を指定してください。" }, { status: 400 });
  }

  const venueId = body.venueId;
  if (!venueId || typeof venueId !== "string") {
    return Response.json({ error: "venueId を指定してください。" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: venue, error: fetchError } = await supabase
    .from("venues")
    .select("id, name, prefecture, city, address_detail")
    .eq("id", venueId)
    .single();

  if (fetchError || !venue) {
    return Response.json({ error: "会場が見つかりません。" }, { status: 404 });
  }

  const venueData = venue as {
    name: string | null;
    prefecture: string;
    city: string | null;
    address_detail: string | null;
  };

  const query = buildAddressQuery(venueData);
  if (query.length < 4) {
    return Response.json({ error: "住所が不足しています。" }, { status: 400 });
  }

  const parts = getAddressParts(venueData);
  if (parts.length === 0) {
    return Response.json({ error: "住所が不足しています。" }, { status: 400 });
  }

  // 番地から建物名っぽい部分を除く（例: "二十四軒4条5丁目5-21 W'Sビル" → "二十四軒4条5丁目5-21"）
  const detailOnly = venueData.address_detail?.trim();
  const detailWithoutBuilding = detailOnly
    ? detailOnly.replace(/\s+[^\s]+(ビル|棟|マンション|ハウス)$/u, "").trim() || detailOnly
    : "";

  // 複数パターンで試す（住所の区切り方・会場名・建物名除去でヒットしづらいことがあるため）
  const nameTrim = venueData.name?.trim();
  const queriesToTry: string[] = [
    query, // 「日本 北海道 苫小牧市 旭町3丁目2-2」
    parts.join(""), // 「北海道苫小牧市旭町3丁目2-2」
    parts.join(" "), // 「北海道 苫小牧市 旭町3丁目2-2」
  ];
  // 市区町村 + 番地のみ（都道府県なしでヒットすることがある）
  if (venueData.city && detailOnly) {
    queriesToTry.push(`${venueData.city} ${detailOnly}`);
  }
  if (venueData.city && detailWithoutBuilding && detailWithoutBuilding !== detailOnly) {
    queriesToTry.push(`${venueData.city} ${detailWithoutBuilding}`);
  }
  // 都道府県 + 市区町村 + 番地（建物名除く）
  if (detailWithoutBuilding && detailWithoutBuilding !== detailOnly) {
    queriesToTry.push(
      [venueData.prefecture, venueData.city, detailWithoutBuilding].filter(Boolean).join(" ")
    );
  }
  if (nameTrim && nameTrim.length >= 2) {
    queriesToTry.push(`${nameTrim} ${venueData.prefecture}`);
    if (venueData.city) queriesToTry.push(`${nameTrim} ${venueData.city}`);
  }
  const queriesUnique = queriesToTry.filter((q, i, arr) => arr.indexOf(q) === i);

  let first: { lat: string; lon: string } | null = null;
  let positionApproximate = false;

  for (let i = 0; i < queriesUnique.length; i++) {
    first = await searchNominatim(queriesUnique[i]);
    if (first) break;
    if (i < queriesUnique.length - 1) {
      await new Promise((r) => setTimeout(r, 1100)); // 1 req/sec を守る
    }
  }

  // 番地までヒットしなかった場合: 市区町村の中心など概略位置を試す
  if (!first?.lat || !first?.lon) {
    const fallbackQueries: string[] = [];
    if (venueData.city?.trim()) {
      fallbackQueries.push(`${venueData.prefecture} ${venueData.city}`.trim());
      fallbackQueries.push(venueData.city.trim());
    }
    if (venueData.prefecture?.trim()) {
      fallbackQueries.push(venueData.prefecture.trim());
    }
    const fallbackUnique = fallbackQueries.filter((q, i, arr) => arr.indexOf(q) === i);
    for (let i = 0; i < fallbackUnique.length; i++) {
      first = await searchNominatim(fallbackUnique[i]);
      if (first) {
        positionApproximate = true;
        break;
      }
      if (i < fallbackUnique.length - 1) {
        await new Promise((r) => setTimeout(r, 1100));
      }
    }
  }

  if (!first?.lat || !first?.lon) {
    return Response.json({ error: "該当する位置が見つかりませんでした。" }, { status: 404 });
  }

  const lat = parseFloat(first.lat);
  const lng = parseFloat(first.lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return Response.json({ error: "位置データが不正です。" }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("venues")
    .update({ lat, lng, position_approximate: positionApproximate })
    .eq("id", venueId);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({ lat, lng, approximate: positionApproximate });
}
