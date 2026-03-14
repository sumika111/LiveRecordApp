import { NextRequest } from "next/server";

/**
 * 郵便番号から住所を取得（zipcloud API 利用）。
 * GET /api/postal-code?zip=1234567
 * 戻り: { prefecture, city, addressDetail } または { error }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get("zip")?.replace(/-/g, "").trim() ?? "";
  if (zip.length !== 7 || !/^\d+$/.test(zip)) {
    return Response.json(
      { error: "7桁の郵便番号を入力してください。" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}&limit=1`,
      { next: { revalidate: 86400 } }
    );
    const data = (await res.json()) as {
      status: number;
      message: string | null;
      results?: Array<{
        address1: string;
        address2: string;
        address3: string;
      }> | null;
    };
    if (data.status !== 200 || !data.results?.length) {
      return Response.json(
        { error: data.message ?? "該当する住所が見つかりませんでした。" },
        { status: 404 }
      );
    }
    const r = data.results[0];
    return Response.json({
      prefecture: r.address1,
      city: r.address2,
      addressDetail: r.address3 ?? "",
    });
  } catch (e) {
    console.error("postal-code api error", e);
    return Response.json(
      { error: "住所の取得に失敗しました。しばらくしてからお試しください。" },
      { status: 502 }
    );
  }
}
