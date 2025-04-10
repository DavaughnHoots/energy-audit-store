import React, { useState, useEffect } from "react";
import {
  useUserBadges,
  useRecentAchievements,
} from "../hooks/useBadgeProgress";
import { badgeService } from "../services/badgeService";
import { useAuth } from "../hooks/useAuth";
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  Check,
  HelpCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";

/**
 * Diagnostic page for testing badge functionality
 * This page will help debug issues with the badge system
 */
const BadgesDiagnosticPage: React.FC = () => {
  const { user, error: authError } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<{
    accessToken: boolean;
    refreshToken: boolean;
    tokenDetails: any;
  }>({
    accessToken: false,
    refreshToken: false,
    tokenDetails: null,
  });

  // Check for token presence
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const userJson = localStorage.getItem("user");

    let tokenDetails = null;

    // Try to decode JWT token to check for userId
    if (accessToken) {
      try {
        // Split the JWT token and decode the payload (middle part)
        const parts = accessToken.split(".");
        if (parts.length === 3) {
          // Make sure we have a valid part[1] before decoding
          const payload = JSON.parse(atob(parts[1] || ""));
          tokenDetails = payload;
        }
      } catch (e) {
        console.error("Error decoding token:", e);
      }
    }

    setTokenInfo({
      accessToken: !!accessToken,
      refreshToken: !!refreshToken,
      tokenDetails,
    });

    console.log("Auth debug:", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasUserInStorage: !!userJson,
      user,
      tokenDetails,
    });
  }, [user]);
  const {
    loading,
    error,
    userBadges,
    points,
    allBadges,
    earnedBadges,
    inProgressBadges,
    lockedBadges,
    refreshBadges,
  } = useUserBadges();

  const { achievements, loading: achievementsLoading } =
    useRecentAchievements(5);
  const [refreshing, setRefreshing] = useState(false);
  const [evaluationStatus, setEvaluationStatus] = useState<string | null>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  // Function to force a manual evaluation of all badges
  async function handleForceEvaluation() {
    if (!user?.id) {
      setEvaluationError("No user ID available");
      return;
    }

    try {
      setEvaluationStatus("Evaluating badges...");
      setEvaluationError(null);
      setRefreshing(true);

      // Attempt to manually trigger badge evaluation
      const evalResult = await badgeService.evaluateAllBadges(user.id);
      console.log("Badge evaluation results:", evalResult);

      // Refresh the badges to show updated status
      await refreshBadges();

      setEvaluationStatus("Badge evaluation completed successfully.");
    } catch (err) {
      console.error("Error evaluating badges:", err);
      setEvaluationError(
        `Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setRefreshing(false);
    }
  }

  // Function to manually refresh the badge cache
  async function handleManualRefresh() {
    try {
      setRefreshing(true);
      await refreshBadges();
    } catch (err) {
      console.error("Error refreshing badges:", err);
    } finally {
      setRefreshing(false);
    }
  }

  // Function to clear localStorage of badge-related data
  function handleClearLocalStorage() {
    // Find and remove any badge-related keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes("badge") || key.includes("Badge"))) {
        keysToRemove.push(key);
      }
    }

    // Remove the found keys
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    console.log(
      `Cleared ${keysToRemove.length} badge-related items from localStorage`,
    );
    alert(
      `Cleared ${keysToRemove.length} badge-related items from localStorage`,
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-row justify-between items-center">
          <h1 className="text-2xl font-bold">Badges Diagnostic Page</h1>
          <div className="flex gap-2">
            <Button
              onClick={handleManualRefresh}
              disabled={loading || refreshing}
              className="flex items-center gap-2"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Badges
            </Button>
            <Button
              onClick={handleForceEvaluation}
              disabled={loading || refreshing}
              variant="secondary"
              className="flex items-center gap-2"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Force Evaluation
            </Button>
            <Button
              onClick={handleClearLocalStorage}
              variant="destructive"
              className="flex items-center gap-2"
            >
              Clear Local Storage
            </Button>
          </div>
        </div>

        {/* User authentication status */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span>User authenticated</span>
              </div>
              <div>
                <p>
                  <strong>User ID:</strong> {user.id}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Role:</strong> {user.role || "unknown"}
                </p>
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                  <p className="font-medium">Token Information:</p>
                  <p>Access Token: {tokenInfo.accessToken ? "Present" : "Missing"}</p>
                  <p>Refresh Token: {tokenInfo.refreshToken ? "Present" : "Missing"}</p>
                  {tokenInfo.tokenDetails && (
                    <div className="mt-1">
                      <p className="font-medium">Token Payload:</p>
                      <pre className="overflow-x-auto bg-gray-200 p-1 rounded">
                        {JSON.stringify(tokenInfo.tokenDetails, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>User not authenticated - badges will not load</span>
            </div>
          )}
        </div>

        {/* Badge loading status */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Badge Loading Status</h2>

          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading badges...</span>
            </div>
          ) : error ? (
            <div className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p>
                    <strong>Total Badge Types:</strong> {allBadges.length}
                  </p>
                  <p>
                    <strong>Earned Badges:</strong> {earnedBadges.length}
                  </p>
                  <p>
                    <strong>In-Progress Badges:</strong>{" "}
                    {inProgressBadges.length}
                  </p>
                  <p>
                    <strong>Locked Badges:</strong> {lockedBadges.length}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Points:</strong> {points?.points || 0}
                  </p>
                  <p>
                    <strong>Level:</strong> {points?.level || 1}
                  </p>
                  <p>
                    <strong>Current Title:</strong> {points?.title || "N/A"}
                  </p>
                  <p>
                    <strong>Next Level Points:</strong>{" "}
                    {points?.nextLevelPoints || 100}
                  </p>
                </div>
              </div>

              {evaluationStatus && (
                <div className="p-2 bg-green-50 text-green-700 rounded border border-green-200">
                  {evaluationStatus}
                </div>
              )}

              {evaluationError && (
                <div className="p-2 bg-red-50 text-red-700 rounded border border-red-200">
                  {evaluationError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent achievements */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Recent Achievements</h2>

          {achievementsLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading achievements...</span>
            </div>
          ) : achievements.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="p-3 bg-white rounded-md border"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{achievement.icon}</div>
                    <div>
                      <h3 className="font-semibold">{achievement.name}</h3>
                      <p className="text-sm text-gray-600">
                        {achievement.description}
                      </p>
                      {achievement.reward && (
                        <p className="text-xs text-green-600 mt-1">
                          {achievement.reward.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <HelpCircle className="h-5 w-5" />
              <span>No recent achievements found</span>
            </div>
          )}
        </div>

        {/* All Badge Data (Debug View) */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">
            Badge Data (Debug View)
          </h2>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <h3 className="font-medium mb-1">
                Earned Badges ({earnedBadges.length})
              </h3>
              {earnedBadges.length > 0 ? (
                <div className="divide-y bg-white rounded-md border overflow-hidden">
                  {earnedBadges.map((badge) => (
                    <div
                      key={badge.badgeId}
                      className="p-3 flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium">{badge.badgeId}</span>
                        <div className="text-xs text-gray-500">
                          {badge.earnedDate && (
                            <span>
                              Earned at:{" "}
                              {new Date(badge.earnedDate).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-green-600 font-semibold">100%</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm p-3 bg-white rounded-md border">
                  No earned badges found
                </div>
              )}
            </div>

            <div>
              <h3 className="font-medium mb-1">
                In-Progress Badges ({inProgressBadges.length})
              </h3>
              {inProgressBadges.length > 0 ? (
                <div className="divide-y bg-white rounded-md border overflow-hidden">
                  {inProgressBadges.map((badge) => (
                    <div
                      key={badge.badgeId}
                      className="p-3 flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium">{badge.badgeId}</span>
                      </div>
                      <div className="text-blue-600 font-semibold">
                        {badge.progress}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm p-3 bg-white rounded-md border">
                  No in-progress badges found
                </div>
              )}
            </div>

            <div>
              <h3 className="font-medium mb-1">
                Badge Definitions ({allBadges.length})
              </h3>
              <div className="max-h-60 overflow-y-auto divide-y bg-white rounded-md border">
                {allBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="p-3 flex justify-between items-center"
                  >
                    <div>
                      <span className="font-medium">{badge.name}</span>
                      <div className="text-xs text-gray-500">
                        ID: {badge.id} | Category: {badge.category} | Tier:{" "}
                        {badge.tier}
                      </div>
                    </div>
                    <div className="text-xs bg-gray-100 p-1 rounded">
                      Threshold: {badge.criteria.threshold}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BadgesDiagnosticPage;
