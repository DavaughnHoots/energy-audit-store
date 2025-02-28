-- Add GIN index for full-text search on products table

-- First, create a tsvector column for search
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create a function to update the search vector
CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.product_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.model, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.main_category, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.sub_category, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the search vector
DROP TRIGGER IF EXISTS products_search_vector_update ON products;
CREATE TRIGGER products_search_vector_update
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

-- Create a GIN index on the search vector
CREATE INDEX IF NOT EXISTS products_search_idx ON products USING GIN(search_vector);

-- Update existing records
UPDATE products SET search_vector = 
  setweight(to_tsvector('english', COALESCE(product_name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(model, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(main_category, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(sub_category, '')), 'B');
