import prisma from '../db.js'
import { NotFoundError, ForbiddenError } from '../errors/AppError.js'
import { NotificationType } from '@prisma/client'
import { emitToUser } from '../socket/index.js'

export const createNotification = async (
  { userId, title, message, type = NotificationType.SYSTEM },
  tx = prisma
) => {
  const notification = await tx.notification.create({
    data: {
      userId,
      title,
      message,
      type
    }
  })

  // If created outside a multi-statement transaction, emit immediately
  if (tx === prisma) {
    emitToUser(userId, 'notification:new', notification)
  }

  return notification
}

export const getUserNotifications = async (
  userId,
  { unreadOnly = false, page = 1, limit = 30 } = {}
) => {
  const where = {
    userId,
    ...(unreadOnly ? { read: false } : {})
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, read: false } })
  ])

  return {
    notifications,
    unreadCount,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}

export const getUnreadCount = async (userId) => {
  const count = await prisma.notification.count({
    where: { userId, read: false }
  })
  return { unreadCount: count }
}

export const markAsRead = async (notificationId, userId) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId }
  })

  if (!notification) {
    throw new NotFoundError('Notification not found')
  }

  if (notification.userId !== userId) {
    throw new ForbiddenError('You can only modify your own notifications')
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true }
  })

  // Emit real-time read event to user's room
  emitToUser(userId, 'notification:read', { id: notificationId })

  return updated
}

export const markAllAsRead = async (userId) => {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      read: false
    },
    data: { read: true }
  })

  // Emit real-time read-all event to user's room
  emitToUser(userId, 'notification:read-all', { updatedCount: result.count })

  return { updatedCount: result.count }
}
