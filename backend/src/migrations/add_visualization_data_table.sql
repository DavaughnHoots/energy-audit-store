-- Add visualization_data table for storing energy audit visualizations

-- Create visualization_data table
CREATE TABLE IF NOT EXISTS visualization_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID REFERENCES energy_audits(id) ON DELETE CASCADE,
    visualization_type VARCHAR(100) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups by audit_id
CREATE INDEX IF NOT EXISTS idx_visualization_data_audit_id ON visualization_data(audit_id);

-- Create index for faster lookups by visualization_type
CREATE INDEX IF NOT EXISTS idx_visualization_data_type ON visualization_data(visualization_type);

-- Add comments for documentation
COMMENT ON TABLE visualization_data IS 'Stores visualization data generated from energy audits';
COMMENT ON COLUMN visualization_data.visualization_type IS 'Type of visualization: energy, hvac, lighting, humidity, savings';
COMMENT ON COLUMN visualization_data.data IS 'JSONB data for the visualization';
