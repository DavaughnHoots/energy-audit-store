-- First, ensure the postgres user has all necessary permissions
GRANT ALL PRIVILEGES ON DATABASE postgres TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Ensure the postgres user owns all tables
ALTER TABLE IF EXISTS users OWNER TO postgres;
ALTER TABLE IF EXISTS energy_audits OWNER TO postgres;
ALTER TABLE IF EXISTS audit_recommendations OWNER TO postgres;

-- Refresh permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Create function to update ownership of new tables
CREATE OR REPLACE FUNCTION maintain_postgres_ownership()
RETURNS event_trigger AS $$
DECLARE
    obj record;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands() WHERE command_tag IN ('CREATE TABLE', 'CREATE SEQUENCE')
    LOOP
        EXECUTE format('ALTER %s %s OWNER TO postgres', obj.object_type, obj.object_identity);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create event trigger for new tables
DROP EVENT TRIGGER IF EXISTS ensure_postgres_ownership;
CREATE EVENT TRIGGER ensure_postgres_ownership ON ddl_command_end
WHEN TAG IN ('CREATE TABLE', 'CREATE SEQUENCE')
EXECUTE FUNCTION maintain_postgres_ownership();
