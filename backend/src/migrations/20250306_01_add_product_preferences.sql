-- Add product_preferences column to energy_audits table
ALTER TABLE energy_audits ADD COLUMN IF NOT EXISTS product_preferences JSONB DEFAULT '{"categories": [], "features": [], "budgetConstraint": 5000}'::jsonb;

-- Update existing records to have default product_preferences
UPDATE energy_audits 
SET product_preferences = '{"categories": [], "features": [], "budgetConstraint": 5000}'::jsonb
WHERE product_preferences IS NULL;

-- Add index for product_preferences to improve query performance
CREATE INDEX IF NOT EXISTS idx_energy_audits_product_preferences ON energy_audits USING gin (product_preferences);

-- Add function to search for audits by product category
CREATE OR REPLACE FUNCTION search_audits_by_product_category(category_name TEXT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    client_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    basic_info JSONB,
    product_preferences JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ea.id,
        ea.user_id,
        ea.client_id,
        ea.created_at,
        ea.basic_info,
        ea.product_preferences
    FROM 
        energy_audits ea
    WHERE 
        ea.product_preferences @> jsonb_build_object('categories', jsonb_build_array(category_name))
    ORDER BY 
        ea.created_at DESC;
END;
$$ LANGUAGE plpgsql;
