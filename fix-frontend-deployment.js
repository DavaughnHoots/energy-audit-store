/**
 * fix-frontend-deployment.js
 * 
 * Script to fix the frontend deployment issue in Heroku
 * by properly configuring the static file serving
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Print a formatted message
 */
function print(message, color = 'reset', isBright = false) {
  const bright = isBright ? colors.bright : '';
  console.log(`${bright}${colors[color]}${message}${colors.reset}`);
}

/**
 * Execute a command and return success status
 */
function runCommand(command, description) {
  print(`\n${description}...`, 'blue', true);
  print(`> ${command}`, 'cyan');
  
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    print(`Failed: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Create a configuration file to ensure frontend files are properly served
 */
function createProcfile() {
  print('\nCreating Procfile...', 'blue', true);
  
  const procfilePath = path.join(__dirname, 'Procfile');
  const procfileContent = 'web: cd backend && npm start';
  
  try {
    fs.writeFileSync(procfilePath, procfileContent);
    print(`Created Procfile with content: ${procfileContent}`, 'green');
    return true;
  } catch (error) {
    print(`Failed to create Procfile: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Create a static.json file to help Heroku serve static files
 */
function createStaticConfig() {
  print('\nCreating static.json configuration...', 'blue', true);
  
  const staticConfigPath = path.join(__dirname, 'static.json');
  const staticConfigContent = JSON.stringify({
    "root": "dist",
    "clean_urls": true,
    "routes": {
      "/**": "index.html"
    }
  }, null, 2);
  
  try {
    fs.writeFileSync(staticConfigPath, staticConfigContent);
    print(`Created static.json with content: ${staticConfigContent}`, 'green');
    return true;
  } catch (error) {
    print(`Failed to create static.json: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Create a simple index.html file to ensure there's a fallback
 */
function createIndexFile() {
  print('\nCreating a simple index.html file...', 'blue', true);
  
  // Create public directory if it doesn't exist
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  const indexPath = path.join(publicDir, 'index.html');
  const indexContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Energy Audit Store</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #2c3e50;
    }
    .info {
      color: #34495e;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      background-color: #3498db;
      color: white;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 4px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Energy Audit Store</h1>
    <div class="info">
      <p>The application is running, but the frontend files have not been properly deployed.</p>
      <p>Please make sure that you've built the frontend files and they are included in the deployment.</p>
      <p>If you're looking for the admin dashboard, it should be available at: <a href="/admin/dashboard">/admin/dashboard</a></p>
    </div>
    <a href="/admin/dashboard" class="button">Go to Admin Dashboard</a>
  </div>
</body>
</html>`;
  
  try {
    fs.writeFileSync(indexPath, indexContent);
    print(`Created index.html at ${indexPath}`, 'green');
    return true;
  } catch (error) {
    print(`Failed to create index.html: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Update the server.js file to look in more places for static files
 */
function createServerConfigOverride() {
  print('\nCreating server configuration override...', 'blue', true);
  
  const configDir = path.join(__dirname, 'backend', 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  const staticConfigPath = path.join(configDir, 'static-paths.js');
  const staticConfigContent = `/**
 * static-paths.js
 * Configuration for static file serving
 */

// Additional paths to check for static files
const STATIC_PATHS = [
  '/app/public', 
  '/app/dist', 
  '/app/build',
  '/app/backend/public',
  '/app/backend/dist',
  '../public',
  '../../public',
  '../../../public',
  '../dist',
  '../../dist',
  '../../../dist'
];

module.exports = { STATIC_PATHS };
`;
  
  try {
    fs.writeFileSync(staticConfigPath, staticConfigContent);
    print(`Created static paths configuration at ${staticConfigPath}`, 'green');
    return true;
  } catch (error) {
    print(`Failed to create static paths configuration: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Create configuration for serving the correct index.html
 */
function createNginxConfig() {
  print('\nCreating Nginx configuration...', 'blue', true);
  
  const nginxDir = path.join(__dirname, 'nginx');
  if (!fs.existsSync(nginxDir)) {
    fs.mkdirSync(nginxDir, { recursive: true });
  }
  
  const nginxConfigPath = path.join(nginxDir, 'nginx.conf.erb');
  const nginxConfigContent = `
daemon off;
worker_processes auto;

events {
  use epoll;
  accept_mutex on;
  worker_connections <%= ENV['NGINX_WORKER_CONNECTIONS'] || 1024 %>;
}

http {
  gzip on;
  gzip_comp_level 2;
  gzip_min_length 512;
  gzip_proxied any;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
  gzip_vary on;

  server_tokens off;

  log_format l2met 'measure#nginx.service=$request_time request_id=$http_x_request_id';
  access_log <%= ENV['NGINX_ACCESS_LOG_PATH'] || 'logs/nginx/access.log' %> l2met;
  error_log <%= ENV['NGINX_ERROR_LOG_PATH'] || 'logs/nginx/error.log' %>;

  include mime.types;
  default_type application/octet-stream;
  sendfile on;

  # Must read the body in 5 seconds.
  client_body_timeout <%= ENV['NGINX_CLIENT_BODY_TIMEOUT'] || 5 %>;

  server {
    listen <%= ENV["PORT"] %>;
    server_name _;
    keepalive_timeout 5;
    client_max_body_size <%= ENV['NGINX_CLIENT_MAX_BODY_SIZE'] || 1 %>M;

    root /app/dist;

    location / {
      try_files $uri $uri/ /index.html;
    }

    location /api {
      proxy_pass http://localhost:5000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_cache_bypass $http_upgrade;
    }
  }
}
`;
  
  try {
    fs.writeFileSync(nginxConfigPath, nginxConfigContent);
    print(`Created Nginx configuration at ${nginxConfigPath}`, 'green');
    return true;
  } catch (error) {
    print(`Failed to create Nginx configuration: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Deploy the changes to Heroku
 */
function deployToHeroku() {
  print('\n==============================================', 'green', true);
  print('         DEPLOYMENT INSTRUCTIONS', 'green', true);
  print('==============================================', 'green', true);
  
  print('\nTo deploy these frontend fixes:', 'cyan');
  
  print('\n1. Add the buildpacks (if not already added):', 'cyan');
  print('   heroku buildpacks:add -i 1 heroku/nodejs -a energy-audit-store', 'dim');
  
  print('\n2. Commit the changes:', 'cyan');
  print('   git add public/index.html Procfile static.json backend/config/static-paths.js', 'dim');
  print('   git commit -m "Add frontend configuration for proper deployment"', 'dim');
  
  print('\n3. Push to Heroku:', 'cyan');
  print('   git push heroku local-heroku-v655:master -f', 'dim');
  
  print('\n4. Check the logs:', 'cyan');
  print('   heroku logs -tail -a energy-audit-store', 'dim');
}

/**
 * Main function
 */
function main() {
  print('==============================================', 'blue', true);
  print('      FRONTEND DEPLOYMENT FIX UTILITY', 'blue', true);
  print('==============================================', 'blue', true);
  print('This script creates configuration for proper frontend deployment\n', 'cyan');
  
  // Create Procfile
  createProcfile();
  
  // Create static.json
  createStaticConfig();
  
  // Create index.html
  createIndexFile();
  
  // Create server configuration override
  createServerConfigOverride();
  
  // Create Nginx configuration
  createNginxConfig();
  
  // Show deployment instructions
  deployToHeroku();
  
  print('\n==============================================', 'green', true);
  print('                  SUMMARY', 'green', true);
  print('==============================================', 'green', true);
  
  print('Created the following configuration files:', 'green');
  print('1. Procfile - Ensures the backend server is started correctly', 'green');
  print('2. static.json - Helps Heroku serve static files', 'green');
  print('3. public/index.html - Fallback index file', 'green');
  print('4. backend/config/static-paths.js - Server configuration for static files', 'green');
  
  print('\nFollow the deployment instructions to push these changes to Heroku.', 'yellow');
  print('After deployment, your frontend should be properly served.', 'yellow');
}

// Run the script
main();
