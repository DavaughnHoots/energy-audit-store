-- Drop existing dashboard_stats view if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'dashboard_stats' AND relkind = 'v') THEN
        DROP VIEW dashboard_stats;
    END IF;
END $$;

-- Create audit_recommendations table
CREATE TABLE IF NOT EXISTS audit_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID REFERENCES energy_audits(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) CHECK (priority IN ('high', 'medium', 'low')),
    status VARCHAR(20) CHECK (status IN ('active', 'implemented')),
    estimated_savings DECIMAL(10,2),
    actual_savings DECIMAL(10,2),
    implementation_date TIMESTAMP WITH TIME ZONE,
    implementation_cost DECIMAL(10,2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create monthly_savings table
CREATE TABLE IF NOT EXISTS monthly_savings (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recommendation_id UUID REFERENCES audit_recommendations(id) ON DELETE CASCADE,
    month DATE,
    estimated_savings DECIMAL(10,2),
    actual_savings DECIMAL(10,2),
    implementation_cost DECIMAL(10,2),
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, recommendation_id, month)
);

-- Create dashboard_stats table
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_recommendations_audit_id ON audit_recommendations(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_recommendations_status ON audit_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_monthly_savings_user_id ON monthly_savings(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_savings_month ON monthly_savings(month);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- Apply updated_at trigger to new tables
DROP TRIGGER IF EXISTS update_audit_recommendations_updated_at ON audit_recommendations;
CREATE TRIGGER update_audit_recommendations_updated_at
    BEFORE UPDATE ON audit_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_monthly_savings_updated_at ON monthly_savings;
CREATE TRIGGER update_monthly_savings_updated_at
    BEFORE UPDATE ON monthly_savings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dashboard_stats_updated_at ON dashboard_stats;
CREATE TRIGGER update_dashboard_stats_updated_at
    BEFORE UPDATE ON dashboard_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to update dashboard stats
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

-- Migrate data from recommendations table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'recommendations' AND relkind = 'r') THEN
        INSERT INTO audit_recommendations (
            id,
            audit_id,
            title,
            description,
            priority,
            status,
            estimated_savings,
            implementation_cost,
            updated_at
        )
        SELECT 
            id,
            audit_id,
            category as title,
            description,
            CASE 
                WHEN priority >= 4 THEN 'high'
                WHEN priority >= 2 THEN 'medium'
                ELSE 'low'
            END as priority,
            'active' as status,
            estimated_savings,
            implementation_cost,
            created_at as updated_at
        FROM recommendations
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- Initialize dashboard_stats for existing users
INSERT INTO dashboard_stats (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;
