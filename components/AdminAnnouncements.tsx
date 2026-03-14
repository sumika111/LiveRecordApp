"use client";

import { useState, useEffect } from "react";

type AnnouncementRow = {
  id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export function AdminAnnouncements() {
  const [list, setList] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newBody, setNewBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchList = () => {
    fetch("/api/admin/announcements")
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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const text = newBody.trim();
    if (!text || posting) return;
    setPosting(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "追加に失敗しました");
      setNewBody("");
      setList((prev) => [data, ...prev]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setPosting(false);
    }
  }

  function startEdit(row: AnnouncementRow) {
    setEditId(row.id);
    setEditBody(row.body);
  }

  function cancelEdit() {
    setEditId(null);
    setEditBody("");
  }

  async function saveEdit() {
    if (!editId || posting) return;
    const text = editBody.trim();
    if (!text) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/admin/announcements/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "更新に失敗しました");
      setList((prev) => prev.map((r) => (r.id === editId ? { ...r, ...data } : r)));
      cancelEdit();
    } catch (err) {
      alert(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("このお知らせを削除しますか？")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "削除に失敗しました");
      }
      setList((prev) => prev.filter((r) => r.id !== id));
      if (editId === id) cancelEdit();
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">読み込み中...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="space-y-2">
        <label htmlFor="announcement-body" className="block text-sm font-bold text-gray-700">
          新しいお知らせを追加（ログイン画面に約1日間表示されます）
        </label>
        <textarea
          id="announcement-body"
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="例: 〇〇の不具合を直しました"
          className="w-full resize-y rounded-button border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-live-400 focus:outline-none"
          disabled={posting}
        />
        <p className="text-xs text-gray-500">{newBody.length} / 2000 文字 · 1日経過で自動非表示</p>
        <button type="submit" disabled={posting || !newBody.trim()} className="btn-primary text-sm disabled:opacity-50">
          {posting ? "追加中..." : "追加"}
        </button>
      </form>

      {list.length === 0 ? (
        <p className="text-sm text-gray-500">お知らせはまだありません。</p>
      ) : (
        <ul className="space-y-3">
          {list.map((r) => (
            <li key={r.id} className="rounded-button border border-live-100 bg-white p-3 text-sm">
              <p className="text-xs text-gray-500">
                {new Date(r.created_at).toLocaleString("ja-JP")}
                {r.updated_at !== r.created_at && "（編集済み）"}
              </p>
              {editId === r.id ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    className="w-full resize-y rounded-button border border-gray-300 bg-white px-3 py-2 text-sm focus:border-live-400 focus:outline-none"
                    disabled={posting}
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={saveEdit} disabled={posting || !editBody.trim()} className="btn-primary text-sm disabled:opacity-50">
                      {posting ? "保存中..." : "保存"}
                    </button>
                    <button type="button" onClick={cancelEdit} disabled={posting} className="btn-secondary text-sm">
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-1 whitespace-pre-wrap text-gray-800">{r.body}</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => startEdit(r)} className="text-xs font-bold text-live-600 hover:underline">
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                      className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deletingId === r.id ? "削除中..." : "削除"}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
