-- Create monthly savings table
CREATE TABLE monthly_savings (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    actual_savings DECIMAL(10, 2) NOT NULL,
    estimated_savings DECIMAL(10, 2) NOT NULL,
    implementation_cost DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recommendation_id, month)
);

-- Create monthly savings indexes
CREATE INDEX idx_monthly_savings_user_id ON monthly_savings(user_id);
CREATE INDEX idx_monthly_savings_recommendation_id ON monthly_savings(recommendation_id);
CREATE INDEX idx_monthly_savings_month ON monthly_savings(month);

-- Create triggers and functions
CREATE OR REPLACE FUNCTION update_monthly_savings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_monthly_savings_timestamp
    BEFORE UPDATE ON monthly_savings
    FOR EACH ROW
    EXECUTE FUNCTION update_monthly_savings_timestamp();

CREATE OR REPLACE FUNCTION calculate_savings_accuracy()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.actual_savings IS NOT NULL AND NEW.estimated_savings != 0 THEN
        NEW.savings_accuracy = (NEW.actual_savings / NEW.estimated_savings) * 100;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_savings_accuracy
    BEFORE INSERT OR UPDATE OF actual_savings ON recommendations
    FOR EACH ROW
    EXECUTE FUNCTION calculate_savings_accuracy();

-- Create monthly savings view
CREATE OR REPLACE VIEW monthly_savings_view AS
SELECT 
    user_id,
    DATE_TRUNC('month', implemented_date) as month,
    SUM(estimated_savings) as monthly_savings
FROM recommendations
WHERE status = 'implemented'
    AND implemented_date IS NOT NULL
GROUP BY user_id, DATE_TRUNC('month', implemented_date);
