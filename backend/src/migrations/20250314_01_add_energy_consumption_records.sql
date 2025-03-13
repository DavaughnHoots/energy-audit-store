-- Migration: Add energy consumption records table
-- Date: 2025-03-14

-- Create energy consumption records table
CREATE TABLE IF NOT EXISTS energy_consumption_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id TEXT, -- References property ID in user_settings.property_details JSONB
  record_date DATE NOT NULL,
  electricity_usage NUMERIC(10, 2), -- kWh
  gas_usage NUMERIC(10, 2), -- therms
  water_usage NUMERIC(10, 2), -- gallons
  electricity_cost NUMERIC(10, 2),
  gas_cost NUMERIC(10, 2),
  water_cost NUMERIC(10, 2),
  heating_degree_days NUMERIC(6, 2),
  cooling_degree_days NUMERIC(6, 2),
  weather_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_energy_consumption_user_id ON energy_consumption_records(user_id);
CREATE INDEX idx_energy_consumption_record_date ON energy_consumption_records(record_date);
CREATE INDEX idx_energy_consumption_property ON energy_consumption_records(user_id, property_id);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_energy_consumption_records_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_energy_consumption_timestamp
BEFORE UPDATE ON energy_consumption_records
FOR EACH ROW
EXECUTE FUNCTION update_energy_consumption_records_timestamp();

-- Add function to get monthly consumption summary
CREATE OR REPLACE FUNCTION get_monthly_consumption_summary(p_user_id UUID, p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
  month DATE,
  total_electricity_usage NUMERIC,
  total_gas_usage NUMERIC,
  total_water_usage NUMERIC,
  total_electricity_cost NUMERIC,
  total_gas_cost NUMERIC,
  total_water_cost NUMERIC,
  avg_heating_degree_days NUMERIC,
  avg_cooling_degree_days NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('month', record_date)::DATE AS month,
    SUM(electricity_usage) AS total_electricity_usage,
    SUM(gas_usage) AS total_gas_usage,
    SUM(water_usage) AS total_water_usage,
    SUM(electricity_cost) AS total_electricity_cost,
    SUM(gas_cost) AS total_gas_cost,
    SUM(water_cost) AS total_water_cost,
    AVG(heating_degree_days) AS avg_heating_degree_days,
    AVG(cooling_degree_days) AS avg_cooling_degree_days
  FROM
    energy_consumption_records
  WHERE
    user_id = p_user_id
    AND record_date BETWEEN p_start_date AND p_end_date
  GROUP BY
    DATE_TRUNC('month', record_date)
  ORDER BY
    month;
END;
$$ LANGUAGE plpgsql;

-- Add function to get year-over-year comparison
CREATE OR REPLACE FUNCTION get_yearly_consumption_comparison(p_user_id UUID, p_current_year INTEGER, p_property_id TEXT DEFAULT NULL)
RETURNS TABLE (
  month INTEGER,
  current_year_electricity NUMERIC,
  previous_year_electricity NUMERIC,
  current_year_gas NUMERIC,
  previous_year_gas NUMERIC,
  current_year_water NUMERIC,
  previous_year_water NUMERIC,
  current_year_cost NUMERIC,
  previous_year_cost NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH current_year_data AS (
    SELECT
      EXTRACT(MONTH FROM record_date) AS month,
      SUM(electricity_usage) AS electricity,
      SUM(gas_usage) AS gas,
      SUM(water_usage) AS water,
      SUM(electricity_cost + gas_cost + water_cost) AS total_cost
    FROM
      energy_consumption_records
    WHERE
      user_id = p_user_id
      AND EXTRACT(YEAR FROM record_date) = p_current_year
      AND (p_property_id IS NULL OR property_id = p_property_id)
    GROUP BY
      EXTRACT(MONTH FROM record_date)
  ),
  previous_year_data AS (
    SELECT
      EXTRACT(MONTH FROM record_date) AS month,
      SUM(electricity_usage) AS electricity,
      SUM(gas_usage) AS gas,
      SUM(water_usage) AS water,
      SUM(electricity_cost + gas_cost + water_cost) AS total_cost
    FROM
      energy_consumption_records
    WHERE
      user_id = p_user_id
      AND EXTRACT(YEAR FROM record_date) = p_current_year - 1
      AND (p_property_id IS NULL OR property_id = p_property_id)
    GROUP BY
      EXTRACT(MONTH FROM record_date)
  )
  SELECT
    m.month::INTEGER,
    cy.electricity AS current_year_electricity,
    py.electricity AS previous_year_electricity,
    cy.gas AS current_year_gas,
    py.gas AS previous_year_gas,
    cy.water AS current_year_water,
    py.water AS previous_year_water,
    cy.total_cost AS current_year_cost,
    py.total_cost AS previous_year_cost
  FROM
    (SELECT generate_series(1, 12) AS month) m
  LEFT JOIN
    current_year_data cy ON m.month = cy.month
  LEFT JOIN
    previous_year_data py ON m.month = py.month
  ORDER BY
    m.month;
END;
$$ LANGUAGE plpgsql;
