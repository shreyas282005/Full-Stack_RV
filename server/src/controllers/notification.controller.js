import * as notificationService from '../services/notification.service.js'

export const getMyNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getUserNotifications(req.user.id, req.query)
    res.status(200).json({
      success: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
      pagination: result.pagination
    })
  } catch (error) {
    next(error)
  }
}

export const getUnreadCount = async (req, res, next) => {
  try {
    const result = await notificationService.getUnreadCount(req.user.id)
    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const markAsRead = async (req, res, next) => {
  try {
    const updated = await notificationService.markAsRead(req.params.id, req.user.id)
    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: updated
    })
  } catch (error) {
    next(error)
  }
}

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id)
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

