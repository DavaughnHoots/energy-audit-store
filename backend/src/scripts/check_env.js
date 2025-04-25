// check_env.js - Validates required environment variables
// This file is imported by server.ts to ensure all required environment variables are set

// List of required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'DATABASE_URL'
];

// Optional environment variables with default values
const optionalEnvVars = {
  'PORT': '5000',
  'NODE_ENV': 'development'
};

// Check for required environment variables
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingVars.length > 0) {
  console.error('Error: The following required environment variables are missing:');
  missingVars.forEach(envVar => {
    console.error(`  - ${envVar}`);
  });
  console.error('Please set these environment variables before starting the server.');
  
  // Only exit in production; allow development to continue with warnings
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    console.warn('Continuing in development mode despite missing environment variables.');
  }
}

// Set default values for optional environment variables
Object.entries(optionalEnvVars).forEach(([envVar, defaultValue]) => {
  if (!process.env[envVar]) {
    console.warn(`Warning: Environment variable ${envVar} not set, using default: ${defaultValue}`);
    process.env[envVar] = defaultValue;
  }
});

// Log active environment for debugging
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log('Environment validation complete');

// Export nothing - this module is used for its side effects only
export {};
