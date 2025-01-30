-- Function to generate random timestamps within a range
CREATE OR REPLACE FUNCTION random_timestamp(start_date timestamp, end_date timestamp)
RETURNS timestamp AS $$
BEGIN
    RETURN start_date + random() * (end_date - start_date);
END;
$$ LANGUAGE plpgsql;

-- Insert test data for a specific user
DO $$ 
DECLARE
    test_user_id UUID;
    rec_id INT;
BEGIN
    -- Get the first user from the users table
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found in the database';
    END IF;

    -- Create some completed energy audits
    INSERT INTO energy_audits (user_id, audit_date, status, findings, total_potential_savings, completed_at)
    SELECT
        test_user_id,
        random_timestamp(NOW() - INTERVAL '1 year', NOW()),
        'completed',
        'Found opportunities in HVAC and lighting systems',
        random() * 5000,
        random_timestamp(NOW() - INTERVAL '1 year', NOW())
    FROM generate_series(1, 3);

    -- Create some active recommendations
    INSERT INTO recommendations (user_id, title, description, estimated_savings, status, priority, created_at)
    VALUES
        (test_user_id, 'Install LED Lighting', 'Replace all traditional bulbs with LED alternatives', 500.00, 'active', 'high', NOW() - INTERVAL '3 months'),
        (test_user_id, 'Upgrade HVAC Filters', 'Install high-efficiency filters to improve system performance', 300.00, 'active', 'medium', NOW() - INTERVAL '2 months'),
        (test_user_id, 'Smart Thermostat', 'Install a programmable smart thermostat', 400.00, 'active', 'high', NOW() - INTERVAL '1 month');

    -- Create some implemented recommendations with varying implementation dates
    INSERT INTO recommendations (user_id, title, description, estimated_savings, status, priority, created_at, implemented_date)
    VALUES
        (test_user_id, 'Weather Stripping', 'Installed new weather stripping on all exterior doors', 200.00, 'implemented', 'medium', NOW() - INTERVAL '6 months', NOW() - INTERVAL '5 months'),
        (test_user_id, 'Window Insulation', 'Added window film to reduce heat loss', 350.00, 'implemented', 'high', NOW() - INTERVAL '5 months', NOW() - INTERVAL '4 months'),
        (test_user_id, 'Water Heater Insulation', 'Installed water heater blanket', 150.00, 'implemented', 'low', NOW() - INTERVAL '4 months', NOW() - INTERVAL '3 months'),
        (test_user_id, 'Duct Sealing', 'Sealed and insulated HVAC ducts', 450.00, 'implemented', 'high', NOW() - INTERVAL '3 months', NOW() - INTERVAL '2 months'),
        (test_user_id, 'Smart Power Strips', 'Installed smart power strips for electronics', 100.00, 'implemented', 'low', NOW() - INTERVAL '2 months', NOW() - INTERVAL '1 month');

    -- Create some dismissed recommendations
    INSERT INTO recommendations (user_id, title, description, estimated_savings, status, priority, created_at)
    VALUES
        (test_user_id, 'Solar Panel Installation', 'Install rooftop solar panels', 10000.00, 'dismissed', 'low', NOW() - INTERVAL '6 months'),
        (test_user_id, 'Geothermal Heat Pump', 'Install ground-source heat pump system', 15000.00, 'dismissed', 'low', NOW() - INTERVAL '5 months');

    RAISE NOTICE 'Successfully seeded dashboard data for user %', test_user_id;
END $$;
