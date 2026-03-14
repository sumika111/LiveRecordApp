"use client";

import { useState, useEffect } from "react";
import { AdminReports } from "@/components/AdminReports";
import { AdminRequests } from "@/components/AdminRequests";
import { AdminAnnouncements } from "@/components/AdminAnnouncements";

const TABS = [
  { id: "reports" as const, label: "通報一覧" },
  { id: "requests" as const, label: "ユーザーからの要望" },
  { id: "announcements" as const, label: "お知らせ（直しました報告）" },
];

export function AdminTabs() {
  const [active, setActive] = useState<"reports" | "requests" | "announcements">("reports");
  const [readAt, setReadAt] = useState<string | null>(null);
  const [reportCount, setReportCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [requestTabClickCount, setRequestTabClickCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/notifications/count")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          if (d.read_at != null) setReadAt(d.read_at);
          setReportCount(typeof d.reportCount === "number" ? d.reportCount : 0);
          setRequestCount(typeof d.requestCount === "number" ? d.requestCount : 0);
        }
        return fetch("/api/admin/notifications/read", { method: "PATCH" });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleTabClick = (tabId: "reports" | "requests" | "announcements") => {
    if (tabId === "requests") setRequestTabClickCount((c) => c + 1);
    setActive(tabId);
    // 別タブに移ったら未読バッジを消す（通報⇔要望⇔お知らせの切り替え）
    setReportCount(0);
    setRequestCount(0);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b border-live-200">
        {TABS.map((tab) => {
          const badgeCount =
            tab.id === "reports" ? reportCount : tab.id === "requests" ? requestCount : 0;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-1.5 rounded-t-button px-4 py-2.5 text-sm font-bold transition-colors ${
                active === tab.id
                  ? "border border-b-0 border-live-200 bg-white text-live-800 -mb-px"
                  : "text-gray-600 hover:bg-live-50 hover:text-live-700"
              }`}
            >
              {tab.label}
              {badgeCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {active === "reports" && (
        <section className="space-y-3">
          <p className="text-sm text-gray-600">
            通報を確認し、該当ユーザーを削除できます。削除したメールアドレスは再登録できません。
          </p>
          <AdminReports readAt={readAt} />
        </section>
      )}

      {active === "requests" && (
        <section className="space-y-3">
          <p className="text-sm text-gray-600">
            ユーザーが「管理者への要望」から送信した内容です。反映済みなどは削除して構いません。
          </p>
          <AdminRequests readAt={readAt} requestTabClickCount={requestTabClickCount} />
        </section>
      )}

      {active === "announcements" && (
        <section className="space-y-3">
          <p className="text-sm text-gray-600">
            「〇〇直しました」などログイン画面に表示するお知らせです。約1日経つと自動で非表示になります。編集・削除もできます。
          </p>
          <AdminAnnouncements />
        </section>
      )}
    </div>
  );
}
