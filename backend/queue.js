const Queue = require("bull");

const redisConfig = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const ingestQueue = new Queue("shopify-ingest", redisConfig);

module.exports = ingestQueue;
