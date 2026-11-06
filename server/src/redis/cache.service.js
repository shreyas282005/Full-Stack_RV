import { getRedisClient, isRedisReady, setRedisClient } from './client.js'
import { config } from '../config/env.js'

/**
 * Generates a consistent, canonical Redis cache key for item listing queries.
 */
export function generateItemListKey({
  search = '',
  category = 'all',
  status = 'AVAILABLE',
  locality = '',
  page = 1,
  limit = 20
} = {}) {
  const normSearch = search.trim().toLowerCase()
  const normLocality = locality.trim().toLowerCase()
  return `items:list:cat=${category}:q=${normSearch}:loc=${normLocality}:st=${status}:p=${page}:lim=${limit}`
}

export function generateItemDetailKey(itemId) {
  return `items:detail:${itemId}`
}

export const cacheService = {
  isAvailable() {
    return isRedisReady()
  },

  setClient(client) {
    if (client) {
      client.status = 'ready'
    }
    setRedisClient(client)
  },

  /**
   * Retrieves an item from the cache.
   * If Redis is offline or throws, gracefully returns null to trigger PostgreSQL fallback.
   */
  async get(key) {
    const client = getRedisClient()
    if (!isRedisReady()) {
      return null
    }

    try {
      const cached = await client.get(key)
      if (cached) {
        console.log(`⚡ [Redis Cache] HIT: "${key}"`)
        return JSON.parse(cached)
      }
      console.log(`💨 [Redis Cache] MISS: "${key}"`)
      return null
    } catch (err) {
      console.warn(`⚠️  [Redis Cache] GET error for "${key}":`, err.message)
      return null // Graceful fallback
    }
  },

  /**
   * Sets a value in the cache with a TTL (in seconds).
   */
  async set(key, value, ttlSeconds = config.redis.defaultTtl) {
    const client = getRedisClient()
    if (!isRedisReady()) {
      return false
    }

    try {
      await client.set(key, JSON.stringify(value), 'EX', ttlSeconds)
      console.log(`💾 [Redis Cache] SET: "${key}" (TTL: ${ttlSeconds}s)`)
      return true
    } catch (err) {
      console.warn(`⚠️  [Redis Cache] SET error for "${key}":`, err.message)
      return false
    }
  },

  /**
   * Deletes a specific key from the cache.
   */
  async del(key) {
    const client = getRedisClient()
    if (!isRedisReady()) {
      return false
    }

    try {
      await client.del(key)
      console.log(`🗑️  [Redis Cache] INVALIDATED: "${key}"`)
      return true
    } catch (err) {
      console.warn(`⚠️  [Redis Cache] DEL error for "${key}":`, err.message)
      return false
    }
  },

  /**
   * Invalidates all keys matching a pattern (e.g., 'items:*').
   */
  async invalidatePattern(pattern) {
    const client = getRedisClient()
    if (!isRedisReady()) {
      return 0
    }

    try {
      const keys = await client.keys(pattern)
      if (keys && keys.length > 0) {
        await client.del(...keys)
        console.log(`🧹 [Redis Cache] INVALIDATED PATTERN: "${pattern}" (${keys.length} key${keys.length === 1 ? '' : 's'} removed)`)
        return keys.length
      }
      return 0
    } catch (err) {
      console.warn(`⚠️  [Redis Cache] Invalidation error for pattern "${pattern}":`, err.message)
      return 0
    }
  },

  /**
   * Complete item cache invalidation helper:
   * Invalidates catalog lists and specific item detail.
   */
  async invalidateItemCache(itemId) {
    if (itemId) {
      await this.del(generateItemDetailKey(itemId))
    }
    // Invalidate all cached list views (categories, searches, pagination)
    return await this.invalidatePattern('items:list:*')
  }
}

export default cacheService
