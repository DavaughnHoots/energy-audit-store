-- Add client_id column to energy_audits table
ALTER TABLE energy_audits
ADD COLUMN IF NOT EXISTS client_id UUID;

-- Create index for client_id
CREATE INDEX IF NOT EXISTS idx_energy_audits_client_id ON energy_audits(client_id);

-- Add comment for documentation
COMMENT ON COLUMN energy_audits.client_id IS 'UUID for anonymous users to track their audits';
