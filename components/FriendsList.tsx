"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Friend = { id: string; display_name: string };

type Props = { initialList: Friend[] };

export function FriendsList({ initialList }: Props) {
  const router = useRouter();
  const [list, setList] = useState<Friend[]>(initialList);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Friend[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const doSearch = useCallback(async () => {
    const q = search.trim();
    if (!q) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/follows/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.users ?? []);
    } finally {
      setSearching(false);
    }
  }, [search]);

  async function addFriend(id: string) {
    setAddingId(id);
    try {
      const res = await fetch("/api/follows/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ following_id: id }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        const added = results.find((u) => u.id === id);
        if (added) {
          setList((prev) => [...prev, added]);
          setResults((prev) => prev.filter((u) => u.id !== id));
        }
        router.refresh();
      }
    } finally {
      setAddingId(null);
    }
  }

  async function removeFriend(id: string) {
    setRemovingId(id);
    try {
      await fetch("/api/follows/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ following_id: id }),
      });
      setList((prev) => prev.filter((u) => u.id !== id));
      router.refresh();
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="mt-3 space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="ニックネームで検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          className="flex-1 rounded-button border border-gray-300 bg-white px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={doSearch}
          disabled={searching}
          className="btn-primary"
        >
          {searching ? "検索中..." : "検索"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="rounded-card border border-live-100 bg-live-50/30 p-3">
          <p className="text-xs font-bold text-gray-600">検索結果</p>
          <ul className="mt-2 space-y-2">
            {results.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2">
                <span className="font-bold text-gray-900">{u.display_name}</span>
                <button
                  type="button"
                  onClick={() => addFriend(u.id)}
                  disabled={!!addingId}
                  className="btn-primary py-1 text-sm disabled:opacity-50"
                >
                  {addingId === u.id ? "追加中..." : "追加"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-sm font-bold text-gray-700">友達一覧（{list.length}人）</p>
        {list.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">まだ友達はいません。検索して追加しましょう。</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {list.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2 rounded-button border border-live-100 bg-surface-card px-3 py-2">
                <span className="font-bold text-gray-900">{u.display_name}</span>
                <button
                  type="button"
                  onClick={() => removeFriend(u.id)}
                  disabled={!!removingId}
                  className="text-sm font-bold text-red-600 hover:underline disabled:opacity-50"
                >
                  {removingId === u.id ? "解除中..." : "解除"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
