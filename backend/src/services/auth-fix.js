// auth-fix.js
import dotenv from 'dotenv';
import pg from 'pg';
import jwt from 'jsonwebtoken';

// Initialize environment variables
dotenv.config();

// Ensure JWT_SECRET is available
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required');
  process.exit(1);
}

// Configure database connection
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function repairAuthentication() {
  const client = await pool.connect();
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    console.log('Finding users with authentication issues...');
    
    // Find all users
    const { rows: users } = await client.query('SELECT id, email, full_name, role FROM users');
    console.log(`Found ${users.length} total users`);
    
    let fixedCount = 0;
    
    for (const user of users) {
      try {
        // Check if user has valid session
        const { rows: sessions } = await client.query(
          'SELECT 1 FROM sessions WHERE user_id = $1 AND expires_at > NOW()',
          [user.id.toString()] // Convert UUID to string since sessions.user_id is varchar
        );
        
        // Check if user has valid refresh token
        const { rows: refreshTokens } = await client.query(
          'SELECT 1 FROM refresh_tokens WHERE user_id = $1 AND expires_at > NOW()',
          [user.id] // Keep as UUID since refresh_tokens.user_id is UUID
        );
        
        let needsRepair = false;
        
        // Generate tokens if needed
        if (sessions.length === 0 || refreshTokens.length === 0) {
          needsRepair = true;
          console.log(`Repairing authentication for ${user.email}...`);
          
          // Generate new tokens
          const accessToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role || 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
          );
          
          const refreshToken = jwt.sign(
            { userId: user.id, tokenType: 'refresh' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
          );
          
          // Insert access token if needed
          if (sessions.length === 0) {
            await client.query(
              'INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'24 hours\')',
              [accessToken, user.id.toString()] // Convert UUID to string
            );
            console.log(`Created access token for ${user.email}`);
          }
          
          // Insert refresh token if needed
          if (refreshTokens.length === 0) {
            await client.query(
              'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
              [refreshToken, user.id] // Keep as UUID
            );
            console.log(`Created refresh token for ${user.email}`);
          }
          
          fixedCount++;
        }
      } catch (userError) {
        console.error(`Error repairing user ${user.email}:`, userError);
      }
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log(`Successfully repaired authentication for ${fixedCount} of ${users.length} users`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in authentication repair:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

repairAuthentication().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
