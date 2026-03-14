"use client";

import { useState } from "react";

export function ReportUserButton({
  reportedUserId,
  reportedDisplayName,
  className = "text-sm font-bold text-gray-500 hover:text-red-600 hover:underline disabled:opacity-50",
  reportIdFromServer,
  onReportsChange,
}: {
  reportedUserId: string;
  reportedDisplayName: string;
  className?: string;
  reportIdFromServer?: string;
  onReportsChange?: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  const effectiveReportId = reportId ?? reportIdFromServer ?? null;
  const effectiveDone = done || !!reportIdFromServer;

  async function submitReport() {
    setLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reported_user_id: reportedUserId }),
      });
      const data = await res.json();
      if (res.ok && data.report_id) {
        setReportId(data.report_id);
        setDone(true);
        setModalOpen(false);
        onReportsChange?.();
      } else {
        alert(data.error ?? "通報に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  }

  async function withdrawReport() {
    if (!effectiveReportId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${effectiveReportId}`, { method: "DELETE" });
      if (res.ok) {
        setDone(false);
        setReportId(null);
        onReportsChange?.();
      }
    } finally {
      setLoading(false);
    }
  }

  if (effectiveDone && effectiveReportId) {
    return (
      <span className="text-xs text-gray-500">
        通報しました
        <button
          type="button"
          onClick={withdrawReport}
          disabled={loading}
          className="ml-1 font-bold text-live-600 hover:underline disabled:opacity-50"
        >
          {loading ? "取り消し中..." : "取り消す"}
        </button>
      </span>
    );
  }
  return (
    <>
      <button type="button" onClick={() => setModalOpen(true)} disabled={loading} className={className}>
        {loading ? "送信中..." : "通報"}
      </button>
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setModalOpen(false)}
          aria-modal
          role="dialog"
          aria-labelledby="report-user-modal-title"
        >
          <div
            className="w-full max-w-md rounded-card border border-live-200 bg-surface-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="report-user-modal-title" className="text-lg font-bold text-gray-900">
              「{reportedDisplayName}」を通報しますか？
            </h2>
            <p className="mt-3 text-sm text-gray-700">
              通報すると、<strong>管理者画面にこのユーザー情報と通報者情報が送られます</strong>。管理者が確認し、必要に応じて対応します。
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={loading}
                className="btn-secondary disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={submitReport}
                disabled={loading}
                className="btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "送信中..." : "通報する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
