import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SimpleDashboardLayout,
  RecommendationsList,
  SummaryStats,
  ChartSection,
} from "@/components/dashboard2";
import { fetchAuditHistory, fetchReportData } from "@/services/reportService";
import { AuditRecommendation } from "@/types/energyAudit";
import { useLocalStorage } from "@/utils/authUtils";

interface DashboardStats {
  totalSavings: {
    estimated: number;
    actual: number;
    accuracy: number;
    range?: {
      min: number;
      max: number;
    };
  };
  completedAudits: number;
  activeRecommendations: number;
  implementedChanges: number;
  lastUpdated?: string;
  enhancedRecommendations?: AuditRecommendation[];
  energyAnalysis?: {
    energyBreakdown: { name: string; value: number }[];
    consumption: { name: string; value: number }[];
    savingsAnalysis: {
      name: string;
      estimatedSavings: number;
      actualSavings: number;
    }[];
  };
  userCategories?: string[];
  auditId?: string | null;
  executiveSummary?: {
    totalEnergy: number;
    efficiencyScore: number;
    energyEfficiency: number;
    potentialSavings: number;
  };
}

/**
 * A clean, simplified dashboard that uses the reports API directly
 * and reuses the same components as the reports view for consistency
 */
const NewUserDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Simplified storage with just the essential data
  const [stats, setStats] = useLocalStorage<DashboardStats>(
    "dashboard-stats-v2",
    {
      totalSavings: {
        estimated: 0,
        actual: 0,
        accuracy: 0,
        range: { min: 0, max: 0 },
      },
      completedAudits: 0,
      activeRecommendations: 0,
      implementedChanges: 0,
      enhancedRecommendations: [],
      energyAnalysis: {
        energyBreakdown: [],
        consumption: [],
        savingsAnalysis: [],
      },
      executiveSummary: {
        totalEnergy: 0,
        efficiencyScore: 0,
        energyEfficiency: 0,
        potentialSavings: 0,
      },
    },
  );

  // Fetch most recent audit and then its report data
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    console.log("🔍 Starting dashboard data fetch");

    try {
      // First fetch the most recent audit to get its ID
      console.log("🔍 Fetching audit history...");
      const historyData = await fetchAuditHistory(1, 1);
      console.log("📊 Audit history data:", historyData);

      if (!historyData.audits?.length) {
        console.warn("⚠️ No audits found in history");
        setIsLoading(false);
        return;
      }

      // Get audit ID with proper type safety
      const firstAudit = historyData.audits[0];
      if (!firstAudit || !firstAudit.id) {
        console.error("❌ Missing audit ID in first audit", firstAudit);
        setIsLoading(false);
        return;
      }

      const auditId = firstAudit.id;
      console.log("🔍 Using audit for dashboard:", auditId);

      // Then fetch the report data for this audit
      console.log("🔍 Fetching report data for audit:", auditId);
      const reportData = await fetchReportData(auditId);
      console.log("📊 Report data:", reportData);

      // Count active vs. implemented recommendations
      const recommendations = reportData.recommendations || [];
      const activeCount = recommendations.filter(
        (r) => r.status === "active",
      ).length;
      const implementedCount = recommendations.filter(
        (r) => r.status === "implemented",
      ).length;

      // Calculate total estimated savings
      const totalEstimated =
        reportData.recommendations?.reduce((sum, rec) => {
          let savings = 0;
          if (typeof rec.estimatedSavings === "number") {
            savings = rec.estimatedSavings;
          } else if (rec.estimatedSavings) {
            const parsed = parseFloat(
              String(rec.estimatedSavings).replace(/[^0-9.-]+/g, "") || "0",
            );
            savings = isNaN(parsed) ? 0 : parsed;
          }
          return sum + savings;
        }, 0) || 0;

      // Calculate total actual savings
      const totalActual =
        reportData.recommendations?.reduce((sum, rec) => {
          let savings = 0;
          if (typeof rec.actualSavings === "number") {
            savings = rec.actualSavings;
          } else if (rec.actualSavings) {
            const parsed = parseFloat(
              String(rec.actualSavings).replace(/[^0-9.-]+/g, "") || "0",
            );
            savings = isNaN(parsed) ? 0 : parsed;
          }
          return sum + savings;
        }, 0) || 0;

      // Get the potential savings value
      const potentialSavings =
        reportData.executiveSummary?.potentialSavings || 0;

      // Create a range around this value (approx ±15%)
      const minSavings = Math.round(potentialSavings * 0.85);
      const maxSavings = Math.round(potentialSavings * 1.15);

      // Update stats with the new data
      setStats({
        totalSavings: {
          estimated: totalEstimated,
          actual: totalActual,
          accuracy: totalActual
            ? Math.round((totalActual / totalEstimated) * 100)
            : 0,
          range: { min: minSavings, max: maxSavings },
        },
        completedAudits: historyData.pagination.totalRecords || 0, // Using total records as we discussed earlier
        activeRecommendations: activeCount,
        implementedChanges: implementedCount,
        lastUpdated: new Date().toISOString(),
        enhancedRecommendations: reportData.recommendations || [],
        energyAnalysis: {
          energyBreakdown: reportData.charts?.energyBreakdown || [],
          consumption: reportData.charts?.consumption || [],
          savingsAnalysis: reportData.charts?.savingsAnalysis || [],
        },
        userCategories: (reportData as any).userPreferences?.categories || [],
        auditId,
        executiveSummary: reportData.executiveSummary || {
          totalEnergy: 0,
          efficiencyScore: 0,
          energyEfficiency: 0,
          potentialSavings: 0,
        },
      });

      setError(null);
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setError(
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Unable to Load Dashboard
          </h2>
          <p className="text-gray-600 mb-4">
            We encountered an error while loading your dashboard data. Please
            try again.
          </p>
          <Button
            onClick={() => setRefreshKey((prev) => prev + 1)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Retry Now
          </Button>
        </div>,
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data when refreshKey changes
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshKey]);

  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // If there's an error, show it inside the layout
  if (error) {
    return <SimpleDashboardLayout>{error}</SimpleDashboardLayout>;
  }

  return (
    <SimpleDashboardLayout
      lastUpdated={stats.lastUpdated}
      onRefresh={handleRefresh}
      isLoading={isLoading}
    >
      {/* Summary Stats - Keeping only this section as requested */}
      <SummaryStats stats={stats} />

      {/* Note: Chart Section and Recommendations sections removed to build dashboard piece by piece */}
    </SimpleDashboardLayout>
  );
};

export default NewUserDashboardPage;
