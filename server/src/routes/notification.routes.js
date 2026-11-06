import { Router } from 'express'
import * as notificationController from '../controllers/notification.controller.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  notificationIdParamSchema,
  listNotificationsSchema
} from '../schemas/notification.schema.js'

const router = Router()

// All notification routes require authentication
router.use(authenticate)

// Get my notifications
router.get('/', validate(listNotificationsSchema), notificationController.getMyNotifications)

// Fast unread count badge
router.get('/unread-count', notificationController.getUnreadCount)

// Mark single notification as read
router.patch('/:id/read', validate(notificationIdParamSchema), notificationController.markAsRead)

// Mark all as read
router.patch('/read-all', notificationController.markAllAsRead)

export default router

