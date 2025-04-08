// Check for required environment variables
const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_SSL',
  'FRONTEND_URL',
  'JWT_SECRET',
  'JWT_EXPIRATION',
  'RATE_LIMIT_WINDOW',
  'RATE_LIMIT_MAX'
];

console.log('Checking for required environment variables...');
const missingVars = [];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    missingVars.push(envVar);
  } else {
    console.log(`${envVar}: ✓`);
  }
});

if (missingVars.length > 0) {
  console.warn('Warning: Missing environment variables:');
  missingVars.forEach(envVar => {
    console.warn(`- ${envVar}`);
  });
  console.warn('The application may not function correctly without these variables.');
} else {
  console.log('All required environment variables are set.');
}

// Set default values for missing environment variables
if (!process.env.PORT) process.env.PORT = '5000';
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';
if (!process.env.FRONTEND_URL) process.env.FRONTEND_URL = 'https://energy-audit-store-e66479ed4f2b.herokuapp.com';
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'default-jwt-secret-for-development-only';
if (!process.env.JWT_EXPIRATION) process.env.JWT_EXPIRATION = '24h';
if (!process.env.RATE_LIMIT_WINDOW) process.env.RATE_LIMIT_WINDOW = '15';
if (!process.env.RATE_LIMIT_MAX) process.env.RATE_LIMIT_MAX = '100';

// Export an empty object to make this a valid ES module
export {};
