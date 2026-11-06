import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../db.js'
import { config } from '../config/env.js'
import { BadRequestError, UnauthorizedError, ConflictError } from '../errors/AppError.js'

// Helper to sanitize user object (never expose passwordHash)
export const sanitizeUser = (user) => {
  const { passwordHash, ...safeUser } = user // eslint-disable-line no-unused-vars
  return safeUser
}

// Generate JWT token for user
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  )
}

export const login = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  })

  if (!user) {
    throw new UnauthorizedError('Invalid email or password.')
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password.')
  }

  const token = generateToken(user)
  return {
    user: sanitizeUser(user),
    token
  }
}

export const demoLogin = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  })

  if (!user) {
    throw new BadRequestError(`Demo user "${email}" not found. Please ensure database seed was executed.`)
  }

  const token = generateToken(user)
  return {
    user: sanitizeUser(user),
    token
  }
}

export const register = async ({ name, email, password, locality }) => {
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  })

  if (existing) {
    throw new ConflictError('An account with this email address already exists.')
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const newUser = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      locality
    }
  })

  const token = generateToken(newUser)
  return {
    user: sanitizeUser(newUser),
    token
  }
}

export const getDemoUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      locality: true,
      _count: {
        select: {
          items: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  return users
}

export const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      locality: true,
      createdAt: true,
      _count: {
        select: {
          items: true,
          borrowRequests: true,
          receivedRequests: true,
          notifications: true
        }
      }
    }
  })

  return user
}

