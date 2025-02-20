-- Drop views first
DROP VIEW IF EXISTS monthly_savings_view;
DROP VIEW IF EXISTS user_audit_statistics;

-- Drop dependent tables
DROP TABLE IF EXISTS audit_recommendations CASCADE;
DROP TABLE IF EXISTS audit_history CASCADE;
DROP TABLE IF EXISTS user_savings CASCADE;
DROP TABLE IF EXISTS recommendations CASCADE;

-- Drop main table with CASCADE to handle any remaining dependencies
DROP TABLE IF EXISTS energy_audits CASCADE;

-- Recreate energy_audits table with correct schema
CREATE TABLE energy_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    client_id UUID,
    basic_info JSONB NOT NULL,
    home_details JSONB NOT NULL,
    current_conditions JSONB NOT NULL,
    heating_cooling JSONB NOT NULL,
    energy_consumption JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    report_generated BOOLEAN DEFAULT false,
    report_generated_at TIMESTAMP WITH TIME ZONE,
    report_download_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    CONSTRAINT energy_audits_status_check 
        CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
);

-- Recreate audit_recommendations table
CREATE TABLE audit_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID REFERENCES energy_audits(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    estimated_savings DECIMAL NOT NULL,
    estimated_cost DECIMAL NOT NULL,
    payback_period DECIMAL NOT NULL,
    implementation_status VARCHAR(50) DEFAULT 'pending',
    products JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT audit_recommendations_status_check 
        CHECK (implementation_status IN ('pending', 'in_progress', 'completed', 'dismissed'))
);

-- Recreate audit_history table
CREATE TABLE audit_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID REFERENCES energy_audits(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recreate user_savings table
CREATE TABLE user_savings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID REFERENCES energy_audits(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(50) NOT NULL,
    notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_energy_audits_user_id ON energy_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_energy_audits_client_id ON energy_audits(client_id);
CREATE INDEX IF NOT EXISTS idx_energy_audits_created_at ON energy_audits(created_at);
CREATE INDEX IF NOT EXISTS idx_energy_audits_status ON energy_audits(status);

CREATE INDEX IF NOT EXISTS idx_audit_recommendations_audit_id ON audit_recommendations(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_recommendations_status ON audit_recommendations(implementation_status);

CREATE INDEX IF NOT EXISTS idx_audit_history_audit_id ON audit_history(audit_id);
CREATE INDEX IF NOT EXISTS idx_user_savings_audit_id ON user_savings(audit_id);

-- Recreate views
CREATE OR REPLACE VIEW monthly_savings_view AS
SELECT 
    ea.user_id,
    DATE_TRUNC('month', us.date) as month,
    SUM(us.amount) as monthly_savings
FROM energy_audits ea
JOIN user_savings us ON ea.id = us.audit_id
GROUP BY ea.user_id, DATE_TRUNC('month', us.date);

CREATE OR REPLACE VIEW user_audit_statistics AS
SELECT 
    u.id as user_id,
    COUNT(ea.id) as total_audits,
    COUNT(CASE WHEN ea.status = 'completed' THEN 1 END) as completed_audits,
    COUNT(ar.id) as total_recommendations,
    COUNT(CASE WHEN ar.implementation_status = 'completed' THEN 1 END) as implemented_recommendations,
    SUM(CASE WHEN ar.implementation_status = 'completed' THEN ar.estimated_savings ELSE 0 END) as total_savings
FROM users u
LEFT JOIN energy_audits ea ON u.id = ea.user_id
LEFT JOIN audit_recommendations ar ON ea.id = ar.audit_id
GROUP BY u.id;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
