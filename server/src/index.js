import http from 'http'
import express from 'express'
import cors from 'cors'
import { config } from './config/env.js'
import prisma from './db.js'

// Redis & Socket.IO
import { getRedisClient, isRedisReady, closeRedis } from './redis/client.js'
import { initSocketServer } from './socket/index.js'

// Routes
import authRoutes from './routes/auth.routes.js'
import itemRoutes from './routes/item.routes.js'
import borrowRoutes from './routes/borrow.routes.js'
import notificationRoutes from './routes/notification.routes.js'

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { apiLimiter } from './middleware/rateLimiter.js'

const app = express()
const httpServer = http.createServer(app)

// Initialize Socket.IO Server on the HTTP instance
const io = initSocketServer(httpServer)

// Initialize Redis Client connection attempt
getRedisClient()

// Global Middleware
app.use(cors())
app.use(express.json())

// Apply API rate limiter to all /api routes (backed by Redis when connected, MemoryStore otherwise)
app.use('/api', apiLimiter)

// ----------------------------------------------------
// Health Check Endpoints
// ----------------------------------------------------

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`

    res.status(200).json({
      status: 'ok',
      message: 'BorrowBox backend, database, and real-time services are operational',
      timestamp: new Date().toISOString(),
      services: {
        server: 'up',
        database: 'connected',
        redis: isRedisReady() ? 'connected' : 'offline (fallback mode)',
        socketIO: 'active'
      }
    })
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      message: 'Backend is running but database is unreachable',
      timestamp: new Date().toISOString(),
      services: {
        server: 'up',
        database: 'disconnected',
        redis: isRedisReady() ? 'connected' : 'offline (fallback mode)',
        socketIO: 'active'
      },
      error: error.message
    })
  }
})

app.get('/api/health/db', async (req, res) => {
  try {
    const [userCount, itemCount, borrowRequestCount, notificationCount] = await Promise.all([
      prisma.user.count(),
      prisma.item.count(),
      prisma.borrowRequest.count(),
      prisma.notification.count()
    ])

    res.status(200).json({
      status: 'ok',
      database: 'connected',
      redis: isRedisReady() ? 'connected' : 'offline (fallback mode)',
      timestamp: new Date().toISOString(),
      counts: {
        users: userCount,
        items: itemCount,
        borrowRequests: borrowRequestCount,
        notifications: notificationCount
      }
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message
    })
  }
})

// Optional C++ Crow Microservice Health Proxy
app.get('/api/crow-health', async (req, res) => {
  try {
    const crowUrl = process.env.CROW_SERVICE_URL || 'http://crow:8080'
    const crowRes = await fetch(`${crowUrl}/health`, { signal: AbortSignal.timeout(1500) })
    const crowData = await crowRes.json()
    return res.status(200).json({
      status: 'ok',
      bonus: 'C++ Crow Microservice is operational',
      data: crowData
    })
  } catch {
    return res.status(200).json({
      status: 'offline',
      service: 'crow-microservice',
      message: 'Optional C++ Crow microservice is not running. Launch it with: docker compose --profile bonus up crow or cd bonus/crow-service'
    })
  }
})

// ----------------------------------------------------
// API Route Modules
// ----------------------------------------------------

app.use('/api/auth', authRoutes)
app.use('/api/items', itemRoutes)
app.use('/api/borrow-requests', borrowRoutes)
app.use('/api/notifications', notificationRoutes)

// Root API Directory
app.get('/', (req, res) => {
  res.json({
    name: 'BorrowBox API',
    tagline: 'Borrow More. Own Less.',
    version: '1.0.0',
    documentation: '/docs/API.md',
    services: {
      database: 'PostgreSQL + Prisma',
      caching: isRedisReady() ? 'Redis Active' : 'PostgreSQL Fallback',
      realTime: 'Socket.IO (Authenticated)'
    },
    endpoints: {
      health: '/api/health',
      dbHealth: '/api/health/db',
      auth: {
        demoUsers: 'GET /api/auth/demo-users',
        demoLogin: 'POST /api/auth/demo-login',
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        profile: 'GET /api/auth/me (Bearer token)'
      },
      items: {
        list: 'GET /api/items?search=&category=&status=&locality=&page=&limit=',
        detail: 'GET /api/items/:id',
        create: 'POST /api/items (Bearer token)',
        update: 'PATCH /api/items/:id (Bearer token)',
        delete: 'DELETE /api/items/:id (Bearer token)'
      },
      borrowRequests: {
        create: 'POST /api/borrow-requests (Bearer token)',
        outgoing: 'GET /api/borrow-requests/outgoing (Bearer token)',
        incoming: 'GET /api/borrow-requests/incoming (Bearer token)',
        detail: 'GET /api/borrow-requests/:id (Bearer token)',
        approve: 'POST /api/borrow-requests/:id/approve (Bearer token)',
        reject: 'POST /api/borrow-requests/:id/reject (Bearer token)',
        cancel: 'POST /api/borrow-requests/:id/cancel (Bearer token)',
        activate: 'POST /api/borrow-requests/:id/activate (Bearer token)',
        return: 'POST /api/borrow-requests/:id/return (Bearer token)'
      },
      notifications: {
        list: 'GET /api/notifications?unreadOnly=&page=&limit= (Bearer token)',
        unreadCount: 'GET /api/notifications/unread-count (Bearer token)',
        markAsRead: 'PATCH /api/notifications/:id/read (Bearer token)',
        markAllAsRead: 'PATCH /api/notifications/read-all (Bearer token)'
      }
    }
  })
})

// 404 & Centralized Error Handlers
app.use(notFoundHandler)
app.use(errorHandler)

const server = httpServer.listen(config.port, () => {
  console.log(`BorrowBox backend listening on http://localhost:${config.port}`)
})

// Graceful error handling for port in use
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${config.port} is already in use by another running instance.`)
    console.error(`   Please close the other terminal running the server, or stop the process using port ${config.port}.\n`)
  } else {
    console.error('Server error:', err)
  }
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down BorrowBox services...')
  await prisma.$disconnect()
  await closeRedis()
  server.close(() => {
    process.exit(0)
  })
})

export { app, httpServer, io }
export default app
