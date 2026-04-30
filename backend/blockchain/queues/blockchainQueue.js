const Queue = require('bull');

let blockchainQueue;
let redisErrorLogged = false; // Only log the Redis error once

// If no REDIS_URL is set, skip Bull entirely and use a mock queue
if (!process.env.REDIS_URL) {
  console.warn('⚠️  REDIS_URL not set — using in-memory mock queue (blockchain jobs will be skipped).');
  blockchainQueue = {
    add: async (name, data) => {
      return { id: 'mock-' + Date.now() };
    },
    process: () => {},
    on: () => {},
    isReady: () => Promise.resolve()
  };
} else {
  try {
    blockchainQueue = new Queue('blockchain-operations', process.env.REDIS_URL, {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: false
      },
      settings: {
        maxStalledCount: 1,
        stalledInterval: 30000
      }
    });

    blockchainQueue.on('error', (error) => {
      if (!redisErrorLogged) {
        console.error('Queue error (non-fatal):', error.message);
        redisErrorLogged = true;
      }
    });

    blockchainQueue.on('failed', (job, err) => {
      console.error(`Job ${job.id} failed:`, err.message);
    });

  } catch (error) {
    console.warn('⚠️  Redis/Bull queue unavailable:', error.message);
    blockchainQueue = {
      add: async (name, data) => {
        return { id: 'mock-' + Date.now() };
      },
      process: () => {},
      on: () => {},
      isReady: () => Promise.resolve()
    };
  }
}

module.exports = blockchainQueue;