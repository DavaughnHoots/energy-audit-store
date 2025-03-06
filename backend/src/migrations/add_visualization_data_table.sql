-- Migration: Add Visualization Data Table
-- This migration adds a new table to store visualization data for energy audits

-- Create visualization_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS visualization_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id UUID NOT NULL REFERENCES energy_audits(id) ON DELETE CASCADE,
  visualization_type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_visualization_data_audit_id ON visualization_data(audit_id);
CREATE INDEX IF NOT EXISTS idx_visualization_data_type ON visualization_data(visualization_type);

-- Add comment to table
COMMENT ON TABLE visualization_data IS 'Stores visualization data for energy audits, such as chart data and visualization outputs';

-- Add comments to columns
COMMENT ON COLUMN visualization_data.id IS 'Primary key';
COMMENT ON COLUMN visualization_data.audit_id IS 'Foreign key to energy_audits table';
COMMENT ON COLUMN visualization_data.visualization_type IS 'Type of visualization (e.g., energy_breakdown, savings_chart, lighting_efficiency)';
COMMENT ON COLUMN visualization_data.data IS 'JSON data for the visualization';
COMMENT ON COLUMN visualization_data.created_at IS 'Timestamp when the visualization data was created';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON visualization_data TO energy_audit_app;
GRANT USAGE, SELECT ON SEQUENCE visualization_data_id_seq TO energy_audit_app;
