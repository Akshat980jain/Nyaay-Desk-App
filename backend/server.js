/**
 * server.js — Crash-Proof Server Entry Point
 *
 * This file wraps app.js with three safety layers so the backend
 * NEVER silently dies in production or development:
 *
 *  Layer 1 — process.on('uncaughtException')
 *    Catches synchronous errors that slip past try/catch blocks.
 *    Logs them and exits so PM2 can restart the process.
 *
 *  Layer 2 — process.on('unhandledRejection')
 *    Catches async/await errors where .catch() or try/catch was omitted.
 *    THIS IS THE #1 CAUSE OF SILENT SERVER CRASHES IN EXPRESS APPS.
 *
 *  Layer 3 — Graceful Shutdown (SIGTERM / SIGINT)
 *    When PM2 or the OS signals a stop, waits for in-flight HTTP requests
 *    to finish before closing. No dropped connections.
 *
 * How to run:
 *   Development : node server.js
 *   Production  : pm2 start ecosystem.config.js
 */

require('dotenv').config();

// ─── Layer 1: Uncaught Synchronous Exceptions ───────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('[FATAL] Uncaught Exception — restarting:');
  console.error(err);
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(1); // PM2 will restart automatically
});

// ─── Layer 2: Unhandled Promise Rejections ──────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('[FATAL] Unhandled Promise Rejection:');
  console.error('Reason :', reason);
  console.error('Promise:', promise);
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(1); // PM2 will restart automatically
});

// ─── Import app and start listening ────────────────────────────────────────
const { server } = require('./app');
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  const cyan = '\x1b[36m';
  const bold = '\x1b[1m';
  const green = '\x1b[32m';
  const gray = '\x1b[90m';
  const underline = '\x1b[4m';
  const reset = '\x1b[0m';

  console.log(`${cyan}${bold}\n  ⚖️  e-Court CMS ${reset}${gray}— Backend API${reset}`);
  console.log(`${gray}  ──────────────────────────────────────────${reset}`);
  console.log(`  ${green}🚀 Live at:${reset}    ${bold}${underline}http://localhost:${PORT}${reset}`);
  console.log(`  ${green}📅 Started:${reset}    ${gray}${new Date().toLocaleTimeString()}${reset}\n`);
});

// ─── Layer 3: Graceful Shutdown ──────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  console.log(`\n[SHUTDOWN] ${signal} received — draining connections...`);

  // Stop accepting new connections; wait for existing ones to finish
  server.close((err) => {
    if (err) {
      console.error('[SHUTDOWN] Error during server close:', err);
      process.exit(1);
    }
    console.log('[SHUTDOWN] ✓ All connections drained. Exiting cleanly.');
    process.exit(0);
  });

  // Force-kill after 15 seconds if connections won't drain
  setTimeout(() => {
    console.error('[SHUTDOWN] Force-killing after 15s timeout.');
    process.exit(1);
  }, 15_000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // PM2 / cloud shutdown
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));  // Ctrl+C in terminal
