"use client";

import { useState } from "react";

type Props = {
  attendanceId: string;
  initialLiked: boolean;
  initialCount: number;
};

export function LikeButton({ attendanceId, initialLiked, initialCount }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);
    try {
      const res = await fetch("/api/likes/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendance_id: attendanceId }),
      });
      const data = await res.json();
      if (res.ok) {
        setLiked(data.liked);
        setCount(data.count);
      } else {
        setLiked(prevLiked);
        setCount(prevCount);
      }
    } catch {
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-button px-2 py-1 text-sm font-bold text-gray-600 hover:bg-live-50 hover:text-live-700 disabled:opacity-50"
      aria-pressed={liked}
    >
      <span className={liked ? "text-red-500" : ""}>{liked ? "❤️" : "🤍"}</span>
      <span>{count > 0 ? count : ""}</span>
    </button>
  );
}
