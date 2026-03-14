"use client";

import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type Props = {
  userId: string;
  initial: {
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    favorite_artists: string | null;
  };
};

/** DB保存用: 1件ずつ "||" で区切る（スペースを含むアーティスト名に対応） */
const FAVORITE_ARTISTS_DELIMITER = "||";

function parseStoredFavoriteArtists(stored: string | null): string[] {
  if (!stored?.trim()) return [];
  return stored
    .split(FAVORITE_ARTISTS_DELIMITER)
    .map((s: string) => s.trim().replace(/^#+/, ""))
    .filter(Boolean);
}

function serializeFavoriteArtists(list: string[]): string | null {
  const trimmed = list.map((s) => s.trim()).filter(Boolean);
  return trimmed.length === 0 ? null : trimmed.join(FAVORITE_ARTISTS_DELIMITER);
}

export function ProfileForm({ userId, initial }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(initial.display_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [favoriteArtistsList, setFavoriteArtistsList] = useState<string[]>(() =>
    parseStoredFavoriteArtists(initial.favorite_artists)
  );
  const [favoriteArtistInput, setFavoriteArtistInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const supabase = createClient();

  const uploadAvatarFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? ext : "jpg";
      const path = `${userId}/avatar.${safeExt}`;
      setUploading(true);
      setMessage(null);
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) {
        setMessage({ type: "error", text: `アイコンのアップロードに失敗しました: ${error.message}` });
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(urlData.publicUrl);
      setUploading(false);
      router.refresh();
    },
    [userId, router]
  );

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatarFile(file);
    e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) uploadAvatarFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = displayName.trim();
    if (!name) {
      setMessage({ type: "error", text: "ニックネームを入力してください。" });
      return;
    }
    if (name.includes("@")) {
      setMessage({ type: "error", text: "メールアドレスは使えません。ニックネームを入力してください。" });
      return;
    }
    setSaving(true);
    setMessage(null);
    const favoriteArtists = serializeFavoriteArtists(favoriteArtistsList);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: name,
        avatar_url: avatarUrl.trim() || null,
        bio: bio.trim() || null,
        favorite_artists: favoriteArtists,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({ type: "ok", text: "プロフィールを保存しました。" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
      <div className="flex items-start gap-4">
        <div
          className="shrink-0"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div
            className={`rounded-xl border-2 border-dashed transition-colors ${
              dragOver ? "border-live-400 bg-live-50/50" : "border-transparent"
            } p-1`}
          >
            {avatarUrl.trim() ? (
              <div className="relative h-16 w-16 overflow-hidden rounded-full bg-surface-muted">
                <Image
                  src={avatarUrl.trim()}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                  unoptimized
                  onError={() => setAvatarUrl("")}
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-live-100 text-2xl font-bold text-live-700">
                {displayName.trim().slice(0, 1) || "?"}
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleAvatarChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-2 block w-full text-center text-xs font-medium text-live-600 hover:text-live-700 disabled:opacity-50"
          >
            {uploading ? "アップロード中..." : "写真から選ぶ"}
          </button>
          <p className="mt-0.5 text-center text-[10px] text-gray-500">
            パソコンではここにドラッグ＆ドロップもできます
          </p>
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
              ニックネーム
            </label>
            <input
              id="nickname"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="例: ライブ好き"
              maxLength={50}
              className="mt-1 block w-full rounded-button border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            />
          </div>
        </div>
      </div>
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          一言（任意）
        </label>
        <textarea
          id="bio"
          rows={2}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="例: ロックとフェスが好きです"
          maxLength={200}
          className="mt-1 block w-full rounded-button border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        />
        <p className="mt-0.5 text-xs text-gray-500">{bio.length}/200文字</p>
      </div>
      <div>
        <label htmlFor="favorite_artists" className="block text-sm font-medium text-gray-700">
          好きなアーティスト（任意）
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="favorite_artists"
            type="text"
            value={favoriteArtistInput}
            onChange={(e) => setFavoriteArtistInput(e.target.value)}
            placeholder="例: ONE OK ROCK"
            className="flex-1 rounded-button border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
          />
          <button
            type="button"
            onClick={() => {
              const v = favoriteArtistInput.trim();
              if (v) {
                setFavoriteArtistsList((prev) => [...prev, v]);
                setFavoriteArtistInput("");
              }
            }}
            className="shrink-0 rounded-button border border-live-300 bg-live-100 px-4 py-2 text-sm font-bold text-live-800 hover:bg-live-200"
          >
            追加
          </button>
        </div>
        {favoriteArtistsList.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {favoriteArtistsList.map((name, index) => (
              <span
                key={`${name}-${index}`}
                className="inline-flex items-center gap-0.5 rounded-full bg-live-100 pl-3 pr-1 py-1 text-sm font-medium text-live-800"
              >
                <Link
                  href={`/timeline?artist=${encodeURIComponent(name)}`}
                  className="hover:text-live-900 hover:underline"
                >
                  #{name}
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFavoriteArtistsList((prev) => prev.filter((_, i) => i !== index));
                  }}
                  className="min-w-[24px] min-h-[24px] rounded-full px-1 hover:bg-live-200 focus:outline-none focus:ring-2 focus:ring-live-500"
                  aria-label={`${name} を削除`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="mt-0.5 text-xs text-gray-500">
          アーティスト名を入力して「追加」でタグを増やせます
        </p>
      </div>
      {message && (
        <p className={message.type === "error" ? "text-sm text-red-600" : "text-sm text-green-600"}>
          {message.text}
        </p>
      )}
      <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
        {saving ? "保存中..." : "保存"}
      </button>
    </form>
  );
}
