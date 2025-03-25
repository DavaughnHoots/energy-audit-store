@echo off
echo ===== Running Direct SQL Migration on Heroku =====

echo.
echo === Step 2: Using Heroku pg:psql with SQL commands ===
echo Using Heroku command line to execute direct SQL commands...

echo -- Creating educational_resources table
"C:\Program Files\heroku\bin\heroku.cmd" pg:psql --app energy-audit-store -c "CREATE TABLE IF NOT EXISTS educational_resources (id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT, type VARCHAR(50) NOT NULL, topic VARCHAR(50) NOT NULL, level VARCHAR(20) NOT NULL, read_time VARCHAR(50), thumbnail_url TEXT, resource_url TEXT NOT NULL, date_published TIMESTAMP NOT NULL DEFAULT NOW(), is_featured BOOLEAN DEFAULT FALSE, tags TEXT[], popularity INTEGER DEFAULT 0, created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW());"

echo -- Creating educational_collections table
"C:\Program Files\heroku\bin\heroku.cmd" pg:psql --app energy-audit-store -c "CREATE TABLE IF NOT EXISTS educational_collections (id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT, thumbnail_url TEXT, created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW());"

echo -- Creating collection_resources junction table
"C:\Program Files\heroku\bin\heroku.cmd" pg:psql --app energy-audit-store -c "CREATE TABLE IF NOT EXISTS collection_resources (collection_id INTEGER REFERENCES educational_collections(id) ON DELETE CASCADE, resource_id INTEGER REFERENCES educational_resources(id) ON DELETE CASCADE, position INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (collection_id, resource_id));"

echo -- Creating resource_bookmarks table
"C:\Program Files\heroku\bin\heroku.cmd" pg:psql --app energy-audit-store -c "CREATE TABLE IF NOT EXISTS resource_bookmarks (user_id UUID REFERENCES users(id) ON DELETE CASCADE, resource_id INTEGER REFERENCES educational_resources(id) ON DELETE CASCADE, created_at TIMESTAMP NOT NULL DEFAULT NOW(), PRIMARY KEY (user_id, resource_id));"

echo -- Creating resource_progress table
"C:\Program Files\heroku\bin\heroku.cmd" pg:psql --app energy-audit-store -c "CREATE TABLE IF NOT EXISTS resource_progress (user_id UUID REFERENCES users(id) ON DELETE CASCADE, resource_id INTEGER REFERENCES educational_resources(id) ON DELETE CASCADE, status VARCHAR(20) NOT NULL DEFAULT 'not_started', progress_percent INTEGER DEFAULT 0, last_accessed TIMESTAMP NOT NULL DEFAULT NOW(), created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW(), PRIMARY KEY (user_id, resource_id));"

echo -- Creating resource_ratings table
"C:\Program Files\heroku\bin\heroku.cmd" pg:psql --app energy-audit-store -c "CREATE TABLE IF NOT EXISTS resource_ratings (id SERIAL PRIMARY KEY, user_id UUID REFERENCES users(id) ON DELETE CASCADE, resource_id INTEGER REFERENCES educational_resources(id) ON DELETE CASCADE, rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5), review TEXT, created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW(), UNIQUE (user_id, resource_id));"

echo -- Creating indexes
"C:\Program Files\heroku\bin\heroku.cmd" pg:psql --app energy-audit-store -c "CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON resource_bookmarks(user_id);"
"C:\Program Files\heroku\bin\heroku.cmd" pg:psql --app energy-audit-store -c "CREATE INDEX IF NOT EXISTS idx_progress_user_id ON resource_progress(user_id);"
"C:\Program Files\heroku\bin\heroku.cmd" pg:psql --app energy-audit-store -c "CREATE INDEX IF NOT EXISTS idx_ratings_resource_id ON resource_ratings(resource_id);"
"C:\Program Files\heroku\bin\heroku.cmd" pg:psql --app energy-audit-store -c "CREATE INDEX IF NOT EXISTS idx_educational_resources_type ON educational_resources(type);"
"C:\Program Files\heroku\bin\heroku.cmd" pg:psql --app energy-audit-store -c "CREATE INDEX IF NOT EXISTS idx_educational_resources_topic ON educational_resources(topic);"
"C:\Program Files\heroku\bin\heroku.cmd" pg:psql --app energy-audit-store -c "CREATE INDEX IF NOT EXISTS idx_educational_resources_level ON educational_resources(level);"
"C:\Program Files\heroku\bin\heroku.cmd" pg:psql --app energy-audit-store -c "CREATE INDEX IF NOT EXISTS idx_educational_resources_featured ON educational_resources(is_featured);"

echo.
echo === Migration Complete ===
echo.
echo You can verify the tables were created by running:
echo "C:\Program Files\heroku\bin\heroku.cmd" pg:psql --app energy-audit-store -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name LIKE 'resource_%%' OR table_name LIKE 'educational_%%');"
