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
  console.error('Missing required environment variables:');
  missingVars.forEach(envVar => {
    console.error(`- ${envVar}`);
  });
  process.exit(1);
} else {
  console.log('All required environment variables are set.');
}
