-- Migration: Add Weather Data Tables
-- Date: 2025-03-19
-- Description: Creates tables for storing weather data for energy audit calculations

-- Create weather_locations table
CREATE TABLE IF NOT EXISTS weather_locations (
    location_id VARCHAR(50) PRIMARY KEY,
    zip_code VARCHAR(10) NOT NULL,
    city VARCHAR(100),
    county VARCHAR(100),
    state VARCHAR(2),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    climate_zone INT,
    event_frequency DECIMAL(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on zip_code for quick lookups
CREATE INDEX IF NOT EXISTS idx_weather_locations_zip_code ON weather_locations(zip_code);
CREATE INDEX IF NOT EXISTS idx_weather_locations_state ON weather_locations(state);

-- Create weather_degree_days table for monthly degree day data
CREATE TABLE IF NOT EXISTS weather_degree_days (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    heating_degree_days DECIMAL(10,2),
    cooling_degree_days DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES weather_locations(location_id),
    UNIQUE (location_id, year, month)
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_weather_degree_days_location_date 
ON weather_degree_days(location_id, year, month);

-- Create weather_seasonal_factors table for monthly adjustment factors
CREATE TABLE IF NOT EXISTS weather_seasonal_factors (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(50) NOT NULL,
    month INT NOT NULL,
    adjustment_factor DECIMAL(6,4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES weather_locations(location_id),
    UNIQUE (location_id, month)
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_weather_seasonal_factors_location 
ON weather_seasonal_factors(location_id);

-- Create weather_event_statistics table for event impact data
CREATE TABLE IF NOT EXISTS weather_event_statistics (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    count INT,
    avg_duration DECIMAL(8,2),
    avg_severity DECIMAL(5,2),
    energy_impact_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES weather_locations(location_id),
    UNIQUE (location_id, event_type)
);

-- Create index for event types
CREATE INDEX IF NOT EXISTS idx_weather_event_statistics_type 
ON weather_event_statistics(event_type);

-- Create weather_daily_data table (for optional detailed daily data storage)
CREATE TABLE IF NOT EXISTS weather_daily_data (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    avg_temp DECIMAL(6,2),
    min_temp DECIMAL(6,2),
    max_temp DECIMAL(6,2),
    precipitation DECIMAL(6,2),
    heating_degree_days DECIMAL(6,2),
    cooling_degree_days DECIMAL(6,2),
    severe_events INT,
    impact_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES weather_locations(location_id),
    UNIQUE (location_id, date)
);

-- Create index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_weather_daily_data_date 
ON weather_daily_data(date);
CREATE INDEX IF NOT EXISTS idx_weather_daily_data_location_date 
ON weather_daily_data(location_id, date);

-- Record the migration in the migrations table
INSERT INTO migrations (name, applied_at) 
VALUES ('20250319_01_add_weather_data_tables', CURRENT_TIMESTAMP) 
ON CONFLICT (name) DO NOTHING;
