"use client";

import { useState, useEffect } from "react";

type ReportRow = {
  id: string;
  comment_id: string;
  comment_body: string;
  reported_user_id: string;
  reported_user_display_name: string;
  reporter_id: string;
  reporter_display_name: string;
  reason: string | null;
  created_at: string;
};

export function AdminReports() {
  const [list, setList] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/reports")
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 403 ? "管理者のみ利用できます" : "取得に失敗しました");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setList(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function deleteUser(userId: string, displayName: string) {
    if (!confirm(`「${displayName}」のアカウントを削除しますか？\nこのメールアドレスでは二度と登録できなくなります。`)) return;
    setDeletingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/delete`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "削除に失敗しました");
      setList((prev) => prev.filter((r) => r.reported_user_id !== userId));
    } catch (e) {
      alert(e instanceof Error ? e.message : "削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">読み込み中...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (list.length === 0) return <p className="text-sm text-gray-500">通報はまだありません。</p>;

  const byUser = new Map<string, ReportRow[]>();
  list.forEach((r) => {
    const arr = byUser.get(r.reported_user_id) ?? [];
    arr.push(r);
    byUser.set(r.reported_user_id, arr);
  });

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-bold text-live-900">通報一覧</h2>
      <div className="space-y-4">
        {Array.from(byUser.entries()).map(([userId, reports]) => {
          const first = reports[0];
          const displayName = first.reported_user_display_name;
          const count = reports.length;
          return (
            <div key={userId} className="rounded-card border border-live-200 bg-surface-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-900">被通報者: {displayName}</p>
                  <p className="mt-0.5 text-sm font-medium text-red-600">このユーザーは {count} 回通報されています</p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteUser(userId, displayName)}
                  disabled={deletingId === userId}
                  className="btn-secondary text-sm text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                >
                  {deletingId === userId ? "削除中..." : "このユーザーを削除"}
                </button>
              </div>
              <ul className="mt-3 space-y-3">
                {reports.map((r) => (
                  <li key={r.id} className="rounded-button border border-live-100 bg-white p-3 text-sm">
                    <p className="text-xs text-gray-500">
                      {new Date(r.created_at).toLocaleString("ja-JP")} · 通報者: {r.reporter_display_name}
                      {r.reason && ` · 理由: ${r.reason}`}
                    </p>
                    <p className="mt-1 font-medium text-gray-900">
                      {r.comment_body === "（ユーザーを通報）" ? "通報内容:" : "通報されたコメント:"}
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap text-gray-700">{r.comment_body}</p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
