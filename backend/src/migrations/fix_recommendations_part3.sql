-- Create materialized view for dashboard statistics
CREATE MATERIALIZED VIEW dashboard_stats AS
WITH user_stats AS (
    SELECT 
        u.id as user_id,
        COUNT(DISTINCT ea.id) as completed_audits,
        COUNT(DISTINCT CASE WHEN ar.status = 'active' THEN ar.id END) as active_recommendations,
        COUNT(DISTINCT CASE WHEN ar.status = 'implemented' THEN ar.id END) as implemented_changes,
        COALESCE(SUM(ar.estimated_savings), 0) as total_estimated_savings,
        COALESCE(SUM(ar.actual_savings), 0) as total_actual_savings,
        CASE 
            WHEN SUM(ar.estimated_savings) > 0 
            THEN (SUM(ar.actual_savings) / SUM(ar.estimated_savings)) * 100 
            ELSE 0 
        END as overall_accuracy
    FROM users u
    LEFT JOIN energy_audits ea ON ea.user_id = u.id
    LEFT JOIN recommendations ar ON ar.user_id = u.id
    GROUP BY u.id
)
SELECT 
    user_id,
    completed_audits,
    active_recommendations,
    implemented_changes,
    total_estimated_savings,
    total_actual_savings,
    overall_accuracy,
    CURRENT_TIMESTAMP as last_updated
FROM user_stats;

-- Create index for materialized view
CREATE UNIQUE INDEX idx_dashboard_stats_user_id 
    ON dashboard_stats(user_id);

-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers to refresh dashboard stats
CREATE TRIGGER refresh_dashboard_stats_on_recommendation_change
    AFTER INSERT OR UPDATE OR DELETE ON recommendations
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_dashboard_stats();

CREATE TRIGGER refresh_dashboard_stats_on_monthly_savings_change
    AFTER INSERT OR UPDATE OR DELETE ON monthly_savings
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_dashboard_stats();
