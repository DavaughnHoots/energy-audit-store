-- Create the database
CREATE DATABASE energy_efficient_store;

-- Connect to the database
\c energy_efficient_store

-- Enable UUID extension for secure IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table with secure password handling
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'advisor', 'admin')),
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    energy_star_id VARCHAR(100) UNIQUE,
    name VARCHAR(200) NOT NULL,
    main_category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    description TEXT,
    efficiency_rating VARCHAR(50),
    features JSONB,
    specifications JSONB,
    market_info JSONB,
    product_url TEXT,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create energy_audits table
CREATE TABLE energy_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'archived')),
    home_details JSONB NOT NULL,
    current_conditions JSONB NOT NULL,
    heating_cooling JSONB NOT NULL,
    energy_consumption JSONB NOT NULL,
    lighting_details JSONB,
    renewable_potential JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create recommendations table
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID REFERENCES energy_audits(id),
    category VARCHAR(50) NOT NULL,
    priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 5),
    description TEXT NOT NULL,
    estimated_savings DECIMAL(10, 2),
    implementation_cost DECIMAL(10, 2),
    payback_period INTEGER,
    recommended_products JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit FOREIGN KEY (audit_id) REFERENCES energy_audits(id) ON DELETE CASCADE
);

-- Create user_progress table for gamification
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    total_points INTEGER DEFAULT 0,
    badges JSONB DEFAULT '[]'::jsonb,
    audit_completions INTEGER DEFAULT 0,
    energy_savings DECIMAL(10, 2) DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for improved query performance
CREATE INDEX idx_products_categories ON products(main_category, sub_category);
CREATE INDEX idx_energy_audits_user ON energy_audits(user_id);
CREATE INDEX idx_recommendations_audit ON recommendations(audit_id);
CREATE INDEX idx_user_progress_points ON user_progress(total_points DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for dashboard statistics
CREATE VIEW dashboard_stats AS
SELECT 
    COUNT(DISTINCT ea.user_id) as total_users_with_audits,
    COUNT(ea.id) as total_audits,
    COUNT(r.id) as total_recommendations,
    COALESCE(SUM(up.energy_savings), 0) as total_energy_savings,
    COALESCE(AVG(up.total_points), 0) as average_user_points
FROM energy_audits ea
LEFT JOIN recommendations r ON ea.id = r.audit_id
LEFT JOIN user_progress up ON ea.user_id = up.user_id
WHERE ea.status = 'completed';

-- Create helper function for calculating energy savings
CREATE OR REPLACE FUNCTION calculate_annual_savings(
    current_consumption DECIMAL,
    efficiency_improvement DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
    RETURN (current_consumption * efficiency_improvement / 100);
END;
$$ LANGUAGE plpgsql;

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO your_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;