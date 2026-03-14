"use client";

import { useState, useEffect } from "react";

type Props = { myUserId: string };

export function InviteLinkBlock({ myUserId }: Props) {
  const [copied, setCopied] = useState(false);
  const [fullUrl, setFullUrl] = useState("");

  useEffect(() => {
    setFullUrl(`${window.location.origin}/invite/${myUserId}`);
  }, [myUserId]);

  function copyLink() {
    if (fullUrl && navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="rounded-card border border-live-200 bg-live-50/50 p-4">
      <h2 className="text-sm font-bold text-gray-700">自分の招待リンク</h2>
      <p className="mt-1 text-xs text-gray-600">
        このリンクを友達に送ると、相手が「友達に追加」できます。
      </p>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={fullUrl}
          className="flex-1 rounded-button border border-gray-300 bg-white px-3 py-2 text-xs text-gray-600"
        />
        <button
          type="button"
          onClick={copyLink}
          disabled={!fullUrl}
          className="btn-primary whitespace-nowrap py-2 text-sm disabled:opacity-50"
        >
          {copied ? "コピーしました" : "コピー"}
        </button>
      </div>
    </div>
  );
}
