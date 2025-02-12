-- Add new columns to energy_audits table
ALTER TABLE energy_audits
ADD COLUMN IF NOT EXISTS report_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS report_generated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS report_download_count INTEGER DEFAULT 0;

-- Create recommendations table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES energy_audits(id),
  category VARCHAR(100) NOT NULL,
  priority VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_savings DECIMAL NOT NULL,
  estimated_cost DECIMAL NOT NULL,
  payback_period DECIMAL NOT NULL,
  implementation_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_audit_recommendations_audit_id 
ON audit_recommendations(audit_id);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_audit_recommendations_updated_at
    BEFORE UPDATE ON audit_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
