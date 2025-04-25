/**
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
