import rateLimit from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { getRedisClient, isRedisReady } from '../redis/client.js'

function getStore() {
  const client = getRedisClient()
  if (isRedisReady()) {
    try {
      return new RedisStore({
        sendCommand: (...args) => client.call(...args),
        prefix: 'rl:'
      })
    } catch (err) {
      console.warn('⚠️  [RateLimiter] Could not initialize RedisStore, falling back to MemoryStore:', err.message)
      return undefined
    }
  }
  return undefined // Uses express-rate-limit default MemoryStore
}

// General API rate limiter (300 requests per 15 minutes per IP)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again after 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
      details: null
    }
  }
})

// Stricter rate limiter for authentication endpoints (50 attempts per 15 minutes per IP)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  message: {
    success: false,
    error: {
      message: 'Too many login attempts from this IP, please try again after 15 minutes.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      details: null
    }
  }
})
