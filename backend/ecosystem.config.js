/**
 * PM2 Ecosystem Config — ecosystem.config.js
 *
 * PM2 is a production-grade process manager for Node.js.
 * It automatically restarts your server if it crashes,
 * keeps it running across reboots, and provides logs.
 *
 * ─── Setup (one-time) ────────────────────────────────────────────────────────
 *   npm install -g pm2
 *
 * ─── Commands ────────────────────────────────────────────────────────────────
 *   Start   :  pm2 start ecosystem.config.js
 *   Stop    :  pm2 stop ecourt-backend
 *   Restart :  pm2 restart ecourt-backend
 *   Reload  :  pm2 reload ecourt-backend       ← zero-downtime reload
 *   Logs    :  pm2 logs ecourt-backend
 *   Monitor :  pm2 monit
 *   Status  :  pm2 status
 *
 * ─── Persist across reboots (Windows) ────────────────────────────────────────
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 *   (then run the command PM2 prints)
 */

module.exports = {
  apps: [
    {
      // ── Identity ──────────────────────────────────────────────────────────
      name: 'ecourt-backend',
      script: './server.js',       // ← uses server.js (crash-proof wrapper)

      // ── Restart Policy ────────────────────────────────────────────────────
      // Restart automatically on crash. Stop restarting if it crashes
      // more than 10 times in 30 minutes (prevents restart loops).
      max_restarts: 10,
      min_uptime: '30s',           // Must stay up at least 30s to count as stable
      restart_delay: 3000,         // Wait 3 seconds between restart attempts

      // ── Exponential Backoff (prevents hammering a broken service) ─────────
      exp_backoff_restart_delay: 100, // Increases with each crash: 100ms, 200ms, 400ms...

      // ── Environment Variables ─────────────────────────────────────────────
      // PM2 loads .env automatically via dotenv in server.js.
      // You can also set env vars directly here per environment.
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // ── Logging ──────────────────────────────────────────────────────────
      // All stdout + stderr from your app will go here.
      // Rotate logs so they don't fill up your disk.
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // ── Memory Limit ─────────────────────────────────────────────────────
      // Restart if the process exceeds 500MB RAM (prevents memory leaks).
      max_memory_restart: '500M',

      // ── Watch (development only) ──────────────────────────────────────────
      // Uncomment to auto-reload on file changes (like nodemon).
      // WARNING: do NOT enable watch in production.
      // watch: ['app.js', 'routes/', 'models/', 'middleware/', 'services/'],
      // ignore_watch: ['node_modules', 'logs', 'uploads'],

      // ── Source Maps (for better error stack traces) ───────────────────────
      source_map_support: false,

      // ── Instance Mode ─────────────────────────────────────────────────────
      // 'fork' = single process (recommended for socket.io).
      // 'cluster' = multi-core (breaks socket.io without sticky sessions).
      exec_mode: 'fork',
      instances: 1,
    },
  ],
};
