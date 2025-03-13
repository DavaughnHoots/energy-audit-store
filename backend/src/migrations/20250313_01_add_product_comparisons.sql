-- Migration: Add product comparisons table
-- Date: 2025-03-13

-- Create product_comparisons table
CREATE TABLE IF NOT EXISTS product_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  products JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster user-based queries
CREATE INDEX IF NOT EXISTS idx_product_comparisons_user_id ON product_comparisons(user_id);

-- Add function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_comparisons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update the updated_at timestamp
DROP TRIGGER IF EXISTS update_product_comparisons_updated_at ON product_comparisons;
CREATE TRIGGER update_product_comparisons_updated_at
BEFORE UPDATE ON product_comparisons
FOR EACH ROW
EXECUTE FUNCTION update_product_comparisons_updated_at();

-- Add function to track product history from audits
CREATE OR REPLACE FUNCTION get_product_history(user_id_param UUID, limit_param INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  category VARCHAR,
  price NUMERIC,
  energy_efficiency VARCHAR,
  features TEXT[],
  description TEXT,
  image_url TEXT,
  annual_savings NUMERIC,
  roi NUMERIC,
  payback_period NUMERIC,
  audit_id UUID,
  audit_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.main_category AS category,
    p.price,
    p.energy_efficiency,
    string_to_array(p.features, ',') AS features,
    p.description,
    p.image_url,
    COALESCE(pr.annual_savings, 0) AS annual_savings,
    COALESCE(pr.roi, 0) AS roi,
    COALESCE(pr.payback_period, 0) AS payback_period,
    ea.id AS audit_id,
    ea.created_at AS audit_date
  FROM 
    energy_audits ea
    JOIN product_recommendations pr ON ea.id = pr.audit_id
    JOIN products p ON pr.product_ids @> ARRAY[p.id::text]
  WHERE 
    ea.user_id = user_id_param
    AND ea.status = 'completed'
  ORDER BY 
    ea.created_at DESC,
    p.main_category,
    annual_savings DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON product_comparisons TO energy_audit_app;
GRANT USAGE, SELECT ON SEQUENCE product_comparisons_id_seq TO energy_audit_app;
