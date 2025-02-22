-- Create a function to handle monthly savings entries
CREATE OR REPLACE FUNCTION update_monthly_savings()
RETURNS TRIGGER AS $$
BEGIN
    -- When a recommendation is marked as implemented
    IF (NEW.status = 'implemented' AND OLD.status = 'active') THEN
        -- Insert initial monthly savings entry for implementation month
        INSERT INTO monthly_savings (
            user_id,
            recommendation_id,
            month,
            estimated_savings,
            actual_savings,
            implementation_cost,
            notes
        )
        SELECT 
            ea.user_id,
            NEW.id,
            date_trunc('month', NEW.implementation_date),
            NEW.estimated_savings,
            NEW.actual_savings,
            NEW.implementation_cost,
            'Initial implementation'
        FROM energy_audits ea
        WHERE ea.id = NEW.audit_id;

        -- Create entries for the next 11 months
        INSERT INTO monthly_savings (
            user_id,
            recommendation_id,
            month,
            estimated_savings,
            actual_savings
        )
        SELECT 
            ea.user_id,
            NEW.id,
            generate_series(
                date_trunc('month', NEW.implementation_date) + interval '1 month',
                date_trunc('month', NEW.implementation_date) + interval '11 months',
                interval '1 month'
            ),
            NEW.estimated_savings,
            NULL -- Actual savings to be updated later
        FROM energy_audits ea
        WHERE ea.id = NEW.audit_id;
    END IF;

    -- When actual savings are updated
    IF (NEW.actual_savings IS NOT NULL AND NEW.actual_savings != OLD.actual_savings) THEN
        -- Update the monthly_savings entry for the current month
        UPDATE monthly_savings
        SET actual_savings = NEW.actual_savings,
            updated_at = CURRENT_TIMESTAMP
        WHERE recommendation_id = NEW.id
          AND month = date_trunc('month', CURRENT_TIMESTAMP);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for audit_recommendations table
DROP TRIGGER IF EXISTS monthly_savings_trigger ON audit_recommendations;
CREATE TRIGGER monthly_savings_trigger
AFTER UPDATE ON audit_recommendations
FOR EACH ROW
EXECUTE FUNCTION update_monthly_savings();

-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_monthly_savings_user_month 
ON monthly_savings (user_id, month);

CREATE INDEX IF NOT EXISTS idx_monthly_savings_recommendation 
ON monthly_savings (recommendation_id);
