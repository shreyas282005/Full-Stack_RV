import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwt: {
    secret: process.env.JWT_SECRET || 'borrowbox_fallback_secret_key_never_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    defaultTtl: parseInt(process.env.REDIS_CACHE_TTL || '300', 10), // 5 minutes default
    itemDetailTtl: parseInt(process.env.REDIS_ITEM_DETAIL_TTL || '600', 10) // 10 minutes default
  }
}

export default config
