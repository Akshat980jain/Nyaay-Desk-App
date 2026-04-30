const Queue = require('bull');

let blockchainQueue;

try {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  blockchainQueue = new Queue('blockchain-operations', redisUrl, {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: true,
      removeOnFail: false
    },
    // Don't throw if Redis is unavailable — just log
    settings: {
      maxStalledCount: 1,
      stalledInterval: 30000
    }
  });

  blockchainQueue.on('error', (error) => {
    console.error('Queue error (non-fatal):', error.message);
  });

  blockchainQueue.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err.message);
  });

} catch (error) {
  console.warn('⚠️  Redis/Bull queue unavailable:', error.message);
  console.warn('⚠️  Blockchain operations will run synchronously (no queue).');
  
  // Create a mock queue that runs jobs immediately without Redis
  blockchainQueue = {
    add: async (name, data) => {
      console.log(`[MockQueue] Job "${name}" received (Redis unavailable, skipping queue).`);
      return { id: 'mock-' + Date.now() };
    },
    process: () => {},
    on: () => {},
    isReady: () => Promise.resolve()
  };
}

module.exports = blockchainQueue;