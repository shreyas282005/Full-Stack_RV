import Redis from 'ioredis'
import { config } from '../config/env.js'

let isConnected = false
let redisClient = null

export function getRedisClient() {
  if (redisClient) {
    return redisClient
  }

  try {
    redisClient = new Redis(config.redis.url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      retryStrategy(times) {
        // Retry a maximum of 3 times with backoff, then stop to avoid log flooding
        if (times > 3) {
          return null
        }
        return Math.min(times * 300, 1500)
      },
      enableOfflineQueue: false,
      lazyConnect: false
    })

    redisClient.on('connect', () => {
      isConnected = true
      console.log('✅ [Redis] Connected to Redis server at', config.redis.url)
    })

    redisClient.on('ready', () => {
      isConnected = true
      console.log('🚀 [Redis] Client is ready for caching and rate limiting')
    })

    redisClient.on('error', (err) => {
      isConnected = false
      // Do not crash application when Redis is unavailable; log fallback notice
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        console.warn(`⚠️  [Redis] Offline: Cannot connect to ${config.redis.url}. Application operating in PostgreSQL fallback mode.`)
      } else {
        console.warn('⚠️  [Redis] Client error:', err.message)
      }
    })

    redisClient.on('close', () => {
      isConnected = false
    })
  } catch (err) {
    console.warn('⚠️  [Redis] Failed to initialize client:', err.message)
    isConnected = false
  }

  return redisClient
}

export function isRedisReady() {
  return isConnected && redisClient && redisClient.status === 'ready'
}

// Allows injecting a custom mock client for testing or standalone runners
export function setRedisClient(customClient) {
  redisClient = customClient
  isConnected = !!customClient
}

export async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit()
    } catch {
      redisClient.disconnect()
    }
    isConnected = false
  }
}

export default getRedisClient

