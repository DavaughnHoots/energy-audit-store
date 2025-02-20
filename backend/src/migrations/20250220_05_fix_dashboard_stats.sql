-- Drop the materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS dashboard_stats;

-- Create dashboard_stats as a regular table
CREATE TABLE IF NOT EXISTS dashboard_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_estimated_savings DECIMAL(10,2) DEFAULT 0,
    total_actual_savings DECIMAL(10,2) DEFAULT 0,
    overall_accuracy DECIMAL(5,2) DEFAULT 0,
    completed_audits INTEGER DEFAULT 0,
    active_recommendations INTEGER DEFAULT 0,
    implemented_changes INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update dashboard stats
CREATE OR REPLACE FUNCTION update_dashboard_stats_for_user(user_id_param UUID)
RETURNS void AS $func$
BEGIN
    -- Update or insert dashboard stats for the user
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
        ea.user_id,
        COALESCE(SUM(ar.estimated_savings), 0) as total_estimated_savings,
        COALESCE(SUM(ar.actual_savings), 0) as total_actual_savings,
        CASE 
            WHEN COALESCE(SUM(ar.estimated_savings), 0) = 0 THEN 0
            ELSE (COALESCE(SUM(ar.actual_savings), 0) / COALESCE(SUM(ar.estimated_savings), 0) * 100)
        END as overall_accuracy,
        COUNT(DISTINCT ea.id) as completed_audits,
        COUNT(DISTINCT CASE WHEN ar.status = 'active' THEN ar.id END) as active_recommendations,
        COUNT(DISTINCT CASE WHEN ar.status = 'implemented' THEN ar.id END) as implemented_changes,
        CURRENT_TIMESTAMP
    FROM energy_audits ea
    LEFT JOIN audit_recommendations ar ON ea.id = ar.audit_id
    WHERE ea.user_id = user_id_param
    GROUP BY ea.user_id
    ON CONFLICT (user_id) DO UPDATE SET
        total_estimated_savings = EXCLUDED.total_estimated_savings,
        total_actual_savings = EXCLUDED.total_actual_savings,
        overall_accuracy = EXCLUDED.overall_accuracy,
        completed_audits = EXCLUDED.completed_audits,
        active_recommendations = EXCLUDED.active_recommendations,
        implemented_changes = EXCLUDED.implemented_changes,
        last_updated = CURRENT_TIMESTAMP;
END;
$func$ LANGUAGE plpgsql;

-- Create trigger function to update dashboard stats
CREATE OR REPLACE FUNCTION trigger_update_dashboard_stats()
RETURNS TRIGGER AS $func$
DECLARE
    affected_user_id UUID;
BEGIN
    -- Get the affected user_id
    IF TG_TABLE_NAME = 'audit_recommendations' THEN
        SELECT user_id INTO affected_user_id
        FROM energy_audits
        WHERE id = COALESCE(NEW.audit_id, OLD.audit_id);
    END IF;

    -- Update dashboard stats for the affected user
    IF affected_user_id IS NOT NULL THEN
        PERFORM update_dashboard_stats_for_user(affected_user_id);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$func$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_dashboard_stats_on_recommendation_change ON audit_recommendations;

-- Create new triggers
CREATE TRIGGER update_dashboard_stats_on_recommendation_change
    AFTER INSERT OR UPDATE OR DELETE ON audit_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_dashboard_stats();

-- Initialize dashboard stats for all users
INSERT INTO dashboard_stats (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Update stats for all users
DO $$ 
DECLARE 
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM users LOOP
        PERFORM update_dashboard_stats_for_user(user_record.id);
    END LOOP;
END $$;
