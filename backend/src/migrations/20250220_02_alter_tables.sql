-- Add status column to audit_recommendations if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'audit_recommendations' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE audit_recommendations 
        ADD COLUMN status VARCHAR(20) CHECK (status IN ('active', 'implemented'));
    END IF;
END $$;

-- Update existing rows to have a default status
UPDATE audit_recommendations 
SET status = 'active' 
WHERE status IS NULL;

-- Make status column NOT NULL
ALTER TABLE audit_recommendations 
ALTER COLUMN status SET NOT NULL;

-- Create triggers for dashboard stats updates
CREATE OR REPLACE FUNCTION update_dashboard_stats()
RETURNS TRIGGER AS $func$
DECLARE
    affected_user_id UUID;
BEGIN
    -- Determine the affected user_id based on the operation and table
    IF TG_TABLE_NAME = 'monthly_savings' THEN
        affected_user_id := NEW.user_id;
        IF affected_user_id IS NULL AND OLD IS NOT NULL THEN
            affected_user_id := OLD.user_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'audit_recommendations' THEN
        SELECT user_id INTO affected_user_id
        FROM energy_audits
        WHERE id = COALESCE(NEW.audit_id, OLD.audit_id);
    END IF;

    -- If we can't determine the user_id, exit
    IF affected_user_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Update dashboard stats for the affected user
    WITH stats AS (
        SELECT 
            ea.user_id,
            COALESCE(SUM(ar.estimated_savings), 0) as total_estimated_savings,
            COALESCE(SUM(ar.actual_savings), 0) as total_actual_savings,
            CASE 
                WHEN COALESCE(SUM(ar.estimated_savings), 0) = 0 THEN 0
                ELSE (COALESCE(SUM(ar.actual_savings), 0) / COALESCE(SUM(ar.estimated_savings), 0)) * 100
            END as overall_accuracy,
            COUNT(DISTINCT ea.id) as completed_audits,
            COUNT(DISTINCT CASE WHEN ar.status = 'active' THEN ar.id END) as active_recommendations,
            COUNT(DISTINCT CASE WHEN ar.status = 'implemented' THEN ar.id END) as implemented_changes
        FROM energy_audits ea
        LEFT JOIN audit_recommendations ar ON ea.id = ar.audit_id
        WHERE ea.user_id = affected_user_id
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
        affected_user_id,
        total_estimated_savings,
        total_actual_savings,
        overall_accuracy,
        completed_audits,
        active_recommendations,
        implemented_changes,
        CURRENT_TIMESTAMP
    FROM stats
    ON CONFLICT (user_id) DO UPDATE SET
        total_estimated_savings = EXCLUDED.total_estimated_savings,
        total_actual_savings = EXCLUDED.total_actual_savings,
        overall_accuracy = EXCLUDED.overall_accuracy,
        completed_audits = EXCLUDED.completed_audits,
        active_recommendations = EXCLUDED.active_recommendations,
        implemented_changes = EXCLUDED.implemented_changes,
        last_updated = CURRENT_TIMESTAMP;

    RETURN COALESCE(NEW, OLD);
END;
$func$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_dashboard_stats_on_recommendation_change ON audit_recommendations;
DROP TRIGGER IF EXISTS update_dashboard_stats_on_monthly_savings_change ON monthly_savings;

-- Create triggers to update dashboard stats
CREATE TRIGGER update_dashboard_stats_on_recommendation_change
    AFTER INSERT OR UPDATE OR DELETE ON audit_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_dashboard_stats();

CREATE TRIGGER update_dashboard_stats_on_monthly_savings_change
    AFTER INSERT OR UPDATE OR DELETE ON monthly_savings
    FOR EACH ROW
    EXECUTE FUNCTION update_dashboard_stats();
