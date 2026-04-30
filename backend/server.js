/**
 * server.js — Crash-Proof Server Entry Point
 */

require('dotenv').config();

console.log('--- Startup Breadcrumbs ---');
console.log('1. Environment loaded');

// Define colors manually to avoid dependency issues
const cyan = '\x1b[36m';
const bold = '\x1b[1m';
const green = '\x1b[32m';
const gray = '\x1b[90m';
const underline = '\x1b[4m';
const reset = '\x1b[0m';

// ─── Layer 1: Uncaught Synchronous Exceptions ───────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('[FATAL] Uncaught Exception — restarting:');
  console.error(err);
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(1); 
});

// ─── Layer 2: Unhandled Promise Rejections ──────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('[FATAL] Unhandled Promise Rejection — restarting:');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(1);
});

console.log('2. Exception handlers established');

// ─── Import app and start listening ────────────────────────────────────────
console.log('3. Loading application logic (app.js)...');
const { server } = require('./app');
console.log('4. Application logic loaded successfully');

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`${cyan}${bold}\n  ⚖️  e-Court CMS ${reset}${gray}— Backend API${reset}`);
  console.log(`${gray}  ──────────────────────────────────────────${reset}`);
  console.log(`  ${green}🚀 Live at:${reset}    ${bold}${underline}http://localhost:${PORT}${reset}`);
  console.log(`  ${green}📅 Started:${reset}    ${gray}${new Date().toLocaleTimeString()}${reset}\n`);
  console.log('  🔍 Server is now accepting connections...');
});

console.log('5. Startup sequence complete. Waiting for server to listen...');

// ─── Layer 3: Graceful Shutdown ──────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  console.log(`\n[SHUTDOWN] ${signal} received — draining connections...`);
  server.close((err) => {
    if (err) {
      console.error('[SHUTDOWN] Error during server close:', err);
      process.exit(1);
    }
    console.log('[SHUTDOWN] ✓ All connections drained. Exiting cleanly.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('[SHUTDOWN] Force-killing after 15s timeout.');
    process.exit(1);
  }, 15000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
