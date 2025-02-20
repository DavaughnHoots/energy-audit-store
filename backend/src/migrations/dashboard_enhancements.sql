-- Add monthly savings tracking table
CREATE TABLE IF NOT EXISTS monthly_savings (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    actual_savings DECIMAL(10, 2) NOT NULL,
    estimated_savings DECIMAL(10, 2) NOT NULL,
    implementation_cost DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recommendation_id, month)
);

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_monthly_savings_user_id ON monthly_savings(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_savings_recommendation_id ON monthly_savings(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_monthly_savings_month ON monthly_savings(month);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_monthly_savings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_monthly_savings_timestamp
    BEFORE UPDATE ON monthly_savings
    FOR EACH ROW
    EXECUTE FUNCTION update_monthly_savings_timestamp();

-- Add new columns to recommendations table
ALTER TABLE recommendations
    ADD COLUMN IF NOT EXISTS implementation_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS implementation_cost DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS actual_savings DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS savings_accuracy DECIMAL(5, 2),
    ADD COLUMN IF NOT EXISTS last_savings_update TIMESTAMP WITH TIME ZONE;

-- Add indices for new columns
CREATE INDEX IF NOT EXISTS idx_recommendations_implementation_date 
    ON recommendations(implementation_date);
CREATE INDEX IF NOT EXISTS idx_recommendations_last_savings_update 
    ON recommendations(last_savings_update);

-- Add function to calculate savings accuracy
CREATE OR REPLACE FUNCTION calculate_savings_accuracy()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.actual_savings IS NOT NULL AND NEW.estimated_savings != 0 THEN
        NEW.savings_accuracy = (NEW.actual_savings / NEW.estimated_savings) * 100;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to update savings accuracy
CREATE TRIGGER update_savings_accuracy
    BEFORE INSERT OR UPDATE OF actual_savings ON recommendations
    FOR EACH ROW
    EXECUTE FUNCTION calculate_savings_accuracy();

-- Add materialized view for dashboard statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
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

-- Add index on user_id for the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_user_id 
    ON dashboard_stats(user_id);

-- Add function to refresh dashboard stats
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Add triggers to refresh dashboard stats
CREATE TRIGGER refresh_dashboard_stats_on_recommendation_change
    AFTER INSERT OR UPDATE OR DELETE ON recommendations
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_dashboard_stats();

CREATE TRIGGER refresh_dashboard_stats_on_monthly_savings_change
    AFTER INSERT OR UPDATE OR DELETE ON monthly_savings
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_dashboard_stats();
