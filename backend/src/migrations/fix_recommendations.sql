-- Drop dependent objects first
DROP MATERIALIZED VIEW IF EXISTS dashboard_stats;
DROP VIEW IF EXISTS monthly_savings_view;
DROP TABLE IF EXISTS monthly_savings;

-- Drop and recreate recommendations table
DROP TABLE IF EXISTS recommendations;
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_savings DECIMAL(10,2),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    priority VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    implemented_date TIMESTAMP WITH TIME ZONE,
    implementation_cost DECIMAL(10, 2),
    actual_savings DECIMAL(10, 2),
    savings_accuracy DECIMAL(5, 2),
    last_savings_update TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_recommendations_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT recommendations_status_check 
        CHECK (status IN ('active', 'implemented', 'dismissed', 'in_progress'))
);

-- Recreate indexes
CREATE INDEX idx_recommendations_user_status 
    ON recommendations(user_id, status);
CREATE INDEX idx_recommendations_implementation_date 
    ON recommendations(implementation_date);
CREATE INDEX idx_recommendations_last_savings_update 
    ON recommendations(last_savings_update);

-- Recreate monthly savings table
CREATE TABLE monthly_savings (
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

-- Recreate monthly savings indexes
CREATE INDEX idx_monthly_savings_user_id ON monthly_savings(user_id);
CREATE INDEX idx_monthly_savings_recommendation_id ON monthly_savings(recommendation_id);
CREATE INDEX idx_monthly_savings_month ON monthly_savings(month);

-- Recreate triggers and functions
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

CREATE OR REPLACE FUNCTION calculate_savings_accuracy()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.actual_savings IS NOT NULL AND NEW.estimated_savings != 0 THEN
        NEW.savings_accuracy = (NEW.actual_savings / NEW.estimated_savings) * 100;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_savings_accuracy
    BEFORE INSERT OR UPDATE OF actual_savings ON recommendations
    FOR EACH ROW
    EXECUTE FUNCTION calculate_savings_accuracy();

-- Recreate monthly savings view
CREATE OR REPLACE VIEW monthly_savings_view AS
SELECT 
    user_id,
    DATE_TRUNC('month', implemented_date) as month,
    SUM(estimated_savings) as monthly_savings
FROM recommendations
WHERE status = 'implemented'
    AND implemented_date IS NOT NULL
GROUP BY user_id, DATE_TRUNC('month', implemented_date);

-- Recreate materialized view
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

CREATE UNIQUE INDEX idx_dashboard_stats_user_id 
    ON dashboard_stats(user_id);

CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER refresh_dashboard_stats_on_recommendation_change
    AFTER INSERT OR UPDATE OR DELETE ON recommendations
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_dashboard_stats();

CREATE TRIGGER refresh_dashboard_stats_on_monthly_savings_change
    AFTER INSERT OR UPDATE OR DELETE ON monthly_savings
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_dashboard_stats();
