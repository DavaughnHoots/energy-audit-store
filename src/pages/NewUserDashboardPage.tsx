import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SimpleDashboardLayout,
  SummaryStats,
  ChartSection,
} from "@/components/dashboard2";
import DashboardRecommendationsAdapter from "@/components/dashboard2/DashboardRecommendationsAdapter";
import { fetchAuditHistory, fetchReportData } from "@/services/reportService";
import { matchProductsToRecommendations } from "@/services/productRecommendationService";
import { AuditRecommendation } from "@/types/energyAudit";
import { useLocalStorage } from "@/utils/authUtils";
import { enhanceEnergyBreakdown } from "@/utils/energyBreakdownCalculations";

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
  budgetConstraint?: number;
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

      // Get recommendations and count active vs. implemented
      const recommendations = reportData.recommendations || [];
      const activeCount = recommendations.filter(
        (r) => r.status === "active",
      ).length;
      const implementedCount = recommendations.filter(
        (r) => r.status === "implemented",
      ).length;

      // Enhance the data using product recommendation service
      // This is the same enhancement process used in the interactive report
      try {
        console.log('Enhancing chart financial data from product recommendations...');
        
        // Get user preferences if available
        const userCategories = reportData.productPreferences?.categories || [];
        const budgetConstraint = reportData.productPreferences?.budgetConstraint || 0;
        
        // Call the product recommendation service to get accurate financial data
        const productMatches = await matchProductsToRecommendations(
          recommendations,
          userCategories,
          budgetConstraint
        );
        
        console.log('Product matches retrieved:', {
          matchCount: productMatches.length,
          recommendationCount: recommendations.length
        });
        
        // Update recommendations with enhanced financial data
        if (productMatches.length > 0) {
          // Update the recommendations with accurate financial values
          const enhancedRecommendations = recommendations.map(rec => {
            const match = productMatches.find(m => m.recommendationId === rec.id);
            if (match?.financialData && (!rec.estimatedSavings || rec.estimatedSavings === 0)) {
              return {
                ...rec,
                estimatedSavings: match.financialData.estimatedSavings,
                estimatedCost: match.financialData.implementationCost,
                paybackPeriod: match.financialData.paybackPeriod
              };
            }
            return rec;
          });
          
          // Update the chart data with enhanced values
          if (reportData.charts?.savingsAnalysis) {
            reportData.charts.savingsAnalysis = enhancedRecommendations.map(rec => ({
              name: rec.title || rec.type,
              estimatedSavings: rec.estimatedSavings || 0,
              actualSavings: rec.actualSavings || 0
            }));
          }
          
          // Replace the original recommendations with enhanced ones
          reportData.recommendations = enhancedRecommendations;
        }
      } catch (err) {
        console.error('Error enhancing chart data:', err);
        // Continue without enhancement if there's an error
      }

      // Now calculate totals with the enhanced data
      
      // Calculate total estimated savings with enhanced data
      const totalEstimated = recommendations.reduce((sum, rec) => {
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

      // Calculate total actual savings with enhanced data
      const totalActual = recommendations.reduce((sum, rec) => {
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
          // Enhance the energy breakdown data to show detailed categories
          energyBreakdown: enhanceEnergyBreakdown(
            reportData.charts?.energyBreakdown || [], 
            // Pass the reportData as audit data - it may contain the relevant fields
            reportData as any
          ),
          consumption: reportData.charts?.consumption || [],
          savingsAnalysis: reportData.charts?.savingsAnalysis || []
        },
        userCategories: (reportData as any).userPreferences?.categories || [],
        auditId,
        executiveSummary: reportData.executiveSummary || {
          totalEnergy: 0,
          efficiencyScore: 0,
          energyEfficiency: 0,
          potentialSavings: 0,
        },
        budgetConstraint: reportData.productPreferences?.budgetConstraint || 0,
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
      {/* Note: Chart Section and Recommendations sections removed to build dashboard piece by piece */}
      {/* Summary Stats */}
      <SummaryStats stats={stats} />

      {/* Spacer */}
      <div className="my-6"></div>

      {/* Chart Section */}
      <ChartSection
        energyBreakdown={stats.energyAnalysis?.energyBreakdown}
        consumption={stats.energyAnalysis?.consumption}
        savingsAnalysis={stats.energyAnalysis?.savingsAnalysis}
        isLoading={isLoading}
      />

      {/* Spacer */}
      <div className="my-6"></div>

      {/* Recommendations Section */}
      <DashboardRecommendationsAdapter
        recommendations={stats.enhancedRecommendations || []}
        userCategories={stats.userCategories || []}
        budgetConstraint={stats.budgetConstraint}
        auditId={stats.auditId}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        dataSource="detailed"
      />

    </SimpleDashboardLayout>
  );
};

export default NewUserDashboardPage;
