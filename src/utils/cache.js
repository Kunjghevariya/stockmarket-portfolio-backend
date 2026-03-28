import { createClient } from 'redis';

const url = process.env.REDIS_URL || 'redis://localhost:6379';
const client = createClient({
  url,
  socket: {
    reconnectStrategy: false,
    connectTimeout: 500,
  },
});
const memoryCache = new Map();
let didLogRedisFailure = false;

const formatRedisError = (error) => error?.message || error?.code || 'Unknown Redis error';

client.on('error', (err) => {
  if (!didLogRedisFailure) {
    console.error('Redis Client Error', formatRedisError(err));
    didLogRedisFailure = true;
  }
});

await client.connect().catch((err) => {
  if (!didLogRedisFailure) {
    console.error('Redis connect error', formatRedisError(err));
    didLogRedisFailure = true;
  }
});

function setInMemory(key, value, ttlSeconds = 0) {
  memoryCache.set(key, {
    value,
    expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null,
  });
}

function getFromMemory(key) {
  const cached = memoryCache.get(key);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt && cached.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }

  return cached.value;
}

const cache = {
  async get(key) {
    if (client.isOpen) {
      try {
        return await client.get(key);
      } catch (error) {
        console.error('Redis get failed, falling back to memory cache', error.message);
      }
    }

    return getFromMemory(key);
  },

  async set(key, value, options = {}) {
    const ttlSeconds = Number(options.EX || options.ex || 0);

    if (client.isOpen) {
      try {
        if (ttlSeconds > 0) {
          await client.set(key, value, { EX: ttlSeconds });
        } else {
          await client.set(key, value);
        }
        return;
      } catch (error) {
        console.error('Redis set failed, falling back to memory cache', error.message);
      }
    }

    setInMemory(key, value, ttlSeconds);
  },

  async del(key) {
    if (client.isOpen) {
      try {
        await client.del(key);
      } catch (error) {
        console.error('Redis delete failed, falling back to memory cache', error.message);
      }
    }

    memoryCache.delete(key);
  },
};

export default cache;
