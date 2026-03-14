"use client";

import { useState } from "react";
import Link from "next/link";

export function RequestToAdminForm() {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送信に失敗しました");
      setSent(true);
      setBody("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "送信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight text-live-900">管理者への要望</h1>
      <p className="text-sm text-gray-600">
        アプリの改善要望・不具合報告・質問などがあれば送信してください。管理者が確認します。
      </p>

      {sent ? (
        <div className="rounded-card border border-live-200 bg-live-50/50 p-4">
          <p className="font-bold text-live-800">送信しました</p>
          <p className="mt-1 text-sm text-gray-700">管理者が確認します。ありがとうございます。</p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-3 text-sm font-bold text-live-600 hover:underline"
          >
            もう一度送信する
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="request-body" className="block text-sm font-bold text-gray-700">
              内容（2000文字以内）
            </label>
            <textarea
              id="request-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              maxLength={2000}
              placeholder="要望・報告・質問を入力..."
              className="mt-1 w-full resize-y rounded-button border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-live-400 focus:outline-none"
              disabled={loading}
            />
            <p className="mt-0.5 text-xs text-gray-500">{body.length} / 2000 文字</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={loading || !body.trim()} className="btn-primary disabled:opacity-50">
              {loading ? "送信中..." : "送信する"}
            </button>
            <Link href="/" className="btn-secondary">
              キャンセル
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
