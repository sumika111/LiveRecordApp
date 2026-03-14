"use client";

import { useState, useEffect } from "react";

type RequestRow = {
  id: string;
  user_id: string;
  display_name: string;
  body: string;
  created_at: string;
};

export function AdminRequests() {
  const [list, setList] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      {list.map((r) => (
        <li key={r.id} className="rounded-button border border-live-100 bg-white p-3 text-sm">
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
      ))}
    </ul>
  );
}
