"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function NicknameForm({
  userId,
  initialDisplayName,
}: {
  userId: string;
  initialDisplayName: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialDisplayName ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nickname = value.trim();
    if (!nickname) {
      setMessage({ type: "error", text: "ニックネームを入力してください。" });
      return;
    }
    if (nickname.includes("@")) {
      setMessage({ type: "error", text: "メールアドレスは使えません。ニックネームを入力してください。" });
      return;
    }
    setSaving(true);
    setMessage(null);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: nickname, updated_at: new Date().toISOString() })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({ type: "ok", text: "ニックネームを保存しました。ランキングにこの名前で表示されます。" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
      <div>
        <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
          ニックネーム
        </label>
        <p className="mt-0.5 text-xs text-gray-500">
          ランキングに表示される名前です。メールアドレスは表示されません。
        </p>
        <input
          id="nickname"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="例: ライブ好き"
          maxLength={50}
          className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        />
      </div>
      {message && (
        <p className={message.type === "error" ? "text-sm text-red-600" : "text-sm text-green-600"}>
          {message.text}
        </p>
      )}
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
        {saving ? "保存中..." : "保存"}
      </button>
    </form>
  );
}
