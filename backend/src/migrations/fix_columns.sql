-- Drop dependent tables first
DROP TABLE IF EXISTS audit_recommendations;
DROP TABLE IF EXISTS audit_history;
DROP TABLE IF EXISTS user_savings;

-- Now we can safely drop and recreate the energy_audits table
DROP TABLE IF EXISTS energy_audits CASCADE;

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
    status VARCHAR(50) DEFAULT 'pending'
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_energy_audits_user_id ON energy_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_energy_audits_client_id ON energy_audits(client_id);
CREATE INDEX IF NOT EXISTS idx_energy_audits_created_at ON energy_audits(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_recommendations_audit_id ON audit_recommendations(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_recommendations_status ON audit_recommendations(implementation_status);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
