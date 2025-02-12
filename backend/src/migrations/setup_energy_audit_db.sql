-- First, ensure we have the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table if it doesn't exist (basic structure)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create energy_audits table
CREATE TABLE IF NOT EXISTS energy_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
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

-- Create audit_recommendations table
CREATE TABLE IF NOT EXISTS audit_recommendations (
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_energy_audits_user_id ON energy_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_energy_audits_created_at ON energy_audits(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_recommendations_audit_id ON audit_recommendations(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_recommendations_status ON audit_recommendations(implementation_status);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_audit_recommendations_updated_at ON audit_recommendations;
CREATE TRIGGER update_audit_recommendations_updated_at
    BEFORE UPDATE ON audit_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for dashboard statistics
CREATE OR REPLACE VIEW user_audit_statistics AS
SELECT 
    u.id as user_id,
    COUNT(ea.id) as total_audits,
    COUNT(CASE WHEN ea.report_generated THEN 1 END) as completed_audits,
    COUNT(ar.id) as total_recommendations,
    COUNT(CASE WHEN ar.implementation_status = 'completed' THEN 1 END) as implemented_recommendations,
    SUM(CASE WHEN ar.implementation_status = 'completed' THEN ar.estimated_savings ELSE 0 END) as total_savings
FROM users u
LEFT JOIN energy_audits ea ON u.id = ea.user_id
LEFT JOIN audit_recommendations ar ON ea.id = ar.audit_id
GROUP BY u.id;

-- Add comments for documentation
COMMENT ON TABLE energy_audits IS 'Stores energy audit data for each property';
COMMENT ON TABLE audit_recommendations IS 'Stores recommendations generated from energy audits';
COMMENT ON COLUMN energy_audits.status IS 'Current status of the audit: pending, in_progress, completed';
COMMENT ON COLUMN audit_recommendations.implementation_status IS 'Status of recommendation implementation: pending, in_progress, completed';
