"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/components/Toast";
import { motion } from "framer-motion";

type Props = {
  userId: string;
  attendanceId: string;
  eventId: string;
  venueName: string;
  initial: {
    event_date: string;
    title: string;
    artist_list: string[];
    memo: string | null;
    photo_url: string | null;
  };
};

export function EditEventForm({ userId, attendanceId, eventId, venueName, initial }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [eventDate, setEventDate] = useState(initial.event_date);
  const [title, setTitle] = useState(initial.title);
  const [artistList, setArtistList] = useState<string[]>(
    initial.artist_list.length > 0 ? initial.artist_list : [""]
  );
  const [memo, setMemo] = useState(initial.memo ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial.photo_url);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
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
    }).eq("id", eventId);

    await supabase.from("event_artists").delete().eq("event_id", eventId);
    for (let i = 0; i < names.length; i++) {
      await supabase.from("event_artists").insert({
        event_id: eventId,
        artist_name: names[i],
        sort_order: i,
      });
    }

    let newPhotoUrl: string | null = photoUrl;
    if (photoFile && photoFile.size > 0) {
      const ext = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
      const path = `${userId}/${attendanceId}.${safeExt}`;
      const { error: uploadError } = await supabase.storage
        .from("attendance-photos")
        .upload(path, photoFile, { upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("attendance-photos").getPublicUrl(path);
        newPhotoUrl = urlData.publicUrl;
      }
    }

    await supabase
      .from("attendances")
      .update({
        memo: memo.trim() || null,
        photo_url: newPhotoUrl,
      })
      .eq("id", attendanceId);

    setSaving(false);
    toast.success("保存しました。");
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
        <label className="block text-sm font-medium text-gray-700">
          思い出の写真（1枚）
        </label>
        <p className="mt-0.5 text-xs text-gray-500 mb-2">
          Macでは写真.appからドラッグ＆ドロップもできます。削除する場合は「写真を削除」を押してから保存してください。
        </p>
        {(photoUrl || photoFile) ? (
          <div className="mt-2 relative inline-block">
            <div
              className="overflow-hidden rounded-card bg-surface-muted aspect-video w-48 relative border-2 border-transparent transition-colors hover:border-live-300"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("border-live-400");
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("border-live-400");
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("border-live-400");
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith("image/")) {
                  setPhotoFile(file);
                  setPhotoUrl(null);
                }
              }}
            >
              {photoFile ? (
                // eslint-disable-next-line @next/next/no-img-element -- 選択中ファイルの blob URL プレビュー用
                <img
                  src={URL.createObjectURL(photoFile)}
                  alt="選択中の写真"
                  className="w-full h-full object-cover"
                />
              ) : photoUrl ? (
                <Image
                  src={photoUrl}
                  alt="現在の写真"
                  fill
                  className="object-cover"
                  sizes="192px"
                  unoptimized
                />
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="text-sm font-bold text-live-600 hover:underline cursor-pointer">
                別の写真を選ぶ
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    setPhotoFile(e.target.files?.[0] ?? null);
                    setPhotoUrl(null);
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setPhotoUrl(null);
                  setPhotoFile(null);
                }}
                className="text-sm font-bold text-red-600 hover:underline"
              >
                写真を削除
              </button>
            </div>
          </div>
        ) : (
          <div
            className="mt-2 rounded-button border-2 border-dashed border-gray-300 bg-surface-muted/50 p-4 text-center transition-colors hover:border-live-300 hover:bg-live-50/30"
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add("border-live-400", "bg-live-50/50");
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("border-live-400", "bg-live-50/50");
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("border-live-400", "bg-live-50/50");
              const file = e.dataTransfer.files[0];
              if (file && file.type.startsWith("image/")) setPhotoFile(file);
            }}
          >
            <input
              id="edit-photo-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
            <label htmlFor="edit-photo-upload" className="cursor-pointer text-sm text-gray-600 hover:text-live-700">
              ここにドラッグ＆ドロップ または クリックして選択
            </label>
          </div>
        )}
      </div>
      <div>
        <label htmlFor="memo" className="block text-sm font-medium text-gray-700">
          楽しかったこと（任意）
        </label>
        <textarea
          id="memo"
          rows={3}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="その日の思い出をメモ"
          className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        />
      </div>
      {message && (
        <p className={message.type === "error" ? "text-sm text-red-600" : "text-sm text-green-600"}>
          {message.text}
        </p>
      )}
      <div className="flex gap-3">
        <motion.button
          type="submit"
          disabled={saving}
          className="btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
          whileHover={!saving ? { scale: 1.02 } : undefined}
          whileTap={!saving ? { scale: 0.98 } : undefined}
        >
          {saving && (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent"
            />
          )}
          {saving ? "保存中..." : "保存"}
        </motion.button>
        <Link href="/my" className="btn-secondary">
          キャンセル
        </Link>
      </div>
    </form>
  );
}
