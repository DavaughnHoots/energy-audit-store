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
