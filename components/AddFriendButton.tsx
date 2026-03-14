"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = { followingId: string; displayName: string };

export function AddFriendButton({ followingId, displayName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function add() {
    setLoading(true);
    try {
      const res = await fetch("/api/follows/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ following_id: followingId }),
      });
      const data = await res.json();
      if (res.ok && data.ok) setDone(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm font-bold text-live-700">
        {displayName} さんを友達に追加しました！
        <Link href="/timeline" className="ml-2 text-live-600 hover:underline">
          タイムラインを見る
        </Link>
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={loading}
      className="btn-primary disabled:opacity-50"
    >
      {loading ? "追加中..." : "友達に追加する"}
    </button>
  );
}
