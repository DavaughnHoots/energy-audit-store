-- Create recommendations table with UUID type for user_id
CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_savings DECIMAL(10,2),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    priority VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    implemented_date TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_recommendations_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT recommendations_status_check 
        CHECK (status IN ('active', 'implemented', 'dismissed', 'in_progress'))
);

-- Create energy_audits table with UUID type for user_id
CREATE TABLE IF NOT EXISTS energy_audits (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    audit_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
    findings TEXT,
    total_potential_savings DECIMAL(10,2),
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_energy_audits_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT energy_audits_status_check 
        CHECK (status IN ('in_progress', 'completed', 'cancelled'))
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_recommendations_user_status 
    ON recommendations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_energy_audits_user_status 
    ON energy_audits(user_id, status);

-- Create view for monthly savings calculations
CREATE OR REPLACE VIEW monthly_savings_view AS
SELECT 
    user_id,
    DATE_TRUNC('month', implemented_date) as month,
    SUM(estimated_savings) as monthly_savings
FROM recommendations
WHERE status = 'implemented'
    AND implemented_date IS NOT NULL
GROUP BY user_id, DATE_TRUNC('month', implemented_date);
