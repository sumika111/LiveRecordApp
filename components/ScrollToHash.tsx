"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * ページ読み込み時・同一ページ内でクエリやハッシュが変わった時に、
 * URL の # に対応する要素へスクロールする。
 * ハッシュが消える場合に備え、venue/artist クエリがあれば該当の #venue-detail / #artist-detail へもスクロールする。
 */
export function ScrollToHash() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const venueId = searchParams.get("venue");
    const artistParam = searchParams.get("artist");

    // ハッシュがあればその要素へ、なければ venue/artist クエリから推測
    let id = hash ? hash.slice(1) : "";
    if (!id && venueId) id = "venue-detail";
    if (!id && artistParam) id = "artist-detail";
    if (!id) return;

    const scrollToEl = () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // クライアント遷移で DOM が遅れて描画される場合があるため、複数回・やや遅めに試行
    const t1 = setTimeout(scrollToEl, 80);
    const t2 = setTimeout(scrollToEl, 400);
    const t3 = setTimeout(scrollToEl, 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname, searchParams]);
  return null;
}
