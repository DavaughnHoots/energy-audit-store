-- Drop dependent objects first
DROP MATERIALIZED VIEW IF EXISTS dashboard_stats;
DROP VIEW IF EXISTS monthly_savings_view;
DROP TABLE IF EXISTS monthly_savings;
DROP TABLE IF EXISTS recommendations;

-- Create extension for UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create recommendations table
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

-- Create basic index
CREATE INDEX idx_recommendations_user_status 
    ON recommendations(user_id, status);

-- Add additional columns
ALTER TABLE recommendations
    ADD COLUMN IF NOT EXISTS implementation_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS implementation_cost DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS actual_savings DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS savings_accuracy DECIMAL(5, 2),
    ADD COLUMN IF NOT EXISTS last_savings_update TIMESTAMP WITH TIME ZONE;

-- Create additional indexes
CREATE INDEX idx_recommendations_implementation_date 
    ON recommendations(implementation_date);
CREATE INDEX idx_recommendations_last_savings_update 
    ON recommendations(last_savings_update);
