-- Add property_details column to user_settings table
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS property_details JSONB;

-- Create index for faster property details lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_property_details 
    ON user_settings USING GIN (property_details);
