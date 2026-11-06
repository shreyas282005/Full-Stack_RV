import { Router } from 'express'
import * as authController from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { loginSchema, demoLoginSchema, registerSchema } from '../schemas/auth.schema.js'
import { authLimiter } from '../middleware/rateLimiter.js'

const router = Router()

// Public demo login (pre-seeded users)
router.post('/demo-login', authLimiter, validate(demoLoginSchema), authController.demoLogin)

// Public standard login
router.post('/login', authLimiter, validate(loginSchema), authController.login)

// Public standard registration
router.post('/register', authLimiter, validate(registerSchema), authController.register)

// Public list of demo users for frontend demo selector
router.get('/demo-users', authController.getDemoUsers)

// Protected current user profile
router.get('/me', authenticate, authController.getMe)

export default router

