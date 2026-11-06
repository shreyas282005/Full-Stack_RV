import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'

let io = null

export function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Allows development client proxy and local cross-origin
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 20000,
    pingInterval: 25000
  })

  // 1. Socket Authentication Middleware
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.split(' ')[1]
          : null)

      if (!token) {
        return next(new Error('Authentication error: Token required'))
      }

      let decoded
      try {
        decoded = jwt.verify(token, config.jwt.secret)
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return next(new Error('Authentication error: Token expired'))
        }
        return next(new Error('Authentication error: Invalid token'))
      }

      // Attach authenticated identity to socket
      socket.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name
      }

      next()
    } catch (err) {
      next(new Error('Authentication error: ' + err.message))
    }
  })

  // 2. Connection Handler & Server-Controlled Room Management
  io.on('connection', (socket) => {
    const userId = socket.user.id
    const userRoom = `user:${userId}`

    // Automatically join the authenticated user's private room
    // Never allow client-initiated joining of arbitrary rooms
    socket.join(userRoom)
    console.log(`🔌 [Socket.IO] User "${socket.user.name}" connected (ID: ${userId}) -> Joined room "${userRoom}"`)

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [Socket.IO] User "${socket.user.name}" disconnected (Reason: ${reason})`)
    })
  })

  return io
}

export function getIO() {
  return io
}

/**
 * Emits an event to a specific user's private authenticated room.
 */
export function emitToUser(userId, eventName, payload) {
  if (io) {
    const room = `user:${userId}`
    io.to(room).emit(eventName, payload)
    console.log(`📡 [Socket.IO] Emitted "${eventName}" to room "${room}"`)
  }
}

/**
 * Broadcasts an event to all connected authenticated clients.
 */
export function broadcastEvent(eventName, payload) {
  if (io) {
    io.emit(eventName, payload)
    console.log(`📡 [Socket.IO] Broadcasted "${eventName}" to all clients`)
  }
}

export default {
  initSocketServer,
  getIO,
  emitToUser,
  broadcastEvent
}

