"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type Props = {
  eventId: string;
  venueName: string;
  initial: {
    event_date: string;
    title: string;
    artist_list: string[];
    memo: string | null;
  };
};

export function EditEventForm({ eventId, venueName, initial }: Props) {
  const router = useRouter();
  const [eventDate, setEventDate] = useState(initial.event_date);
  const [title, setTitle] = useState(initial.title);
  const [artistList, setArtistList] = useState<string[]>(
    initial.artist_list.length > 0 ? initial.artist_list : [""]
  );
  const [memo, setMemo] = useState(initial.memo ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "ok"; text: string } | null>(null);

  const supabase = createClient();

  function addArtistRow() {
    setArtistList((prev) => [...prev, ""]);
  }

  function setArtistAt(index: number, value: string) {
    setArtistList((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setMessage({ type: "error", text: "公演名を入力してください。" });
      return;
    }
    const names = artistList.map((s) => s.trim()).filter(Boolean);
    if (names.length === 0) {
      setMessage({ type: "error", text: "アーティストを1人以上入力してください。" });
      return;
    }
    setSaving(true);
    setMessage(null);

    await supabase.from("events").update({
      event_date: eventDate,
      title: title.trim(),
      artist_name: names[0],
      memo: memo.trim() || null,
    }).eq("id", eventId);

    await supabase.from("event_artists").delete().eq("event_id", eventId);
    for (let i = 0; i < names.length; i++) {
      await supabase.from("event_artists").insert({
        event_id: eventId,
        artist_name: names[i],
        sort_order: i,
      });
    }

    setSaving(false);
    setMessage({ type: "ok", text: "保存しました。" });
    router.push("/my");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">会場</label>
        <p className="mt-0.5 text-sm text-gray-600">{venueName}</p>
        <p className="mt-0.5 text-xs text-gray-500">会場の変更はできません。</p>
      </div>
      <div>
        <label htmlFor="event_date" className="block text-sm font-medium text-gray-700">
          公演日
        </label>
        <input
          id="event_date"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
          className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        />
      </div>
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          公演名
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 〇〇ツアー"
          required
          className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          アーティスト（1欄に1人）
        </label>
        <p className="mt-0.5 text-xs text-gray-500">
          「自分が行ったアーティスト別の回数」の表示に使います。
        </p>
        <div className="mt-2 space-y-2">
          {artistList.map((value, index) => (
            <input
              key={index}
              type="text"
              value={value}
              onChange={(e) => setArtistAt(index, e.target.value)}
              placeholder="アーティスト名"
              className="block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addArtistRow}
          className="mt-2 text-sm font-bold text-live-600 hover:underline"
        >
          ＋ アーティストを追加
        </button>
      </div>
      <div>
        <label htmlFor="memo" className="block text-sm font-medium text-gray-700">
          メモ（任意）
        </label>
        <textarea
          id="memo"
          rows={2}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        />
      </div>
      {message && (
        <p className={message.type === "error" ? "text-sm text-red-600" : "text-sm text-green-600"}>
          {message.text}
        </p>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
        <Link href="/my" className="btn-secondary">
          キャンセル
        </Link>
      </div>
    </form>
  );
}
