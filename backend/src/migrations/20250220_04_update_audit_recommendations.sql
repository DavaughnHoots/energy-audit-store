-- Add new columns to audit_recommendations table
ALTER TABLE audit_recommendations
ADD COLUMN IF NOT EXISTS actual_savings DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS last_savings_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS implementation_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS implementation_date TIMESTAMP WITH TIME ZONE;

-- Update existing rows to have default values
UPDATE audit_recommendations
SET actual_savings = 0
WHERE actual_savings IS NULL;

-- Create function to calculate total savings
CREATE OR REPLACE FUNCTION calculate_total_savings()
RETURNS TRIGGER AS $func$
BEGIN
    -- Update dashboard_stats for the affected user
    WITH user_stats AS (
        SELECT 
            ea.user_id,
            COALESCE(SUM(ar.estimated_savings), 0) as total_estimated,
            COALESCE(SUM(ar.actual_savings), 0) as total_actual,
            COUNT(DISTINCT ea.id) as completed_audits,
            COUNT(DISTINCT CASE WHEN ar.status = 'active' THEN ar.id END) as active_count,
            COUNT(DISTINCT CASE WHEN ar.status = 'implemented' THEN ar.id END) as implemented_count
        FROM energy_audits ea
        LEFT JOIN audit_recommendations ar ON ea.id = ar.audit_id
        WHERE ea.user_id = (
            SELECT user_id 
            FROM energy_audits 
            WHERE id = NEW.audit_id
        )
        GROUP BY ea.user_id
    )
    INSERT INTO dashboard_stats (
        user_id,
        total_estimated_savings,
        total_actual_savings,
        overall_accuracy,
        completed_audits,
        active_recommendations,
        implemented_changes,
        last_updated
    )
    SELECT 
        user_id,
        total_estimated,
        total_actual,
        CASE 
            WHEN total_estimated = 0 THEN 0
            ELSE (total_actual / total_estimated * 100)
        END,
        completed_audits,
        active_count,
        implemented_count,
        CURRENT_TIMESTAMP
    FROM user_stats
    ON CONFLICT (user_id) 
    DO UPDATE SET
        total_estimated_savings = EXCLUDED.total_estimated_savings,
        total_actual_savings = EXCLUDED.total_actual_savings,
        overall_accuracy = EXCLUDED.overall_accuracy,
        completed_audits = EXCLUDED.completed_audits,
        active_recommendations = EXCLUDED.active_recommendations,
        implemented_changes = EXCLUDED.implemented_changes,
        last_updated = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_total_savings ON audit_recommendations;

-- Create new trigger
CREATE TRIGGER update_total_savings
    AFTER INSERT OR UPDATE OF estimated_savings, actual_savings, status
    ON audit_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION calculate_total_savings();
