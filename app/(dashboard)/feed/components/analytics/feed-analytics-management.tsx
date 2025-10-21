"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CombinedWeightFCRTable } from "../weight-sampling/combined-weight-fcr-table";

export function FeedAnalyticsManagement() {
  const t = useTranslations("feed.analytics");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">
            {t("description")}
          </p>
        </div>
        {/* Add button moved into table card header */}
      </div>

      {/* Combined Table */}
      <CombinedWeightFCRTable key={refreshKey} onRefresh={handleRefresh} />
    </div>
  );
}
