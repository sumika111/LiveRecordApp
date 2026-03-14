"use client";

import { useState, useEffect, useRef } from "react";

const HIGHLIGHT_DURATION_MS = 4000;

type RequestRow = {
  id: string;
  user_id: string;
  display_name: string;
  body: string;
  created_at: string;
};

export function AdminRequests({
  readAt,
  requestTabClickCount,
}: {
  readAt: string | null;
  requestTabClickCount: number;
}) {
  const [list, setList] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchList = () => {
    fetch("/api/admin/requests")
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 403 ? "管理者のみ利用できます" : "取得に失敗しました");
        return res.json();
      })
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  useEffect(() => {
    if (requestTabClickCount === 0 || !readAt || list.length === 0) return;
    const ids = new Set(list.filter((r) => r.created_at > readAt).map((r) => r.id));
    if (ids.size > 0) setHighlightIds(ids);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setHighlightIds(new Set());
      timerRef.current = null;
    }, HIGHLIGHT_DURATION_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [requestTabClickCount, readAt, list]);

  async function handleDelete(id: string) {
    if (!confirm("この要望を削除しますか？")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "削除に失敗しました");
      }
      setList((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">読み込み中...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (list.length === 0) return <p className="text-sm text-gray-500">要望はまだありません。</p>;

  return (
    <ul className="space-y-3">
      {list.map((r) => {
        const isNew = highlightIds.has(r.id);
        return (
          <li
            key={r.id}
            className={`rounded-button border p-3 text-sm transition-colors duration-300 ${
              isNew ? "border-live-400 bg-live-100/80" : "border-live-100 bg-white"
            }`}
          >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-xs text-gray-500">
              {new Date(r.created_at).toLocaleString("ja-JP")} · {r.display_name}
            </p>
            <button
              type="button"
              onClick={() => handleDelete(r.id)}
              disabled={deletingId === r.id}
              className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
            >
              {deletingId === r.id ? "削除中..." : "削除"}
            </button>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-gray-800">{r.body}</p>
          </li>
        );
      })}
    </ul>
  );
}
