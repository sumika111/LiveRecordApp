"use client";

import { useState, useCallback, useEffect } from "react";
import { ReportUserButton } from "@/components/ReportUserButton";

export function ReportUserButtonWithPersistence({
  reportedUserId,
  reportedDisplayName,
}: {
  reportedUserId: string;
  reportedDisplayName: string;
}) {
  const [reportIdFromServer, setReportIdFromServer] = useState<string | undefined>(undefined);

  const fetchMyReports = useCallback(async () => {
    try {
      const res = await fetch("/api/reports/mine");
      const data = await res.json();
      if (!res.ok || !data.reports) return;
      const report = (data.reports as { id: string; reported_user_id: string | null }[]).find(
        (r: { reported_user_id: string | null }) => r.reported_user_id === reportedUserId
      );
      setReportIdFromServer(report?.id);
    } catch {
      setReportIdFromServer(undefined);
    }
  }, [reportedUserId]);

  useEffect(() => {
    fetchMyReports();
  }, [fetchMyReports]);

  return (
    <ReportUserButton
      reportedUserId={reportedUserId}
      reportedDisplayName={reportedDisplayName}
      reportIdFromServer={reportIdFromServer}
      onReportsChange={fetchMyReports}
    />
  );
}
