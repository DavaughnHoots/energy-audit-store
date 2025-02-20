-- Allow anonymous audits
ALTER TABLE energy_audits
ALTER COLUMN user_id DROP NOT NULL;

-- Add client_id column for anonymous audit tracking
ALTER TABLE energy_audits
ADD COLUMN client_id VARCHAR(36);

-- Create index on client_id for efficient lookups
CREATE INDEX idx_energy_audits_client_id ON energy_audits(client_id);

-- Add function to associate anonymous audits with user
CREATE OR REPLACE FUNCTION associate_anonymous_audits(
  p_user_id UUID,
  p_client_id VARCHAR
) RETURNS VOID AS $$
BEGIN
  UPDATE energy_audits
  SET user_id = p_user_id,
      client_id = NULL
  WHERE client_id = p_client_id;
END;
$$ LANGUAGE plpgsql;
