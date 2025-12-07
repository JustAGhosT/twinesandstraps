#!/usr/bin/env node

/**
 * Azure App Service Startup Wrapper
 * 
 * This script wraps the Next.js standalone server to provide:
 * - Better logging for Azure App Service diagnostics
 * - Graceful error handling during startup
 * - Environment variable validation
 */

console.log('='.repeat(60));
console.log('Starting Twines and Straps SA Application');
console.log('='.repeat(60));
console.log('Timestamp:', new Date().toISOString());
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Working directory:', process.cwd());
console.log('='.repeat(60));

// Validate critical environment variables
console.log('Checking environment variables...');
const requiredEnvVars = ['DATABASE_URL'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error('ERROR: Missing required environment variables:', missingVars.join(', '));
  console.error('Application cannot start without these variables.');
  process.exit(1);
}

console.log('✓ DATABASE_URL is set');

// Check optional but important variables
if (process.env.PORT) {
  console.log('✓ PORT is set:', process.env.PORT);
} else {
  console.log('⚠ PORT is not set, defaulting to 3000');
}

if (process.env.HOSTNAME) {
  console.log('✓ HOSTNAME is set:', process.env.HOSTNAME);
} else {
  console.log('⚠ HOSTNAME is not set');
}

console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('APP_VERSION:', process.env.APP_VERSION || 'not set');

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('='.repeat(60));
  console.error('UNCAUGHT EXCEPTION:');
  console.error('='.repeat(60));
  console.error(error);
  console.error('='.repeat(60));
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('='.repeat(60));
  console.error('UNHANDLED REJECTION:');
  console.error('='.repeat(60));
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  console.error('='.repeat(60));
  process.exit(1);
});

console.log('='.repeat(60));
console.log('Starting Next.js server...');
console.log('='.repeat(60));

// Start the Next.js standalone server
try {
  require('./server.js');
  console.log('✓ Server module loaded successfully');
} catch (error) {
  console.error('='.repeat(60));
  console.error('ERROR: Failed to load server.js');
  console.error('='.repeat(60));
  console.error(error);
  console.error('='.repeat(60));
  process.exit(1);
}
