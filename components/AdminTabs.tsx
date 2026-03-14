"use client";

import { useState } from "react";
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b border-live-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`rounded-t-button px-4 py-2.5 text-sm font-bold transition-colors ${
              active === tab.id
                ? "border border-b-0 border-live-200 bg-white text-live-800 -mb-px"
                : "text-gray-600 hover:bg-live-50 hover:text-live-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === "reports" && (
        <section className="space-y-3">
          <p className="text-sm text-gray-600">
            通報を確認し、該当ユーザーを削除できます。削除したメールアドレスは再登録できません。
          </p>
          <AdminReports />
        </section>
      )}

      {active === "requests" && (
        <section className="space-y-3">
          <p className="text-sm text-gray-600">
            ユーザーが「管理者への要望」から送信した内容です。反映済みなどは削除して構いません。
          </p>
          <AdminRequests />
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
