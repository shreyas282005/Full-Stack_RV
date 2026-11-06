import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import prisma from '../db.js'
import { UnauthorizedError } from '../errors/AppError.js'

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header. Expected Bearer token.')
    }

    const token = authHeader.split(' ')[1]
    let decoded
    try {
      decoded = jwt.verify(token, config.jwt.secret)
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Authentication token has expired. Please log in again.')
      }
      throw new UnauthorizedError('Invalid authentication token.')
    }

    // Verify user exists in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        locality: true
      }
    })

    if (!user) {
      throw new UnauthorizedError('User account associated with this token no longer exists.')
    }

    // Attach verified user identity to request object
    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

// Optional auth middleware for routes that work for both guests and logged-in users
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      try {
        const decoded = jwt.verify(token, config.jwt.secret)
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            name: true,
            locality: true
          }
        })
        if (user) {
          req.user = user
        }
      } catch {
        // Ignore token errors for optional auth
      }
    }
    next()
  } catch (error) {
    next(error)
  }
}

