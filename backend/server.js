/**
 * server.js — Crash-Proof Server Entry Point
 */

require('dotenv').config();

console.log('--- Startup Breadcrumbs ---');
console.log('1. Environment loaded');
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('   REDIS_URL:', process.env.REDIS_URL ? 'SET' : 'NOT SET');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');

// ─── Layer 1: Uncaught Synchronous Exceptions ───────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('[FATAL] Uncaught Exception — restarting:');
  console.error(err);
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  // Flush stdout/stderr before exiting
  setTimeout(() => process.exit(1), 500);
});

// ─── Layer 2: Unhandled Promise Rejections ──────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('[FATAL] Unhandled Promise Rejection — restarting:');
  console.error('Reason:', reason);
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  setTimeout(() => process.exit(1), 500);
});

console.log('2. Exception handlers established');

// ─── Import app and start listening ────────────────────────────────────────
console.log('3. Loading application logic (app.js)...');

let server;
try {
  const app = require('./app');
  server = app.server;
  console.log('4. Application logic loaded successfully');
} catch (err) {
  console.error('\n════════════════════════════════════════════════');
  console.error('FATAL: app.js failed to load!');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('════════════════════════════════════════════════\n');
  // Give time for logs to flush before exiting
  setTimeout(() => process.exit(1), 1000);
  // Prevent the rest of the file from executing
  return;
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n  ⚖️  e-Court CMS — Backend API`);
  console.log(`  ──────────────────────────────────────────`);
  console.log(`  🚀 Live at:    http://localhost:${PORT}`);
  console.log(`  📅 Started:    ${new Date().toLocaleTimeString()}\n`);
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
