-- Migration: 20250324_01_education_user_engagement_tables.sql
-- Creates tables for education page user engagement features including bookmarks, progress tracking, and ratings

-- Create educational_resources table to store the actual resources
CREATE TABLE IF NOT EXISTS educational_resources (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,  -- 'article', 'video', 'infographic', 'quiz', 'calculator'
    topic VARCHAR(50) NOT NULL,
    level VARCHAR(20) NOT NULL,  -- 'beginner', 'intermediate', 'advanced'
    read_time VARCHAR(50),
    thumbnail_url TEXT,
    resource_url TEXT NOT NULL,
    date_published TIMESTAMP NOT NULL DEFAULT NOW(),
    is_featured BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    popularity INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create educational_collections table
CREATE TABLE IF NOT EXISTS educational_collections (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create collection_resources junction table
CREATE TABLE IF NOT EXISTS collection_resources (
    collection_id INTEGER REFERENCES educational_collections(id) ON DELETE CASCADE,
    resource_id INTEGER REFERENCES educational_resources(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (collection_id, resource_id)
);

-- Create resource_bookmarks table for user bookmarks with UUID for user_id
CREATE TABLE IF NOT EXISTS resource_bookmarks (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resource_id INTEGER REFERENCES educational_resources(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, resource_id)
);

-- Create resource_progress table to track user progress with UUID for user_id
CREATE TABLE IF NOT EXISTS resource_progress (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resource_id INTEGER REFERENCES educational_resources(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed'
    progress_percent INTEGER DEFAULT 0,
    last_accessed TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, resource_id)
);

-- Create resource_ratings table for user ratings with UUID for user_id
CREATE TABLE IF NOT EXISTS resource_ratings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resource_id INTEGER REFERENCES educational_resources(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, resource_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON resource_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON resource_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_resource_id ON resource_ratings(resource_id);
CREATE INDEX IF NOT EXISTS idx_educational_resources_type ON educational_resources(type);
CREATE INDEX IF NOT EXISTS idx_educational_resources_topic ON educational_resources(topic);
CREATE INDEX IF NOT EXISTS idx_educational_resources_level ON educational_resources(level);
CREATE INDEX IF NOT EXISTS idx_educational_resources_featured ON educational_resources(is_featured);
